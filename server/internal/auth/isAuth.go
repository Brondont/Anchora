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

type ErrorResponse struct {
	Message string `json:"message"`
}

// IsAuth wraps an http.HandlerFunc and validates the JWT token
func IsAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			err := errors.New("authorization header missing")
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		// Check if the header has the Bearer prefix
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			err := errors.New("invalid token format")
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		token := tokenParts[1]

		// Parse and validate the token
		parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, jwt.ErrSignatureInvalid
			}

			return []byte(config.Envs.JWTSecret), nil
		})
		if err != nil {
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		// Verify if token is valid
		if !parsedToken.Valid {
			err := errors.New("invalid token")
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		// Extract claims
		claims, ok := parsedToken.Claims.(jwt.MapClaims)
		if !ok {
			err := errors.New("unable to extract jwt token info")
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		// Extract userID and add it to request context
		userID, ok := claims["userID"].(float64)
		if !ok {
			err := errors.New("invalid user ID in token")
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		// extract is adming flag
		isAdmin, ok := claims["isAdmin"].(bool)
		if !ok {
			err := errors.New("invalid isAdmin value in token")
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		// Create new context with claims
		ctx := context.WithValue(r.Context(), "userID", int(userID))
		ctx = context.WithValue(ctx, "isAdmin", isAdmin)
		// Add all claims to context
		ctx = context.WithValue(ctx, "claims", claims)

		// Create new request with updated context
		extendedRequest := r.WithContext(ctx)

		// Call the next handler with our extended request
		next.ServeHTTP(w, extendedRequest)
	}
}
