package models

import (
	"time"

	"gorm.io/gorm"
)

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
	Reputation          float64    `json:"reputation" gorm:"default:0"`
	Roles               []Role     `gorm:"many2many:user_roles;"`
	Certificates        []Document `gorm:"polymorphic:Documentable;"`
	IsActive            bool       `json:"isActive" gorm:"default:false"`
	PublicWalletAddress string     `json:"publicWalletAddress" gorm:"unique"`
}

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
	Title                   string     `json:"title" gorm:"type:varchar(200);not null"`
	Description             string     `json:"description" gorm:"type:text;not null"`
	CreatedBy               uint       `json:"createdBy" gorm:"not null"`
	Documents               []Document `json:"documents" gorm:"polymorphic:Documentable;"`
	Budget                  float64    `json:"budget" gorm:"not null"`
	Currency                string     `json:"currency" gorm:"type:varchar(10);not null"`
	Category                string     `json:"category" gorm:"type:varchar(100)"`
	Sectors                 []Sector   `json:"sectors" gorm:"many2many:offer_sectors;"`
	QualificationRequired   string     `json:"qualificationRequired" gorm:"type:text"`
	Location                string     `json:"location" gorm:"type:varchar(255)"`
	ProposalSubmissionStart time.Time  `json:"proposalSubmissionStart" gorm:"type:timestamp"`
	ProposalSubmissionEnd   time.Time  `json:"proposalSubmissionEnd" gorm:"type:timestamp"`
	BidDeadline             time.Time  `json:"bidDeadline" gorm:"type:timestamp"`
	OfferValidityEnd        time.Time  `json:"offerValidityEnd" gorm:"type:timestamp"`
	Status                  string     `json:"status" gorm:"type:varchar(50);default:'open'"`
	WinningBidID            uint       `json:"winningBidID"`
}

type Sector struct {
	gorm.Model
	Code        string `json:"code" gorm:"type:varchar(50);unique;not null"`
	Description string `json:"description" gorm:"type:text"`
}

type ContractRules struct {
	gorm.Model
	Name        string  `json:"name" gorm:"type:varchar(100);not null;unique"`
	Description string  `json:"description" gorm:"type:text"`
	Contracts   []Offer `json:"contracts" gorm:"many2many:contract_rules_contract;"`
}

type Document struct {
	gorm.Model
	Name             string `json:"name" gorm:"type:varchar(255);not null"`
	URL              string `json:"url" gorm:"type:text;not null"`
	DocumentableID   uint   `json:"documentableID"`
	DocumentableType string `json:"documentableType"`
}
