package handlers

import (
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"

	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/middleware"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
	"github.com/gorilla/mux"
)

const (
	maxFileSize          = 10 << 20 // 10MB
	modelUploadDirectory = "/public/models"
	uploadDirectory      = "/public/images"
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

	baseQuery := db.DB.DB.Model(&models.User{}).Select(
		"id", "email", "username", "created_at", "phone_number", "is_admin",
	)

	if search != "" {
		searchPattern := "%" + search + "%"
		baseQuery = baseQuery.Where(
			"username LIKE ? OR email LIKE ? OR phone_number LIKE ?",
			searchPattern, searchPattern, searchPattern,
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
		utils.WriteError(w, http.StatusBadRequest, errors.New("user id is missing in the url"))
		return
	}

	result := db.DB.DB.Where("id = ?", userID).Delete(&models.User{})
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "User was deleted.",
	})
}

// TODO: this is for future ability of the admin to create new accounts
// PostSignup handles user sign up
func (h *AdminHandler) PostSignup(w http.ResponseWriter, r *http.Request) {
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
	result = db.DB.DB.Where("name = ?", roleName).Delete(&models.Role{})
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	utils.WriteJson(w, http.StatusOK, map[string]interface{}{
		"message": "Role deleted successfully",
	})
}
