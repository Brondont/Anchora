package auth

import (
	"github.com/Brondont/trust-api/config"
	"github.com/golang-jwt/jwt/v5"
)

// CreateJWT Creates user login token
func CreateJWT(userID uint, isAdmin bool) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"userID":  userID,
		"isAdmin": isAdmin,
	})

	tokenString, err := token.SignedString([]byte(config.Envs.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
