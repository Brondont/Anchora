package models

import (
	"gorm.io/gorm"
)

type Role struct {
	gorm.Model
	Name  string `json:"name" gorm:"type:varchar(50);unique;not null"`
	Users []User `gorm:"many2many:user_roles;"`
}

type User struct {
	gorm.Model
	Username    string `json:"username" gorm:"type:varchar(100);not null"`
	Email       string `json:"email" gorm:"type:varchar(100);not null;unique"`
	Password    string `json:"password" gorm:"type:text;not null"`
	PhoneNumber string `json:"phoneNumber" gorm:"type:varchar(100);unique"`
	Roles       []Role `gorm:"many2many:user_roles;"`
}
