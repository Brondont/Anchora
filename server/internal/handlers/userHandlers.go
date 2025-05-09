package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/internal/auth"
	"github.com/Brondont/trust-api/middleware"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
	"github.com/ethereum/go-ethereum/common"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

type UserHandler struct {
	*Handler
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		Handler: NewHandler(),
	}
}

// GetUser retrieves user information from the database.
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	// Retrieve the claims from the request context.
	claims, ok := r.Context().Value("claims").(*auth.AuthClaims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, errors.New("unable to retrieve auth claims"))
		return
	}

	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("no user id provided"))
		return
	}
	userIDInt, err := strconv.ParseUint(userID, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid user ID: %w", err))
		return
	}
	userIDuint := uint(userIDInt)

	// Check if the caller is an admin or is the same user.
	// Note: We allow access if the user is an admin OR the token's userID equals the requested userID.
	if !auth.HasRole(claims, []string{"admin"}) && claims.UserID != userIDuint {
		utils.WriteError(w, http.StatusForbidden, errors.New("insufficient permissions"))
		return
	}

	// Fetch user from database
	var user models.User
	result := db.DB.DB.Preload("Roles").
		Select("id", "email", "first_name", "last_name", "phone_number", "public_wallet_address").
		Where("id = ?", userID).
		First(&user)
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

// UpdateEmail updates the email of the authenticated user.
func (h *UserHandler) UpdateEmail(w http.ResponseWriter, r *http.Request) {
	// Retrieve the claims from the request context.
	claims, ok := r.Context().Value("claims").(*auth.AuthClaims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, errors.New("unable to retrieve authentication claims"))
		return
	}

	// Parse request body
	var payload struct {
		Email string `json:"email"`
	}

	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("invalid request format"))
		return
	}

	payload.Email = strings.TrimSpace(payload.Email)

	// Validate email format
	if !middleware.IsValidEmail(payload.Email) {
		err := middleware.InputValidationError{
			Type:  "invalid",
			Value: payload.Email,
			Msg:   "Invalid email format",
			Path:  "email",
		}
		utils.WriteInputValidationError(w, http.StatusBadRequest, err)
		return
	}

	// Check if email is already in use
	var existingUser models.User
	if err := db.DB.DB.Where("email = ?", payload.Email).First(&existingUser).Error; err == nil {
		err := middleware.InputValidationError{
			Type:  "invalid",
			Value: payload.Email,
			Msg:   "An account with this E-mail already exists",
			Path:  "email",
		}
		utils.WriteInputValidationError(w, http.StatusConflict, err)
		return
	}

	// Update user's email
	if err := db.DB.DB.Model(&models.User{}).Where("id = ?", claims.UserID).Update("email", payload.Email).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to update email"))
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{"message": "Email updated successfully"})
}

// UpdatePhoneNumber updates the phone number of the authenticated user.
func (h *UserHandler) UpdatePhoneNumber(w http.ResponseWriter, r *http.Request) {
	// Retrieve the claims from the request context.
	claims, ok := r.Context().Value("claims").(*auth.AuthClaims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, errors.New("unable to retrieve authentication claims"))
		return
	}

	// Parse request body
	var payload struct {
		PhoneNumber string `json:"phoneNumber"`
	}

	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("invalid request format"))
		return
	}

	payload.PhoneNumber = strings.TrimSpace(payload.PhoneNumber)

	// Update user's phone number
	if err := db.DB.DB.Model(&models.User{}).Where("id = ?", claims.UserID).Update("phone_number", payload.PhoneNumber).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to update phone number"))
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{"message": "Phone number updated successfully"})
}

func (h *UserHandler) UpdateWallet(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.AuthClaims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, errors.New("unable to retrieve authentication claims"))
		return
	}

	var payload struct {
		PublicWalletAddress string `json:"publicWalletAddress"`
	}

	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("invalid request format"))
		return
	}

	payload.PublicWalletAddress = strings.TrimSpace(payload.PublicWalletAddress)

	if payload.PublicWalletAddress == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("wallet address cannot be empty"))
		return
	}

	// Validate Ethereum wallet address format using go-ethereum common package.
	if !common.IsHexAddress(payload.PublicWalletAddress) {
		utils.WriteError(w, http.StatusBadRequest, errors.New("invalid Ethereum wallet address"))
		return
	}

	// Check if the user already has a wallet
	var existingUser models.User
	if err := db.DB.DB.Where("id = ?", claims.UserID).First(&existingUser).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("something went wrong while fetching user data"))
		return
	}

	if existingUser.PublicWalletAddress != "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("this user already has a wallet associated with the account"))
		return
	}

	existingUser.PublicWalletAddress = payload.PublicWalletAddress

	if err := db.DB.DB.Save(&existingUser).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to update wallet address"))
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{"message": "wallet address updated successfully"})
}
