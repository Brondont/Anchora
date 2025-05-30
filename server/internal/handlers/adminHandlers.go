package handlers

import (
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"

	"github.com/Brondont/trust-api/config"
	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/internal/auth"
	"github.com/Brondont/trust-api/middleware"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type AdminHandler struct {
	*Handler
}

func NewAdminHandler() *AdminHandler {
	return &AdminHandler{
		Handler: NewHandler(),
	}
}

func (h *AdminHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	limit, _ := strconv.Atoi(query.Get("limit"))
	search := query.Get("search")

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	offset := (page - 1) * limit

	baseQuery := db.DB.DB.Model(&models.User{}).Preload("Roles").Select(
		"id", "email", "first_name", "last_name", "created_at", "phone_number", "public_wallet_address",
	)

	if search != "" {
		searchPattern := "%" + search + "%"
		baseQuery = baseQuery.Where(
			"last_name LIKE ? OR first_name LIKE ? OR email LIKE ? OR phone_number LIKE ?"+
				" OR CONCAT(first_name, ' ', last_name) LIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
		)
	}

	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("error counting users"))
		return
	}

	var users []models.User
	result := baseQuery.Limit(limit).Offset(offset).Find(&users)
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("error fetching users"))
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	response := map[string]interface{}{
		"users": users,
		"pagination": map[string]interface{}{
			"currentPage":  page,
			"totalPages":   totalPages,
			"totalItems":   total,
			"itemsPerPage": limit,
		},
	}

	utils.WriteJson(w, http.StatusOK, response)
}

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	if userID == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("user id is missing in the URL"))
		return
	}

	// Check if the user exists
	var user models.User
	if err := db.DB.DB.Preload("Roles").Preload("Certificates").First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, errors.New("user not found"))
		} else {
			utils.WriteError(w, http.StatusInternalServerError, err)
		}
		return
	}

	// Start a transaction to ensure a clean deletion
	tx := db.DB.DB.Begin()

	// Remove user-role associations (many-to-many)
	if err := tx.Model(&user).Association("Roles").Clear(); err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to remove user-role associations"))
		return
	}

	// Remove certificates (polymorphic relation)
	if err := tx.Where("documentable_id = ? AND documentable_type = ?", user.ID, "User").Delete(&models.Document{}).Error; err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to delete user certificates"))
		return
	}

	// Delete the user
	if err := tx.Unscoped().Delete(&user).Error; err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to delete user"))
		return
	}

	// Commit the transaction
	tx.Commit()

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "User was deleted successfully.",
	})
}

func (h *AdminHandler) PutUser(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		FirstName   string `json:"firstName"`
		LastName    string `json:"lastName"`
		Email       string `json:"email"`
		PhoneNumber string `json:"phoneNumber"`
	}
	err := utils.ParseJson(r, &payload)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	// Start a database transaction
	tx := db.DB.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Determine the user ID to update
	vars := mux.Vars(r)
	userID := vars["userID"]
	if userID == "" {
		tx.Rollback()
		utils.WriteError(w, http.StatusBadRequest, errors.New("invalid user ID"))
		return
	}

	// Fetch the existing user from the database
	var existingUser models.User
	if result := tx.Preload("Roles").First(&existingUser, userID); result.Error != nil {
		tx.Rollback()
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, errors.New("user not found"))
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, errors.New("error fetching user"))
		return
	}

	// Validate input
	updatedUser := models.User{
		FirstName:   payload.FirstName,
		LastName:    payload.LastName,
		Email:       payload.Email,
		PhoneNumber: payload.PhoneNumber,
	}
	inputErrors := middleware.ValidateUserInput(updatedUser)
	if len(inputErrors) > 0 {
		tx.Rollback()
		utils.WriteInputValidationError(w, http.StatusUnprocessableEntity, inputErrors)
		return
	}

	// Check if email is already in use by another user
	var emailCheckUser models.User
	if result := tx.Where("email = ? AND id != ?", payload.Email, userID).First(&emailCheckUser); result.Error == nil {
		tx.Rollback()
		err := middleware.InputValidationError{
			Type:  "invalid",
			Value: payload.Email,
			Msg:   "An account with this E-mail already exists",
			Path:  "email",
		}
		utils.WriteInputValidationError(w, http.StatusConflict, err)
		return
	}

	// Update user fields
	existingUser.FirstName = payload.FirstName
	existingUser.LastName = payload.LastName
	existingUser.Email = payload.Email
	existingUser.PhoneNumber = payload.PhoneNumber

	// Save the updated user
	if err := tx.Save(&existingUser).Error; err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to update user"))
		return
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	// Fetch the complete user with roles for response
	var completeUser models.User
	if err := db.DB.DB.Preload("Roles").First(&completeUser, existingUser.ID).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	// Respond with the updated user information
	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "User updated successfully",
		"user":    completeUser,
	})
}

