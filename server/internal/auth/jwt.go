package auth

import (
	"time"

	"github.com/Brondont/trust-api/config"
	"github.com/Brondont/trust-api/models"
	"github.com/golang-jwt/jwt/v5"
)

// CreateJWT generates a JWT token for user authentication
func CreateJWT(userID uint, roles []models.Role) (string, error) {
	// Convert Role structs to a slice of role names (strings)
	var roleNames []string
	for _, role := range roles {
		roleNames = append(roleNames, role.Name)
	}

	// Define token claims
	claims := jwt.MapClaims{
		"userID": userID,
		"roles":  roleNames,
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
