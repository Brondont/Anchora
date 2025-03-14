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
	TokenExpirationTime         = 24 * time.Hour // Token valid for 24 hours
	PasswordTokenExpirationTime = time.Hour
)

// AuthClaims defines the claims for the authentication token.
type AuthClaims struct {
	UserID    string   `json:"userID"`
	Roles     []string `json:"roles"`
	IsActive  bool     `json:"isActive"`
	TokenType string   `json:"type"`
	jwt.RegisteredClaims
}

// VerificationClaims defines the claims for the verification token
type VerificationClaims struct {
	Email               string `json:"email"`
	TokenType           string `json:"type"`
	PasswordFingerprint string `json:"passwordFingerPrint"`
	jwt.RegisteredClaims
}

type PasswordResetClaims struct {
	Email               string `json:"email"`
	TokenType           string `json:"tokenType"`
	PasswordFingerprint string `json:"passwordFingerPrint"`
	jwt.RegisteredClaims
}

// CreateAuthToken generates a JWT token for user authenticatio
func CreateAuthToken(userID uint, roles []models.Role, isActive bool) (string, error) {
	// Convert Role structs to a slice of role names (strings)
	var roleNames []string
	for _, role := range roles {
		roleNames = append(roleNames, role.Name)
	}
	// Build the claims using the AuthClaims struct
	claims := AuthClaims{
		UserID:    strconv.FormatUint(uint64(userID), 10),
		Roles:     roleNames,
		IsActive:  isActive,
		TokenType: "auth",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(TokenExpirationTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Create token with typed claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.Envs.JWTSecret))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

// CrateVerificationToken creates the verification token for account
func CreateVerificationToken(email string, password string) (string, error) {
	// we use the first hashed letters of password and hash them again with sha256 so when the user changes his password
	// the old JWT become invalid
	passwordFingerprint := utils.HashSHA256(password)[:8]

	claims := VerificationClaims{
		Email:               email,
		TokenType:           "verification",
		PasswordFingerprint: passwordFingerprint,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(TokenExpirationTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.Envs.JWTSecret))
	if err != nil {
		return "", errors.New("failed to generate reset token")
	}

	return tokenString, nil
}

// CreatePasswordResetToken generates a password reset token and returns the reset URL.
func CreatePasswordResetToken(email, password string) (string, error) {
	passwordFingerprint := utils.HashSHA256(password)[:8]

	claims := PasswordResetClaims{
		Email:               email,
		TokenType:           "password-reset",
		PasswordFingerprint: passwordFingerprint,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(PasswordTokenExpirationTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(config.Envs.JWTSecret))
	if err != nil {
		return "", errors.New("failed to generate reset token")
	}

	return tokenString, nil
}

// ParseVerificationToken validates and parses a verification token, returning the claims
func ParseVerificationToken(tokenString string) (*VerificationClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &VerificationClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.Envs.JWTSecret), nil
	})
	if err != nil {
		return nil, errors.New("failed to parse token: " + err.Error())
	}

	claims, ok := token.Claims.(*VerificationClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	// Verify token type
	if claims.TokenType != "verification" {
		return nil, errors.New("invalid token type")
	}

	// Check token expiration (redundant since jwt.Parse already checks this, but kept for clarity)
	if claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, errors.New("token has expired")
	}

	return claims, nil
}

// ParsePasswordResetToken validates and parses a password reset token
func ParsePasswordResetToken(tokenString string) (*PasswordResetClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &PasswordResetClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.Envs.JWTSecret), nil
	})
	if err != nil {
		return nil, errors.New("failed to parse token: " + err.Error())
	}

	claims, ok := token.Claims.(*PasswordResetClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	// Verify token type
	if claims.TokenType != "password-reset" {
		return nil, errors.New("invalid token type")
	}

	// Check token expiration
	if claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, errors.New("token has expired")
	}

	return claims, nil
}
