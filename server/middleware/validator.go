package middleware

import (
	"fmt"
	"net/mail"
	"regexp"
	"strconv"
	"time"

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

// Add new struct to hold parsed offer data
type OfferFormData struct {
	ContractAddress         string
	Title                   string
	Budget                  float64
	Currency                string
	SectorID                uint
	TenderNumber            string
	Description             string
	MinQualificationLevel   string
	ProposalSubmissionStart time.Time
	ProposalSubmissionEnd   time.Time
	ProposalReviewStart     time.Time
	ProposalReviewEnd       time.Time
}

type OfferValidationRequest struct {
	Fields map[string][]string
}

type ValidationResult struct {
	Valid bool
	Error error
}

// IsValidEmail checks if an email address is valid.
func IsValidEmail(email string) bool {
	_, err := mail.ParseAddress(email)
	return err == nil
}

// IsValidPhoneNumber checks if a phone number matches a basic pattern.
func IsValidPhoneNumber(phone string) bool {
	re := regexp.MustCompile(`^\+?[1-9]\d{1,14}$`) // Supports international format
	return re.MatchString(phone)
}

// ValidateUserInput: Validates user sign up infromation
func ValidateUserInput(payload models.User) []InputValidationError {
	var errors []InputValidationError

	// Validate email
	if !IsValidEmail(payload.Email) {
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

func ValidateOfferForm(formData map[string][]string) (OfferFormData, []InputValidationError) {
	var errors []InputValidationError
	result := OfferFormData{}

	// Validate required fields
	requiredFields := []string{"contractAddress", "title", "budget", "currency", "sectorID",
		"proposalSubmissionStart", "proposalSubmissionEnd", "proposalReviewStart", "proposalReviewEnd"}

	for _, field := range requiredFields {
		if len(formData[field]) == 0 {
			errors = append(errors, InputValidationError{
				Type: "required",
				Msg:  fmt.Sprintf("%s is required", field),
				Path: field,
			})
		}
	}

	if len(errors) > 0 {
		return result, errors
	}

	// Parse and validate individual fields
	result.ContractAddress = formData["contractAddress"][0]
	result.Title = formData["title"][0]
	result.Currency = formData["currency"][0]

	// Parse budget
	if budget, err := strconv.ParseFloat(formData["budget"][0], 64); err != nil {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: formData["budget"][0],
			Msg:   "invalid budget format",
			Path:  "budget",
		})
	} else {
		result.Budget = budget
	}

	// Parse sector ID
	if sectorID, err := strconv.ParseUint(formData["sectorID"][0], 10, 64); err != nil {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: formData["sectorID"][0],
			Msg:   "invalid sector ID format",
			Path:  "sectorID",
		})
	} else {
		result.SectorID = uint(sectorID)
	}

	// Parse optional fields
	if len(formData["tenderNumber"]) > 0 {
		result.TenderNumber = formData["tenderNumber"][0]
	}
	if len(formData["description"]) > 0 {
		result.Description = formData["description"][0]
	}
	if len(formData["minQualificationLevel"]) > 0 {
		result.MinQualificationLevel = formData["minQualificationLevel"][0]
	}

	// Time validation function
	parseTime := func(field string) (time.Time, error) {
		return time.Parse(time.RFC3339, formData[field][0])
	}

	// Parse and validate times
	if t, err := parseTime("proposalSubmissionStart"); err != nil {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: formData["proposalSubmissionStart"][0],
			Msg:   "invalid time format (RFC3339 required)",
			Path:  "proposalSubmissionStart",
		})
	} else {
		result.ProposalSubmissionStart = t
	}

	if t, err := parseTime("proposalSubmissionEnd"); err != nil {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: formData["proposalSubmissionEnd"][0],
			Msg:   "invalid time format (RFC3339 required)",
			Path:  "proposalSubmissionEnd",
		})
	} else {
		result.ProposalSubmissionEnd = t
	}

	if t, err := parseTime("proposalReviewStart"); err != nil {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: formData["proposalReviewStart"][0],
			Msg:   "invalid time format (RFC3339 required)",
			Path:  "proposalReviewStart",
		})
	} else {
		result.ProposalReviewStart = t
	}

	if t, err := parseTime("proposalReviewEnd"); err != nil {
		errors = append(errors, InputValidationError{
			Type:  "invalid",
			Value: formData["proposalReviewEnd"][0],
			Msg:   "invalid time format (RFC3339 required)",
			Path:  "proposalReviewEnd",
		})
	} else {
		result.ProposalReviewEnd = t
	}

	// Validate time sequence if all times are valid
	if len(errors) == 0 {
		if result.ProposalSubmissionEnd.Before(result.ProposalSubmissionStart) {
			errors = append(errors, InputValidationError{
				Type: "invalid",
				Msg:  "proposalSubmissionEnd must be after proposalSubmissionStart",
				Path: "proposalSubmissionEnd",
			})
		}

		if result.ProposalReviewStart.Before(result.ProposalSubmissionEnd) {
			errors = append(errors, InputValidationError{
				Type: "invalid",
				Msg:  "proposalReviewStart must be after proposalSubmissionEnd",
				Path: "proposalReviewStart",
			})
		}

		if result.ProposalReviewEnd.Before(result.ProposalReviewStart) {
			errors = append(errors, InputValidationError{
				Type: "invalid",
				Msg:  "proposalReviewEnd must be after proposalReviewStart",
				Path: "proposalReviewEnd",
			})
		}
	}

	return result, errors
}
