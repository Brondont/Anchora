package models

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username    string `json:"username" gorm:"type:varchar(100);not null"`
	Email       string `json:"email" gorm:"type:varchar(100);not null;unique"`
	Password    string `json:"password" gorm:"type:text;not null"`
	PhoneNumber string `json:"phoneNumber" gorm:"type:varchar(100);unique"`
	IsAdmin     bool   `json:"isAdmin" gorm:"default:false"`
}
