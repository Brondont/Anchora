package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/Brondont/trust-api/config"
	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
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

	if claims.TokenType != "auth" {
		return nil, errors.New("invalid token type")
	}

	// Validate user existence and current state
	var user models.User
	err = db.DB.DB.Preload("Roles").Where("id = ?", claims.UserID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, errors.New("failed to validate user")
	}

	if !user.IsActive {
		return nil, errors.New("account is not active")
	}

	// Validate roles consistency
	currentRoles := make(map[string]struct{}, len(user.Roles))
	for _, role := range user.Roles {
		currentRoles[role.Name] = struct{}{}
	}

	// Quick length check first for performance
	if len(currentRoles) != len(claims.Roles) {
		return nil, errors.New("user roles mismatch")
	}

	// Detailed role check
	for _, claimedRole := range claims.Roles {
		if _, ok := currentRoles[claimedRole]; !ok {
			return nil, errors.New("user roles mismatch")
		}
	}

	return claims, nil
}

// HasRole checks if a user (represented by AuthClaims) has any of the required roles.
// If no roles are specified (len(requiredRoles) == 0), it returns true, allowing access.
func HasRole(claims *AuthClaims, requiredRoles []string) bool {
	// No specific role required – allow any authenticated user.
	if len(requiredRoles) == 0 {
		return true
	}

	for _, userRole := range claims.Roles {
		// The "admin" role has override access.
		if userRole == "admin" {
			return true
		}
		for _, requiredRole := range requiredRoles {
			if userRole == requiredRole {
				return true
			}
		}
	}
	return false
}

// RequireRole is a middleware that verifies the token and checks that the user has at least one
// of the required roles. If no roles are provided, any authenticated user is allowed.
func RequireRole(next http.HandlerFunc, requiredRoles ...string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, err := ValidateAuthToken(r)
		if err != nil {
			utils.WriteError(w, http.StatusUnauthorized, err)
			return
		}

		if !HasRole(claims, requiredRoles) {
			utils.WriteError(w, http.StatusForbidden, errors.New("insufficient permissions"))
			return
		}

		// Set userID and claims in context for downstream handlers
		ctx := context.WithValue(r.Context(), "userID", claims.UserID)
		ctx = context.WithValue(ctx, "claims", claims)

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