// PostUser handles creating a new user
func (h *AdminHandler) PostUser(w http.ResponseWriter, r *http.Request) {
	// Parse the json body
	var payload struct {
		FirstName   string `json:"firstName"`
		LastName    string `json:"lastName"`
		Email       string `json:"email"`
		PhoneNumber string `json:"phoneNumber"`
	}

	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}
	// Create user model from payload
	user := models.User{
		FirstName:   payload.FirstName,
		LastName:    payload.LastName,
		Email:       payload.Email,
		PhoneNumber: payload.PhoneNumber,
	}

	// validate input
	if errs := middleware.ValidateUserInput(user); len(errs) != 0 {
		utils.WriteInputValidationError(w, http.StatusConflict, errs)
		return
	}

	randomPassword := utils.GenerateRandomPassword(12)
	hashedPassword, err := utils.HashPassword(randomPassword)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	user.Password = hashedPassword

	// Start a database transaction
	tx := db.DB.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Check if user exists
	var existingUser models.User
	if result := tx.Where("email = ?", user.Email).First(&existingUser); result.Error == nil {
		tx.Rollback()
		err := middleware.InputValidationError{
			Type:  "invalid",
			Value: user.Email,
			Msg:   "An account with this E-mail already exists",
			Path:  "email",
		}
		utils.WriteInputValidationError(w, http.StatusConflict, err)
		return
	}

	// Create verification token
	verificationToken, err := auth.CreateVerificationToken(user.Email, user.Password)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	// Create the user
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to create user"))
		return
	}

	if err := tx.Commit().Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	// Fetch the complete user with roles for response
	var completeUser models.User
	if err := db.DB.DB.Preload("Roles").First(&completeUser, user.ID).Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
	// Construct the frontend verification URL
	verificationURL := fmt.Sprintf("%s/activation?token=%s", config.Envs.FrontendURL, verificationToken)

	// Email content
	emailBody := fmt.Sprintf(`
	<h1>Account Created Successfully</h1>
	<p>Hello %s,</p>
	<p>Your account has been created successfully. Please verify your email by clicking the link below:</p>
	<p><a href="%s">Verify Your Email</a></p>
	<p>If you did not request this, please ignore this email.</p>
`, completeUser.FirstName, verificationURL)

	// Send email
	err = utils.SendEmail(completeUser.Email, "Account Verification", emailBody)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	// Send success response
	utils.WriteJson(w, http.StatusCreated, map[string]interface{}{
		"message": "User created successfully. A verification email has been sent.",
		"user":    completeUser,
	})

}

func (h *AdminHandler) GetRoles(w http.ResponseWriter, _ *http.Request) {
	var roles []models.Role
	result := db.DB.DB.Find(&roles)
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	utils.WriteJson(w, 200, map[string]interface{}{
		"message": "success",
		"roles":   roles,
	})
}
func (h *AdminHandler) CreateRole(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Name string `json:"name"`
	}

	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	if payload.Name == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("role name is required"))
		return
	}

	role := models.Role{Name: payload.Name}
	result := db.DB.DB.Create(&role)
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]interface{}{
		"message": "Role created successfully",
		"role":    role,
	})
}

