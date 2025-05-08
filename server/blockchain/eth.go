package blockchain

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Brondont/trust-api/config"
	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/models"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Global ABI and client cache
var (
	factoryABI abi.ABI
	ethClient  *ethclient.Client
)

// getClient returns a shared eth client
func getClient() (*ethclient.Client, error) {
	if ethClient != nil {
		return ethClient, nil
	}

	var err error
	ethClient, err = ethclient.Dial(config.Envs.BlockchainRPCURL)
	if err != nil {
		return nil, fmt.Errorf("connecting to blockchain: %w", err)
	}
	return ethClient, nil
}

// getABI loads the ABI from file or returns the cached version
func getABI() (abi.ABI, error) {
	// If ABI is already loaded, return it
	if factoryABI.Methods != nil {
		return factoryABI, nil
	}

	// Otherwise load it from file
	path := filepath.Join("blockchain", "OfferFactory.json")
	raw, err := os.ReadFile(path)
	if err != nil {
		return abi.ABI{}, fmt.Errorf("reading ABI file: %w", err)
	}

	// Parse the ABI
	factoryABI, err = abi.JSON(bytes.NewReader(raw))
	if err != nil {
		return abi.ABI{}, fmt.Errorf("parsing ABI: %w", err)
	}

	return factoryABI, nil
}

// UserHasRole checks if a user has a specific role on the blockchain
func UserHasRole(userAddr string, roleName string) (bool, error) {
	// Connect to Ethereum node
	client, err := getClient()
	if err != nil {
		return false, err
	}

	// Get the ABI
	parsedABI, err := getABI()
	if err != nil {
		return false, err
	}

	// Convert addresses
	contractAddr := common.HexToAddress(config.Envs.OfferFactoryAddress)
	userAddress := common.HexToAddress(userAddr)

	var roleIdentifier string
	switch strings.ToLower(roleName) {
	case "admin":
		roleIdentifier = "DEFAULT_ADMIN_ROLE"
	case "tender":
		roleIdentifier = "TENDER_ROLE"
	case "entrepreneur":
		roleIdentifier = "ENTREPRENEUR_ROLE"
	case "expert":
		roleIdentifier = "EXPERT_ROLE"
	default:
		roleIdentifier = strings.ToUpper(roleName) + "_ROLE"
	}

	var roleHash common.Hash
	if roleIdentifier == "DEFAULT_ADMIN_ROLE" {
		roleHash = common.Hash{} // DEFAULT_ADMIN_ROLE is 0x00 in AccessControl
	} else {
		// For other roles, calculate the hash
		roleHash = crypto.Keccak256Hash([]byte(roleIdentifier))
	}

	// Set up call with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

	defer cancel()
	callOpts := &bind.CallOpts{Context: ctx}

	// Create caller interface
	caller := bind.NewBoundContract(contractAddr, parsedABI, client, nil, nil)

	// Make the actual call
	var result []interface{}
	err = caller.Call(callOpts, &result, "hasRole", roleHash, userAddress)
	if err != nil {
		return false, fmt.Errorf("contract call failed: %w", err)
	}

	// Check if we got a result and it's a boolean
	if len(result) == 0 {
		return false, fmt.Errorf("empty result from contract")
	}

	hasRole, ok := result[0].(bool)
	if !ok {
		return false, fmt.Errorf("unexpected return type: %T", result[0])
	}

	return hasRole, nil
}

// ChainSyncDB synchronizes user roles with blockchain data
func ChainSyncDB() {
	// Get all users with their roles
	var users []models.User
	if err := db.DB.DB.Preload("Roles").Find(&users).Error; err != nil {
		log.Printf("Failed to load users: %v", err)
		return
	}

	// Check each role against blockchain
	for _, u := range users {
		// Skip users without wallet address
		if u.PublicWalletAddress == "" {
			continue
		}

		for _, role := range u.Roles {
			// Check if role exists on blockchain
			hasRole, err := UserHasRole(u.PublicWalletAddress, role.Name)
			if err != nil {
				log.Printf("User %d (%s): Error checking role %s: %v",
					u.ID, u.PublicWalletAddress, role.Name, err)
				continue
			}

			// Remove role if not on blockchain
			if !hasRole {
				if err := db.DB.DB.Model(&u).Association("Roles").Delete(&role); err != nil {
					log.Printf("User %d: Failed to remove role %s: %v",
						u.ID, role.Name, err)
				} else {
					log.Printf("User %d: Removed stale role %s", u.ID, role.Name)
				}
			}
		}
	}
}
