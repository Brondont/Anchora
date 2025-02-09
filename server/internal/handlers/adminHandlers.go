package handlers

import (
	"errors"
	"math"
	"net/http"
	"strconv"

	"github.com/Brondont/trust-api/db"
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
