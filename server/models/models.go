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
	FirstName string `json:"firstName" gorm:"type:varchar(100);"`
	LastName  string `json:"lastName" gorm:"type:varchar(100);"`

	Certificates   []Document          `gorm:"polymorphic:Documentable;polymorphicValue:User"`
	Qualifications []UserQualification `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`

	Email       string `json:"email" gorm:"type:varchar(100);not null;unique"`
	Password    string `json:"password" gorm:"type:text;not null"`
	PhoneNumber string `json:"phoneNumber" gorm:"type:varchar(100)"`

	Roles               []Role             `gorm:"many2many:user_roles;"`
	IsActive            bool               `json:"isActive" gorm:"default:false"`
	PublicWalletAddress string             `json:"publicWalletAddress" gorm:"unique"`
	SubmittedProposals  []Proposal         `gorm:"foreignKey:ProposerID;constraint:OnDelete:CASCADE"`
	Evaluations         []ExpertEvaluation `gorm:"foreignKey:ExpertID;constraint:OnDelete:CASCADE"`
	CreatedOffers       []Offer            `gorm:"foreignKey:CreatedBy;constraint:OnDelete:SET NULL"`
}

type Offer struct {
	gorm.Model
	TenderNumber string `gorm:"type:varchar(100);not null;unique"`

	ContractAddress string `gorm:"type:varchar(200);not null;unique"`

	SectorID                uint      `gorm:"not null"`
	Sector                  Sector    `gorm:"foreignKey:SectorID;constraint:OnDelete:RESTRICT"`
	Description             string    `json:"description" gorm:"not null"`
	Title                   string    `gorm:"type:varchar(200);not null"`
	Budget                  float64   `gorm:"not null"`
	Currency                string    `gorm:"type:varchar(10);not null"`
	ProposalSubmissionStart time.Time `json:"proposalSubmissionStart" gorm:"type:timestamp;not null"`
	ProposalSubmissionEnd   time.Time `json:"proposalSubmissionEnd" gorm:"type:timestamp;not null"`
	ProposalReviewStart     time.Time `json:"proposalReviewStart" gorm:"type:timestamp;not null"`
	ProposalReviewEnd       time.Time `json:"proposalReviewEnd" gorm:"type:timestamp;not null"`
	MinQualificationLevel   string    `gorm:"type:varchar(100)"`

	Status    string     `gorm:"type:varchar(50);default:'Open'"`
	CreatedBy uint       `gorm:"not null"`
	Creator   User       `gorm:"foreignKey:CreatedBy;constraint:OnDelete:RESTRICT"`
	Documents []Document `gorm:"polymorphic:Documentable;polymorphicValue:Offer"`
	Proposals []Proposal `gorm:"foreignKey:ContractID;constraint:OnDelete:CASCADE"`
}

type Proposal struct {
	gorm.Model
	ContractID  uint               `json:"contractID" gorm:"not null"`
	Contract    Offer              `gorm:"foreignKey:ContractID;constraint:OnDelete:CASCADE"`
	ProposerID  uint               `json:"proposerID" gorm:"not null"`
	Proposer    User               `gorm:"foreignKey:ProposerID;constraint:OnDelete:CASCADE"`
	Details     string             `json:"details" gorm:"type:text"`
	Status      string             `json:"status" gorm:"type:varchar(50);default:'pending'"`
	SubmittedAt time.Time          `json:"submittedAt"`
	Documents   []Document         `gorm:"polymorphic:Documentable;polymorphicValue:Proposal"`
	Evaluations []ExpertEvaluation `gorm:"foreignKey:ProposalID;constraint:OnDelete:CASCADE"`
}

type ExpertEvaluation struct {
	gorm.Model
	ProposalID  uint      `json:"proposalID" gorm:"not null"`
	Proposal    Proposal  `gorm:"foreignKey:ProposalID;constraint:OnDelete:CASCADE"`
	ExpertID    uint      `json:"expertID" gorm:"not null"`
	Expert      User      `gorm:"foreignKey:ExpertID;constraint:OnDelete:CASCADE"`
	Score       float64   `json:"score" gorm:"not null"`
	Comments    string    `json:"comments" gorm:"type:text"`
	EvaluatedAt time.Time `json:"evaluatedAt"`
	Weight      float64   `json:"weight" gorm:"default:1"`
}

type Qualification struct {
	gorm.Model

	SectorID uint   `json:"sectorID" gorm:"not null"`
	Sector   Sector `gorm:"foreignKey:SectorID;constraint:OnDelete:RESTRICT"`

	Level string `json:"level" gorm:"type:varchar(50)"`
}

type UserQualification struct {
	gorm.Model

	UserID          uint
	QualificationID uint
	User            User          `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Qualification   Qualification `gorm:"foreignKey:QualificationID;constraint:OnDelete:CASCADE"`

	Document Document `gorm:"polymorphic:Documentable;polymorphicValue:UserQualification;constraint:OnDelete:CASCADE"`
}

type Sector struct {
	gorm.Model
	Code           string          `json:"code" gorm:"type:varchar(50);unique;not null"`
	Description    string          `json:"description" gorm:"type:text"`
	Qualifications []Qualification `gorm:"foreignKey:SectorID"`
	Offers         []Offer         `gorm:"foreignKey:SectorID"`
}

type Document struct {
	gorm.Model
	DocumentType     string `json:"documentType" gorm:"type:varchar(50);not null"`
	DocumentPath     string `json:"documentPath" gorm:"type:text;not null"`
	DocumentableID   uint   `json:"documentableID"`
	DocumentableType string `json:"documentableType"`
}
