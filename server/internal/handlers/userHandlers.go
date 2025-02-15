package handlers

import (
	"errors"
	"net/http"

	"gorm.io/gorm"

	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
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

func (h *UserHandler) PutUser(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from the context
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, errors.New("user id is missing in the token"))
		return
	}

	// Extract isAdmin flag from the context
	isAdmin, ok := r.Context().Value("isAdmin").(bool)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, errors.New("admin status is missing in the token"))
		return
	}

	// Parse the incoming JSON payload
	var payload models.User
	err := utils.ParseJson(r, &payload)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	// Fetch the existing user from the database
	var existingUser models.User
	result := db.DB.DB.Where("email = ? OR phone_number = ?", payload.Email, payload.PhoneNumber).First(&existingUser)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, errors.New("user not found"))
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, errors.New("something went wrong with fetching the user, try again"))
		return
	}

	// If the user is not an admin, ensure they can only edit their own account
	if !isAdmin && existingUser.ID != uint(userID) {
		utils.WriteError(w, http.StatusForbidden, errors.New("you do not have permission to edit this user"))
		return
	}

	// Update the user's information
	existingUser.Email = payload.Email
	existingUser.Username = payload.Username
	existingUser.PhoneNumber = payload.PhoneNumber
	// Add other fields you want to update

	// Save the updated user information
	updateResult := db.DB.DB.Save(&existingUser)
	if updateResult.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("something went wrong with updating the user, try again"))
		return
	}

	// Respond with the updated user information
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "User updated successfully",
		"user":    existingUser,
	})
}
