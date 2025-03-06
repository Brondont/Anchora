package db

import (
	"fmt"
	"log"
	"os"

	"github.com/Brondont/trust-api/config"
	"github.com/Brondont/trust-api/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type DBInstance struct {
	DB *gorm.DB
}

var DB DBInstance

func ConnectDB() {
	dsn := fmt.Sprintf("host=db user=%s password=%s dbname=%s port=5432 sslmode=disable", config.Envs.DBUser, config.Envs.DBPassword, config.Envs.DBName)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("Server failed to connect to database\n", err)
		os.Exit(2)
	}

	log.Println("Server connected to database")

	log.Println("Running migrations")

	db.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.Contract{},
		&models.ContractRules{},
		&models.Document{},
		&models.Bid{},
		&models.ExpertEvaluation{},
	)
	DB = DBInstance{
		DB: db,
	}
}
