package handlers

import (
	"errors"
	"net/http"

	"gorm.io/gorm"

	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/internal/auth"
	"github.com/Brondont/trust-api/middleware"
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

// GetUser retrieves user information from db
func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("userID").(int)
	if !ok {
		err := errors.New("no user id found")
		utils.WriteError(w, http.StatusUnauthorized, err)
		return
	}

	// Fetch user from database, excluding sensitive information
	var user models.User
	result := db.DB.DB.Select(
		"id", "email", "username", "created_at", "phone_number", "is_admin",
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

// PostLogin handles users login
func (h *UserHandler) PostLogin(w http.ResponseWriter, r *http.Request) {
	var payload models.User
	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	// get user object
	var user models.User
	result := db.DB.DB.Where("email = ?", payload.Email).First(&user)
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
	token, err := auth.CreateJWT(user.ID, user.IsAdmin)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]interface{}{
		"message": "User validated",
		"token":   token,
	})
}

// PostSignup handles user sign up
func (h *UserHandler) PostSignup(w http.ResponseWriter, r *http.Request) {
	// parse the json body
	var payload models.User
	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	// validate input
	if errs := middleware.ValidateUserInput(payload); len(errs) != 0 {
		utils.WriteInputValidationError(w, http.StatusConflict, errs)
		return
	}

	var existingUser models.User
	// check if the user exists
	result := db.DB.DB.Where("email = ?", payload.Email).First(&existingUser)

	if result.Error == nil {
		// User does exist
		if existingUser.Email == payload.Email {
			err := middleware.InputValidationError{
				Type:  "invalid",
				Value: payload.Email,
				Msg:   "An account with this E-mail already exists",
				Path:  "email",
			}

			utils.WriteInputValidationError(w, http.StatusConflict, err)
			return
		}
	}

	// User doesn't exist
	// Hash the users password
	hashedPassword, err := utils.HashPassword(payload.Password)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	payload.Password = hashedPassword

	// Create the user
	result = db.DB.DB.Create(&payload)
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("something went wrong with creating your user, please try again"))
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]interface{}{
		"message": "User created successfully",
		"user":    payload,
	})
}
