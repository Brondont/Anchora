package middleware

import (
	"fmt"
	"regexp"

	"github.com/Brondont/trust-api/models"
)

type InputValidationError struct {
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
	Msg   string      `json:"msg"`
	Path  string      `json:"path"`
}

type ErrorResponse struct {
	Error []InputValidationError `json:"error"`
}

// ValidateUserInput: Validates user sign up infromation
func ValidateUserInput(payload models.User) []InputValidationError {
	var errors []InputValidationError

	// Validate email
	if !isValidEmail(payload.Email) {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: payload.Email,
			Msg:   "is not a valid email address",
			Path:  "email",
		})
	}

	// Validate username length
	if len(payload.FirstName) < 5 {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: payload.FirstName,
			Msg:   "must be at least 5 characters long",
			Path:  "firstName",
		})
	}

	if len(payload.LastName) < 5 {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: payload.LastName,
			Msg:   "must be at least 5 characters long",
			Path:  "lastName",
		})
	}

	return errors
}

// Helper functions remain the same
func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

func validatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	// TODOMAYBE: add upper case special case kind of password validation
	return nil
}
