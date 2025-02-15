package handlers

import (
	"errors"
	"net/http"

	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/internal/auth"
	"github.com/Brondont/trust-api/middleware"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
	"github.com/gorilla/mux"
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

	// Fetch user from database, excluding sensitive information
	var user models.User
	result := db.DB.DB.Preload("Roles").Select(
		"id", "email", "username", "created_at",
		// Add other non-sensitive fields you want to return
	).Where("id = ?", userID).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			err := errors.New("user not found")
			utils.WriteError(w, http.StatusNotFound, err)
			return
		}

		// Handle other potential database errors
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