func (h *AdminHandler) UpdateRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roleName := vars["roleName"]

	if roleName == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("role name is missing in the URL"))
		return
	}

	var payload struct {
		Name string `json:"name"`
	}

	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	if payload.Name == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("new role name is required"))
		return
	}

	log.Println(roleName)

	var role models.Role
	result := db.DB.DB.Where("name = ?", roleName).First(&role)
	if result.Error != nil {
		utils.WriteError(w, http.StatusNotFound, errors.New("role not found"))
		return
	}

	role.Name = payload.Name
	result = db.DB.DB.Save(&role)
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "Role updated successfully",
		"role":    role,
	})
}

func (h *AdminHandler) DeleteRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roleName := vars["roleName"]

	if roleName == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("role name is missing in the URL"))
		return
	}

	// Check if any users are assigned to this role
	var userCount int64
	result := db.DB.DB.Table("user_roles").
		Joins("JOIN roles ON user_roles.role_id = roles.id").
		Where("roles.name = ?", roleName).
		Count(&userCount)
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	// If users are assigned to the role, return an error
	if userCount > 0 {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("cannot delete role '%s' because it is assigned to %d user(s)", roleName, userCount))
		return
	}

	// Proceed with deleting the role if no users are assigned
	result = db.DB.DB.Unscoped().Where("name = ?", roleName).Delete(&models.Role{})
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "Role deleted successfully",
	})
}

// PostUserRole assigns a role to a user.
func (h *AdminHandler) PostUserRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]

	var payload struct {
		RoleID uint `json:"roleID"`
	}

	if err := utils.ParseJson(r, &payload); err != nil {
		utils.WriteError(w, http.StatusBadRequest, errors.New("bad request failed to parse body"))
		return
	}

	if userID == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("userID and roleID are required"))
		return
	}

	// Load user
	var user models.User
	if err := db.DB.DB.Preload("Roles").First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, errors.New("user not found"))
		} else {
			utils.WriteError(w, http.StatusInternalServerError, err)
		}
		return
	}

	// TODO: add server side validatoin of transaction happening before commiting role change on the server

	// Load role
	var role models.Role
	if err := db.DB.DB.First(&role, payload.RoleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, fmt.Errorf("role %d not found", payload.RoleID))
		} else {
			utils.WriteError(w, http.StatusInternalServerError, err)
		}
		return
	}

	// Prevent duplicating the same role
	for _, r := range user.Roles {
		if r.ID == role.ID {
			utils.WriteError(w, http.StatusConflict, fmt.Errorf("user already has role %s", role.Name))
			return
		}
	}

	// Assign role in a transaction
	tx := db.DB.DB.Begin()
	if err := tx.Model(&user).Association("Roles").Append(&role); err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to assign role"))
		return
	}
	if err := tx.Commit().Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": fmt.Sprintf("role %s assigned to user", role.Name),
	})
}

// DeleteUserRole removes a role from a user, ensuring at least one remains.
func (h *AdminHandler) DeleteUserRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]
	roleID := vars["roleID"]

	if userID == "" || roleID == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("userID and roleID are required"))
		return
	}

	// Load user with roles
	var user models.User
	if err := db.DB.DB.Preload("Roles").First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, errors.New("user not found"))
		} else {
			utils.WriteError(w, http.StatusInternalServerError, err)
		}
		return
	}

	// Load the specific role
	var role models.Role
	if err := db.DB.DB.First(&role, roleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, fmt.Errorf("role %s not found", roleID))
		} else {
			utils.WriteError(w, http.StatusInternalServerError, err)
		}
		return
	}

	// TODO: add server side validatoin of transaction happening before commiting role change on the server

	// Check the user actually has this role
	hasRole := false
	for _, r := range user.Roles {
		if r.ID == role.ID {
			hasRole = true
			break
		}
	}
	if !hasRole {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("user does not have role %s", role.Name))
		return
	}

	// Remove the role in a transaction
	tx := db.DB.DB.Begin()
	if err := tx.Model(&user).Association("Roles").Delete(&role); err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to remove role"))
		return
	}
	if err := tx.Commit().Error; err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": fmt.Sprintf("role %s removed from user", role.Name),
	})
}
