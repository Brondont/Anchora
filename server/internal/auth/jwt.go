package auth

import (
	"errors"
	"strconv"
	"time"

	"github.com/Brondont/trust-api/config"
	"github.com/Brondont/trust-api/db"
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
func CreateVerificationToken(userID uint, email string) (string, error) {
	claims := VerificationClaims{
		UserID:    userID,
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
		return "", err
	}

	// Store token hash in the database
	tokenHash := utils.HashSHA256(tokenString)

	// Update user with verification token hash
	result := db.DB.DB.Model(&models.User{}).Where("id = ?", userID).Update("account_activation_hash", tokenHash)
	if result.Error != nil {
		return "", result.Error
	}

	return tokenString, nil
}

// ValidateVerificationToken validates the token and returns the user information if valid
func ValidateVerificationToken(tokenString string) (*models.User, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &VerificationClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.Envs.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	// Check if token is valid
	claims, ok := token.Claims.(*VerificationClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}

	// Check token type
	if claims.TokenType != TokenType {
		return nil, errors.New("invalid token type")
	}

	// Fetch the user
	var user models.User
	if err := db.DB.DB.Where("id = ? AND email = ?", claims.UserID, claims.Email).First(&user).Error; err != nil {
		return nil, err
	}

	// Check if token has been used (if account_activation_hash is empty, token has been used)
	if user.AccountActivationHash == "" {
		return nil, errors.New("token has already been used")
	}

	return &user, nil
}

// TODO WE NEED TO ACDTUALLY IMPLEMENT THIS ACCOUNT ACTIVATION TYPE SYSTEM ITS REALLLY COOOOOOL
// TODO imporve how we handle user tokens, look into Refresh and Access token for bettter security, currently
// TODO storing the token on the frontend in localstorage which is really bad
