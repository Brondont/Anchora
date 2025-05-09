package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/Brondont/trust-api/db"
	"github.com/Brondont/trust-api/internal/auth"
	"github.com/Brondont/trust-api/models"
	"github.com/Brondont/trust-api/utils"
)

type TenderHandler struct {
	*Handler
}

func NewTenderHandler() *TenderHandler {
	return &TenderHandler{
		Handler: NewHandler(),
	}
}

func (h *TenderHandler) PostOffer(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.AuthClaims)
	if !ok {
		utils.WriteError(w, http.StatusUnauthorized, errors.New("unable to retrieve authentication claims"))
		return
	}

	userID := claims.UserID

	formData, err := utils.ParseMultipartForm(r, 32<<20) // 32MB max size
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid form data: %w", err))
		return
	}

	// Start a transaction
	tx := db.DB.DB.Begin()
	if tx.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, tx.Error)
		return
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Parse form fields
	contractAddress := formData.Fields["contractAddress"][0]
	title := formData.Fields["title"][0]
	summary := formData.Fields["description"][0]
	budgetStr := formData.Fields["budget"][0]
	currency := formData.Fields["currency"][0]

	// Parse budget as float
	budget, err := strconv.ParseFloat(budgetStr, 64)
	if err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid budget value: %w", err))
		return
	}

	// Parse time fields
	parseTime := func(fieldName string) (time.Time, error) {
		if len(formData.Fields[fieldName]) == 0 {
			return time.Time{}, fmt.Errorf("%s is required", fieldName)
		}
		return time.Parse(time.RFC3339, formData.Fields[fieldName][0])
	}

	proposalSubmissionStart, err := parseTime("proposalSubmissionStart")
	if err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	proposalSubmissionEnd, err := parseTime("proposalSubmissionEnd")
	if err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	proposalReviewStart, err := parseTime("proposalReviewStart")
	if err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	proposalReviewEnd, err := parseTime("proposalReviewEnd")
	if err != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	// Create offer model
	offerPayload := models.Offer{
		Title:                   title,
		Summary:                 summary,
		Budget:                  budget,
		Currency:                currency,
		ContractAddress:         contractAddress,
		ProposalSubmissionStart: proposalSubmissionStart,
		ProposalSubmissionEnd:   proposalSubmissionEnd,
		ProposalReviewStart:     proposalReviewStart,
		ProposalReviewEnd:       proposalReviewEnd,
		CreatedBy:               userID,
	}

	// Save offer to the database within transaction
	result := tx.Create(&offerPayload)
	if result.Error != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	// Process uploaded files
	for _, fileHeader := range formData.Files {
		documentPath, err := utils.SaveUploadedFile(fileHeader, "/public/offers")
		if err != nil {
			tx.Rollback()
			utils.WriteError(w, http.StatusInternalServerError, err)
			return
		}

		documentPayload := models.Document{
			DocumentType:     "offer_document",
			DocumentPath:     documentPath,
			DocumentableID:   offerPayload.ID,
			DocumentableType: "Offer",
		}

		result = tx.Create(&documentPayload)
		if result.Error != nil {
			tx.Rollback()
			utils.WriteError(w, http.StatusInternalServerError, result.Error)
			return
		}
	}

	// Commit the transaction
	result = tx.Commit()
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	// Fetch the complete offer with documents
	var completeOffer models.Offer
	result = db.DB.DB.Preload("Documents").First(&completeOffer, offerPayload.ID)
	if result.Error != nil {
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	utils.WriteJson(w, http.StatusCreated, map[string]interface{}{
		"message": "Offer created successfully",
		"offer":   completeOffer,
	})
}
