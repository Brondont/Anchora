package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/internal/auth"
	"github.com/Brondont/trust-api/middleware"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
	"github.com/gorilla/mux"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type GeneralHandler struct {
	*Handler
}

func NewGeneralHandler() *GeneralHandler {
	return &GeneralHandler{
		Handler: NewHandler(),
	}
}

// GetUser retrieves user information from db
func (h *GeneralHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("no user id provided"))
		return
	}

	// Validate the JWT token
	claims, err := auth.ValidateToken(r)
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, err)
		return
	}

	// Extract the userID from the token
	tokenUserID, ok := claims["userID"].(string)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, errors.New("invalid token claims"))
		return
	}

	// Check if the user is an admin or the same user
	isAdmin := auth.HasRole(claims, "admin")
	if !isAdmin && tokenUserID == userID {
		utils.WriteError(w, http.StatusForbidden, errors.New("insufficient permissions"))
		return
	}

	// Fetch user from database
	var user models.User
	result := db.DB.DB.Preload("Roles").Select("id", "email", "first_name", "last_name", "phone_number").Where("id = ?", userID).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, errors.New("user not found"))
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, errors.New("something went wrong with getting the user, try again"))
		return
	}

	// Respond with user data
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"user": user,
	})
}

// PostLogin handles users login
func (h *GeneralHandler) PostLogin(w http.ResponseWriter, r *http.Request) {
	var payload models.User
	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	// get user object
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

	// found user -> check if account is active
	if user.AccountActivationHash != "" {
		err := middleware.InputValidationError{
			Type:  "Invalid",
			Value: "",
			Msg:   "Your account isn't active, check your email for the activation link.",
			Path:  "general",
		}
		utils.WriteInputValidationError(w, http.StatusUnauthorized, err)
		return
	}

	// found user -> validate password
	if !utils.VerifyPassword(payload.Password, user.Password) {
		// incorrect password
		err := middleware.InputValidationError{
			Type:  "Invalid",
			Value: "[hidden]",
			Msg:   "Incorrect user credentials.",
			Path:  "password",
		}
		utils.WriteInputValidationError(w, http.StatusUnauthorized, err)
		return
	}
	// password is correct create JWT and return proper response
	token, err := auth.CreateJWT(user.ID, user.Roles)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]interface{}{
		"message": "User validated",
		"token":   token,
		"userID":  user.ID,
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
		utils.WriteError(w, http.StatusBadRequest, errors.New("invalid token: "+err.Error()))
		return
	}

	// Find user by email from the token claims
	var user models.User
	if err := db.DB.DB.Where("email = ?", claims.Email).First(&user).Error; err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("user not found"))
		return
	}

	// Check if token has been used (if account_activation_hash is empty, token has been used)
	if user.AccountActivationHash == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("token has already been used"))
		return
	}

	// Verify that the token hash matches the stored hash
	if !utils.VerifySHA256(payload.Token, user.AccountActivationHash) {
		utils.WriteError(w, http.StatusBadRequest, errors.New("token hash mismatch"))
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
	user.AccountActivationHash = "" // Clear the activation hash to prevent reuse

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
