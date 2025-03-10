package auth

import (
	"errors"
	"strconv"
	"time"

	"github.com/Brondont/trust-api/config"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
	"github.com/golang-jwt/jwt/v5"
)

const (
	TokenExpirationTime = 24 * time.Hour // Token valid for 24 hours
	TokenType           = "verification"
)

// VerificationClaims defines the claims for the verification token
type VerificationClaims struct {
	UserID    uint   `json:"userID"`
	Email     string `json:"email"`
	TokenType string `json:"type"`
	jwt.RegisteredClaims
}

// CreateJWT generates a JWT token for user authentication
func CreateJWT(userID uint, roles []models.Role) (string, error) {
	// Convert Role structs to a slice of role names (strings)
	var roleNames []string
	for _, role := range roles {
		roleNames = append(roleNames, role.Name)
	}
	// Define token claims
	claims := jwt.MapClaims{
		"userID": strconv.FormatUint(uint64(userID), 10),
		"roles":  roleNames,
		"type":   "auth",
		"exp":    time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}
	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// Sign token with secret key
	tokenString, err := token.SignedString([]byte(config.Envs.JWTSecret))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// CrateVerificationToken creates the verification token for account
func CreateVerificationToken(email string) (string, string, error) {
	claims := VerificationClaims{
		Email:     email,
		TokenType: TokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(TokenExpirationTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.Envs.JWTSecret))
	if err != nil {
		return "", "", err
	}

	// Store token hash in the database
	tokenHash := utils.HashSHA256(tokenString)

	return tokenHash, tokenString, nil
}

// ParseVerificationToken validates and parses a verification token, returning the claims
func ParseVerificationToken(tokenString string) (*VerificationClaims, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &VerificationClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.Envs.JWTSecret), nil
	})

	if err != nil {
		return nil, errors.New("failed to parse token: " + err.Error())
	}

	// Extract claims
	if claims, ok := token.Claims.(*VerificationClaims); ok && token.Valid {
		// Verify token type
		if claims.TokenType != TokenType {
			return nil, errors.New("invalid token type")
		}

		// Check token expiration
		if claims.ExpiresAt.Time.Before(time.Now()) {
			return nil, errors.New("token has expired")
		}

		return claims, nil
	}

	return nil, errors.New("invalid token claims")
}
