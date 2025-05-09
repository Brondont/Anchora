package models

import (
	"time"

	"gorm.io/gorm"
)

// Role and User models remain largely unchanged.
type Role struct {
	gorm.Model
	Name  string `json:"name" gorm:"type:varchar(50);unique;not null"`
	Users []User `gorm:"many2many:user_roles;"`
}

type User struct {
	gorm.Model
	FirstName           string     `json:"firstName" gorm:"type:varchar(100);"`
	LastName            string     `json:"lastName" gorm:"type:varchar(100);"`
	Email               string     `json:"email" gorm:"type:varchar(100);not null;unique"`
	Password            string     `json:"password" gorm:"type:text;not null"`
	PhoneNumber         string     `json:"phoneNumber" gorm:"type:varchar(100)"`
	Roles               []Role     `gorm:"many2many:user_roles;"`
	Certificates        []Document `gorm:"polymorphic:Documentable;"`
	IsActive            bool       `json:"isActive" gorm:"default:false"`
	PublicWalletAddress string     `json:"publicWalletAddress" gorm:"unique"`
}

// Bid and ExpertEvaluation models remain unchanged.
type Bid struct {
	gorm.Model
	ContractID  uint      `json:"contractID" gorm:"not null"`
	BidderID    uint      `json:"bidderID" gorm:"not null"`
	Details     string    `json:"details" gorm:"type:text"`
	Status      string    `json:"status" gorm:"type:varchar(50);default:'pending'"`
	SubmittedAt time.Time `json:"submittedAt"`
}

type ExpertEvaluation struct {
	gorm.Model
	BidID       uint      `json:"bidID" gorm:"not null"`
	ExpertID    uint      `json:"expertID" gorm:"not null"`
	Score       float64   `json:"score" gorm:"not null"`
	Comments    string    `json:"comments" gorm:"type:text"`
	EvaluatedAt time.Time `json:"evaluatedAt"`
	Weight      float64   `json:"weight" gorm:"default:1"`
}

type Offer struct {
	gorm.Model
	ContractAddress string `json:"ContractAddress" gorm:"type:varchar(200);not null;unique"`
	// Basic offer details
	Title   string `json:"title" gorm:"type:varchar(200);not null"`
	Summary string `json:"summary" gorm:"type:text;not null"`

	// Financial and contractual details
	Budget   float64 `json:"budget" gorm:"not null"`
	Currency string  `json:"currency"`

	// Timeline Fields
	ProposalSubmissionStart time.Time `json:"proposalSubmissionStart" gorm:"type:timestamp;not null"`
	ProposalSubmissionEnd   time.Time `json:"proposalSubmissionEnd" gorm:"type:timestamp;not null"`
	ProposalReviewStart     time.Time `json:"proposalReviewStart" gorm:"type:timestamp;not null"`
	ProposalReviewEnd       time.Time `json:"proposalReviewEnd" gorm:"type:timestamp;not null"`

	// Management of offer state
	WinningProposalID uint `json:"WinningProposalID"`
	CreatedBy         uint `json:"createdBy" gorm:"not null"`

	// Documents automatically related to this offer
	Documents []Document `json:"documents" gorm:"polymorphic:Documentable;"`
}

type Sector struct {
	gorm.Model
	Code        string `json:"code" gorm:"type:varchar(50);unique;not null"`
	Description string `json:"description" gorm:"type:text"`
}

// A simplified association model that can be linked to offers
type ContractRules struct {
	gorm.Model
	Name        string  `json:"name" gorm:"type:varchar(100);not null;unique"`
	Description string  `json:"description" gorm:"type:text"`
	Contracts   []Offer `json:"contracts" gorm:"many2many:contract_rules_contract;"`
}

type Document struct {
	gorm.Model
	DocumentType     string `json:"documentType" gorm:"type:varchar(50);not null"`
	DocumentPath     string `json:"documentPath" gorm:"type:text;not null"`
	DocumentableID   uint   `json:"documentableID"`   // ID of the related model record
	DocumentableType string `json:"documentableType"` // Type of the related model (e.g., "Offer", "Bid", "User")
}
