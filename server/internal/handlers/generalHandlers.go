package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/Brondont/trust-api/config"
	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/internal/auth"
	"github.com/Brondont/trust-api/middleware"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
)

type GeneralHandler struct {
	*Handler
}

func NewGeneralHandler() *GeneralHandler {
	return &GeneralHandler{
		Handler: NewHandler(),
	}
}

// PostLogin handles user login.
func (h *GeneralHandler) PostLogin(w http.ResponseWriter, r *http.Request) {
	var payload models.User
	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	// Get user object from the database
	var user models.User
	result := db.DB.DB.Preload("Roles").Where("email = ?", payload.Email).First(&user)
	if result.Error != nil {
		// User does not exist
		err := middleware.InputValidationError{
			Type:  "invalid",
			Value: payload.Email,
			Msg:   "No user found with this email",
			Path:  "email",
		}
		utils.WriteInputValidationError(w, http.StatusConflict, err)
		return
	}

	// Check if account is active
	if !user.IsActive {
		err := middleware.InputValidationError{
			Type:  "invalid",
			Value: "",
			Msg:   "Your account isn't active, check your email for the activation link.",
			Path:  "general",
		}
		utils.WriteInputValidationError(w, http.StatusUnauthorized, err)
		return
	}

	// Validate password
	if !utils.VerifyPassword(payload.Password, user.Password) {
		// Incorrect password
		err := middleware.InputValidationError{
			Type:  "invalid",
			Value: "[hidden]",
			Msg:   "Incorrect user credentials.",
			Path:  "password",
		}
		utils.WriteInputValidationError(w, http.StatusUnauthorized, err)
		return
	}

	// Password is correct; create a JWT auth token that includes the IsActive flag.
	token, err := auth.CreateAuthToken(user.ID, user.Roles, user.IsActive)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]interface{}{
		"message":             "User validated",
		"token":               token,
		"publicWalletAddress": user.PublicWalletAddress,
		"userID":              user.ID,
	})
}

func (h *GeneralHandler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("user id is missing from the url"))
		return
	}

	var userProfile models.User
	result := db.DB.DB.Select("id", "first_name", "last_name", "email", "phone_number", "reputation").Where("id = ?", userID).First(&userProfile)
	if result.Error != nil {
		fmt.Println(result.Error)
		utils.WriteError(w, http.StatusInternalServerError, errors.New("something went wrong with loading user profile, try again later"))
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "user profile successfully fetched",
		"user":    userProfile,
	})
}

// ActivateUser handles user activation with the verification token and password setup
func (h *GeneralHandler) ActivateUser(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}

	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("bad json request"))
		return
	}

	// Validate the password
	passwordErrors := middleware.ValidatePassword(payload.Password)
	if len(passwordErrors) > 0 {
		utils.WriteJson(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: passwordErrors,
		})
		return
	}

	// Parse and validate the verification token
	claims, err := auth.ParseVerificationToken(payload.Token)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("yoru token is invalid, Please request a new activation token"))
		return
	}

	// Find user by email from the token claims
	var user models.User
	if err := db.DB.DB.Where("email = ?", claims.Email).First(&user).Error; err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("user not found"))
		return
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("error processing password"))
		return
	}

	// Update user record
	user.Password = string(hashedPassword)
	user.IsActive = true

	// Save changes to database
	if err := db.DB.DB.Save(&user).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to activate account"))
		return
	}

	// Return success response with token
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "Account successfully activated",
	})
}

func (h *GeneralHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Email string `json:"email"`
	}
	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("failed to parse request data"))
		return
	}

	// Validate email is not empty
	if payload.Email == "" {
		err := middleware.InputValidationError{
			Type:  "required",
			Value: "",
			Msg:   "Email is required",
			Path:  "email",
		}
		utils.WriteInputValidationError(w, http.StatusUnprocessableEntity, err)
		return
	}

	// Find the user with the email
	var user models.User
	result := db.DB.DB.Where("email = ?", payload.Email).First(&user)
	if result.Error != nil {
		// User does not exist
		utils.WriteJson(w, http.StatusOK, map[string]interface{}{
			"message": "If an account with that email exists, password reset instructions have been sent",
		})
		return
	}

	// Check if account is active
	if !user.IsActive {
		err := middleware.InputValidationError{
			Type:  "invalid",
			Value: "",
			Msg:   "Your account isn't active yet. Please activate your account first.",
			Path:  "general",
		}
		utils.WriteInputValidationError(w, http.StatusUnauthorized, err)
		return
	}

	passwordResetToken, err := auth.CreatePasswordResetToken(user.Email, user.Password)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	// Create reset URL
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", config.Envs.FrontendURL, passwordResetToken)

	// Send email with reset link
	emailSubject := "Password Reset Request"
	emailBody := fmt.Sprintf(`
			<h1>Password Reset</h1>
			<p>You requested a password reset for your Trust account.</p>
			<p>Click the link below to reset your password:</p>
			<p><a href="%s">Reset Password</a></p>
			<p>This link will expire in 1 hour.</p>
			<p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
	`, resetURL)

	if err := utils.SendEmail(user.Email, emailSubject, emailBody); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to send reset email"))
		return
	}

	// Return success response without revealing if email exists for security
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "If an account with that email exists, password reset instructions have been sent",
	})
}

func (h *GeneralHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}

	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("invalid request format"))
		return
	}

	// Validate required fields
	if payload.Token == "" {
		err := middleware.InputValidationError{
			Type:  "required",
			Value: "",
			Msg:   "Token is required, make sure you arrived at this page from the link in your email.",
			Path:  "general",
		}
		utils.WriteInputValidationError(w, http.StatusUnprocessableEntity, err)
		return
	}

	if payload.Password == "" {
		err := middleware.InputValidationError{
			Type:  "required",
			Value: "",
			Msg:   "New password is required",
			Path:  "password",
		}
		utils.WriteInputValidationError(w, http.StatusUnprocessableEntity, err)
		return
	}

	// Validate the password
	passwordErrors := middleware.ValidatePassword(payload.Password)
	if len(passwordErrors) > 0 {
		utils.WriteJson(w, http.StatusBadRequest, middleware.ErrorResponse{
			Error: passwordErrors,
		})
		return
	}

	// Parse the password token
	claims, err := auth.ParsePasswordResetToken(payload.Token)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	// Find user by email from the token claims
	var user models.User
	if err := db.DB.DB.Where("email = ?", claims.Email).First(&user).Error; err != nil {
		utils.WriteError(w, http.StatusNotFound, errors.New("user not found"))
		return
	}

	// Verify that the user's current password matches the fingerprint in the token
	// This invalidates the token if the password was changed after the token was issued
	currentPasswordFingerprint := utils.HashSHA256(user.Password)[:8]
	if currentPasswordFingerprint != claims.PasswordFingerprint {
		utils.WriteError(w, http.StatusBadRequest, errors.New("password has been changed since reset was requested"))
		return
	}

	// Hash the new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("error processing password"))
		return
	}

	// Update user record with new password
	user.Password = string(hashedPassword)

	// Save changes to database
	if err := db.DB.DB.Save(&user).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to update password"))
		return
	}

	// Return success response
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "Password has been successfully reset",
	})
}

func (h *GeneralHandler) UpdateUserEmail(w http.ResponseWriter, r *http.Request) {

}
