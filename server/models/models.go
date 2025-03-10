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
	FirstName             string     `json:"firstName" gorm:"type:varchar(100);"`
	LastName              string     `json:"lastName" gorm:"type:varchar(100);"`
	Email                 string     `json:"email" gorm:"type:varchar(100);not null;unique"`
	Password              string     `json:"password" gorm:"type:text;not null"`
	PhoneNumber           string     `json:"phoneNumber" gorm:"type:varchar(100)"`
	Reputation            float64    `json:"reputation" gorm:"default:0"`
	Roles                 []Role     `gorm:"many2many:user_roles;"`
	Certificates          []Document `gorm:"polymorphic:Documentable;"`
	AccountActivationHash string     `json:"accountActivationHash" gorm:"type:text"`
	IsActive              bool       `json:"isActive" gorm:"default:false"`
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
	ExpertID    uint      `json:"expertID" gorm:"no null"`
	Score       float64   `json:"score" gorm:"not null"`
	Comments    string    `json:"comments" gorm:"type:text"`
	EvaluatedAt time.Time `json:"evaluatedAt"`
	Weight      float64   `json:"weight" gorm:"default:1"`
}

type Contract struct {
	gorm.Model
	Title         string          `json:"title" gorm:"type:varchar(200);not null"`
	Description   string          `json:"description" gorm:"type:text;not null"`
	CreatedBy     uint            `json:"createdBy" gorm:"not null"`
	Rules         []ContractRules `gorm:"many2many:contract_rules_contract;"`
	Documents     []Document      `gorm:"polymorphic:Documentable;"`
	Budget        float64         `json:"budget" gorm:"not null"`
	Currency      string          `json:"currency" gorm:"type:varchar(10);not null"`
	Category      string          `json:"category" gorm:"type:varchar(100)"`
	Location      string          `json:"location" gorm:"type:varchar(255)"`
	BidDeadline   time.Time       `json:"bidDeadline" gorm:"type:timestamp"`
	ContractStart time.Time       `json:"contractStart" gorm:"type:timestamp"`
	ContractEnd   time.Time       `json:"contractEnd" gorm:"type:timestamp"`
	WinningBidID  uint            `json:"winningBidID"`
	Status        string          `json:"status" gorm:"type:varchar(50);default:'open'"`
}

type ContractRules struct {
	gorm.Model
	Name        string     `json:"name" gorm:"type:varchar(100);not null;unique"`
	Description string     `json:"description" gorm:"type:text"`
	Contracts   []Contract `gorm:"many2many:contract_rules_contract;"`
}

type Document struct {
	gorm.Model
	Name             string `json:"name" gorm:"type:varchar(255);not null"`
	URL              string `json:"url" gorm:"type:text;not null"`
	DocumentableID   uint   `json:"documentableID"`
	DocumentableType string `json:"documentableType"`
}
