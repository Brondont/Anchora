package models

import (
	"time"

	"gorm.io/gorm"
)

// Role remains unchanged
type Role struct {
	gorm.Model
	Name       string `json:"name" gorm:"type:varchar(50);unique;not null"`
	RoleTxHash string `json:"roleTxHash" gorm:"type:varchar(66);index"`
	Users      []User `gorm:"many2many:user_roles;"`
}

// User with no Document/CID fields here (handled on Proposal and Evaluation)
type User struct {
	gorm.Model
	FirstName string `json:"firstName" gorm:"type:varchar(100);"`
	LastName  string `json:"lastName" gorm:"type:varchar(100);"`

	Qualifications []UserQualification `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`

	Email               string             `json:"email" gorm:"type:varchar(100);not null;uniqueIndex"`
	Password            string             `json:"password" gorm:"type:text;not null"`
	PhoneNumber         string             `json:"phoneNumber" gorm:"type:varchar(100)"`
	PublicWalletAddress string             `json:"publicWalletAddress" gorm:"type:varchar(42);uniqueIndex"`
	IsActive            bool               `json:"isActive" gorm:"default:false"`
	SubmittedProposals  []Proposal         `gorm:"foreignKey:ProposerID;constraint:OnDelete:CASCADE"`
	Evaluations         []ExpertEvaluation `gorm:"foreignKey:ExpertID;constraint:OnDelete:CASCADE"`
	CreatedOffers       []Offer            `gorm:"foreignKey:CreatedBy;constraint:OnDelete:SET NULL"`

	Roles []Role `gorm:"many2many:user_roles;"`
}

// Offer (on-chain contract metadata could be mirrored if desired)
type Offer struct {
	gorm.Model
	TenderNumber     string     `json:"tenderNumber" gorm:"type:varchar(100);not null;uniqueIndex"`
	ContractAddress  string     `json:"contractAddress" gorm:"type:varchar(42);not null;uniqueIndex"`
	ProposalStart    time.Time  `json:"proposalSubmissionStart" gorm:"not null"`
	ProposalEnd      time.Time  `json:"proposalSubmissionEnd" gorm:"not null"`
	ReviewStart      time.Time  `json:"proposalReviewStart" gorm:"not null"`
	ReviewEnd        time.Time  `json:"proposalReviewEnd" gorm:"not null"`
	MinQualification string     `json:"minQualificationLevel" gorm:"type:varchar(100)"`
	Status           string     `json:"status" gorm:"type:varchar(50);default:'Open';index"`
	CreatedBy        uint       `gorm:"not null;index"`
	Creator          User       `gorm:"foreignKey:CreatedBy;constraint:OnDelete:RESTRICT"`
	SectorID         uint       `gorm:"not null;index"`
	Sector           Sector     `gorm:"foreignKey:SectorID;constraint:OnDelete:RESTRICT"`
	Documents        []Document `gorm:"polymorphic:Documentable;polymorphicValue:Offer"`
	Proposals        []Proposal `gorm:"foreignKey:ContractID;constraint:OnDelete:CASCADE"`
}

// Proposal with on-chain metadata
type Proposal struct {
	gorm.Model
	ContractID     uint               `json:"contractID" gorm:"not null;index"`
	Contract       Offer              `gorm:"foreignKey:ContractID;constraint:OnDelete:CASCADE"`
	ProposerID     uint               `json:"proposerID" gorm:"not null;index"`
	Proposer       User               `gorm:"foreignKey:ProposerID;constraint:OnDelete:CASCADE"`
	Details        string             `json:"details" gorm:"type:text"`
	Status         string             `json:"status" gorm:"type:varchar(50);default:'pending';index"`
	SubmittedAt    time.Time          `json:"submittedAt" gorm:"not null;index"`
	ProposalTxHash string             `json:"proposalTxHash" gorm:"type:varchar(66);index"` // on-chain tx hash
	Documents      []Document         `gorm:"polymorphic:Documentable;polymorphicValue:Proposal"`
	Evaluations    []ExpertEvaluation `gorm:"foreignKey:ProposalID;constraint:OnDelete:CASCADE"`
}

// ExpertEvaluation with on-chain metadata
type ExpertEvaluation struct {
	gorm.Model
	ProposalID   uint     `json:"proposalID" gorm:"not null;index"`
	Proposal     Proposal `gorm:"foreignKey:ProposalID;constraint:OnDelete:CASCADE"`
	ExpertID     uint     `json:"expertID" gorm:"not null;index"`
	Expert       User     `gorm:"foreignKey:ExpertID;constraint:OnDelete:CASCADE"`
	Score        float64  `json:"score" gorm:"not null"`
	Comment      string   `json:"comment" gorm:"type:text"`
	ReviewTxHash string   `json:"reviewTxHash" gorm:"type:varchar(66);index"` // on-chain tx hash
}

// Qualification unchanged
type Qualification struct {
	gorm.Model
	SectorID uint   `json:"sectorID" gorm:"not null;index"`
	Sector   Sector `gorm:"foreignKey:SectorID;constraint:OnDelete:RESTRICT"`
	Level    string `json:"level" gorm:"type:varchar(50);index"`
}

// UserQualification unchanged
type UserQualification struct {
	gorm.Model
	UserID          uint
	QualificationID uint
	User            User          `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Qualification   Qualification `gorm:"foreignKey:QualificationID;constraint:OnDelete:CASCADE"`
	Document        Document      `gorm:"polymorphic:Documentable;polymorphicValue:UserQualification;constraint:OnDelete:CASCADE"`
}

// Sector unchanged
type Sector struct {
	gorm.Model
	Code           string          `json:"code" gorm:"type:varchar(50);uniqueIndex;not null"`
	Description    string          `json:"description" gorm:"type:text"`
	Qualifications []Qualification `gorm:"foreignKey:SectorID"`
	Offers         []Offer         `gorm:"foreignKey:SectorID"`
}

// Document unchanged
type Document struct {
	gorm.Model
	DocumentType     string `json:"documentType" gorm:"type:varchar(50);not null"`
	DocumentPath     string `json:"documentPath" gorm:"type:text;not null"`
	DocumentableID   uint   `json:"documentableID"`
	DocumentableType string `json:"documentableType"`
}
