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

	formData, err := utils.ParseMultipartForm(r, 32<<20)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, fmt.Errorf("invalid form data: %w", err))
		return
	}

	// Validate form data using middleware
	offerForm, validationErrors := middleware.ValidateOfferForm(formData.Fields)
	if len(validationErrors) > 0 {
		utils.WriteJson(w, http.StatusBadRequest, middleware.ErrorResponse{Error: validationErrors})
		return
	}

	// Start transaction
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

	// Verify sector exists
	var sectorCount int64
	if result := tx.Model(&models.Sector{}).Where("id = ?", offerForm.SectorID).Count(&sectorCount); result.Error != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	if sectorCount == 0 {
		tx.Rollback()
		utils.WriteError(w, http.StatusBadRequest, errors.New("sector not found"))
		return
	}

	// Create offer payload
	offerPayload := models.Offer{
		Title:                   offerForm.Title,
		TenderNumber:            offerForm.TenderNumber,
		Location:                offerForm.Location,
		Description:             offerForm.Description,
		Budget:                  offerForm.Budget,
		Currency:                offerForm.Currency,
		SectorID:                offerForm.SectorID,
		ContractAddress:         offerForm.ContractAddress,
		MinQualificationLevel:   offerForm.MinQualificationLevel,
		ProposalSubmissionStart: offerForm.ProposalSubmissionStart,
		ProposalSubmissionEnd:   offerForm.ProposalSubmissionEnd,
		ProposalReviewStart:     offerForm.ProposalReviewStart,
		ProposalReviewEnd:       offerForm.ProposalReviewEnd,
		CreatedBy:               claims.UserID,
		Status:                  "Open",
	}

	// Save offer
	result := tx.Create(&offerPayload)
	if result.Error != nil {
		tx.Rollback()
		utils.WriteError(w, http.StatusInternalServerError, result.Error)
		return
	}

	// Process uploaded files
	for _, fileHeader := range formData.Files {
		documentPath, err := utils.SaveUploadedFile(fileHeader, "/authenticated/offers")
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
