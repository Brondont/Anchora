package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/Brondont/trust-api/config"
	"github.com/Brondont/trust-api/utils"
	"github.com/golang-jwt/jwt/v5"
)

// ValidateToken parses and validates a JWT token, returning claims.
func ValidateToken(r *http.Request) (jwt.MapClaims, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, errors.New("authorization header missing")
	}

	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return nil, errors.New("invalid token format")
	}

	token := tokenParts[1]

	// Parse and validate the token
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		// Ensure the signing method matches
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(config.Envs.JWTSecret), nil
	})
	if err != nil {
		return nil, errors.New("invalid token: " + err.Error())
	}

	// Extract claims safely
	if claims, ok := parsedToken.Claims.(jwt.MapClaims); ok && parsedToken.Valid {
		return claims, nil
	}

	return nil, errors.New("unable to extract JWT claims")
}

// HasRole checks if a user has the required role.
func HasRole(claims jwt.MapClaims, requiredRole string) bool {
	roles, ok := claims["roles"].([]interface{})
	if !ok {
		return false
	}

	for _, role := range roles {
		if roleStr, ok := role.(string); ok {
			if roleStr == "admin" || roleStr == requiredRole {
				return true
			}
		}
	}
	return false
}

// RequireRole is a middleware that checks if the user has a required role.
func RequireRole(requiredRole string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := ValidateToken(r)
		if err != nil {
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		if !HasRole(claims, requiredRole) {
			utils.WriteError(w, http.StatusForbidden, errors.New("insufficient permissions"))
			return
		}

		ctx := context.WithValue(r.Context(), "userID", claims["userID"])
		ctx = context.WithValue(ctx, "claims", claims)

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
