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

// ValidateAuthToken parses and validates an authentication JWT token, returning AuthClaims.
// It ensures that the token is of type "auth" and that the user's account is active.
func ValidateAuthToken(r *http.Request) (*AuthClaims, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, errors.New("authorization header missing")
	}

	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		return nil, errors.New("invalid token format")
	}
	tokenString := tokenParts[1]

	// Parse the token into AuthClaims
	token, err := jwt.ParseWithClaims(tokenString, &AuthClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Ensure the signing method is HMAC
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(config.Envs.JWTSecret), nil
	})
	if err != nil {
		return nil, errors.New("invalid token: " + err.Error())
	}

	claims, ok := token.Claims.(*AuthClaims)
	if !ok || !token.Valid {
		return nil, errors.New("unable to extract JWT claims")
	}

	// Ensure token type is "auth"
	if claims.TokenType != "auth" {
		return nil, errors.New("invalid token type")
	}

	// Check if the user's account is active
	if !claims.IsActive {
		return nil, errors.New("account is not active")
	}

	return claims, nil
}

// HasRole checks if a user (represented by AuthClaims) has the required role.
func HasRole(claims *AuthClaims, requiredRole string) bool {
	for _, role := range claims.Roles {
		if role == "admin" || role == requiredRole {
			return true
		}
	}
	return false
}

// RequireRole is a middleware that verifies the token, checks for the required role,
// and ensures that the user's account is active.
func RequireRole(requiredRole string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := ValidateAuthToken(r)
		if err != nil {
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		if !HasRole(claims, requiredRole) {
			utils.WriteError(w, http.StatusForbidden, errors.New("insufficient permissions"))
			return
		}

		// Set userID and claims in context for downstream handlers
		ctx := context.WithValue(r.Context(), "userID", claims.UserID)
		ctx = context.WithValue(ctx, "claims", claims)

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
