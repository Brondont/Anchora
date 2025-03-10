package middleware

import (
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

func ValidatePassword(password string) []InputValidationError {
	var errors []InputValidationError
	var passedChecks int

	// Check 1: Length requirement
	if len(password) >= 8 {
		passedChecks++
	} else {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: "password",
			Msg:   "must be at least 8 characters long",
			Path:  "password",
		})
	}

	// Check 2: Uppercase letter
	uppercaseRegex := regexp.MustCompile(`[A-Z]`)
	if uppercaseRegex.MatchString(password) {
		passedChecks++
	} else {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: "password",
			Msg:   "must contain at least one uppercase letter",
			Path:  "password",
		})
	}

	// Check 3: Number
	numberRegex := regexp.MustCompile(`\d`)
	if numberRegex.MatchString(password) {
		passedChecks++
	} else {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: "password",
			Msg:   "must contain at least one number",
			Path:  "password",
		})
	}

	// Check 4: Special character
	specialCharRegex := regexp.MustCompile(`[!@#$%^&*(),.?":{}|<>]`)
	if specialCharRegex.MatchString(password) {
		passedChecks++
	} else {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: "password",
			Msg:   "must contain at least one special character",
			Path:  "password",
		})
	}

	// If at least 3 out of 4 criteria are met, remove all password errors
	if passedChecks >= 3 {
		return []InputValidationError{}
	}

	// Add a summary error
	errors = append(errors, InputValidationError{
		Type:  "invalid",
		Value: "password",
		Msg:   "must meet at least 3 out of 4 password requirements",
		Path:  "password",
	})

	return errors
}
