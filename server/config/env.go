package config

import (
	"os"
)

type Config struct {
	DBUser              string
	OfferFactoryAddress string
	DBPassword          string
	DBName              string
	JWTSecret           string
	EmailSender         string
	EmailPassword       string
	SMTPHost            string
	SMTPPort            string
	FrontendURL         string
	BlockchainRPCURL    string
}

var Envs = initConfig()

func initConfig() Config {
	return Config{
		DBUser:              getEnv("DB_USER", "kadi"),
		OfferFactoryAddress: getEnv("OFFER_FACTORY_ADDRESS", ""),
		BlockchainRPCURL:    getEnv("BLOCKCHAIN_RPC_URL", "http://localhost:8545"),
		DBPassword:          getEnv("DBPassword", "kadi010203"),
		DBName:              getEnv("DBName", "ecomdb"),
		JWTSecret:           getEnv("JWTSecret", "jfeaiowjdiowfawijfdawo"),
		EmailSender:         getEnv("EmailSender", "blanche.oreilly@ethereal.email"),
		EmailPassword:       getEnv("EmailPassword", "WJXX7q5cR8R5FyzJPx"),
		SMTPHost:            getEnv("SMTPHost", "smtp.ethereal.email"),
		SMTPPort:            getEnv("SMTPPort", "587"),
		FrontendURL:         getEnv("FrontendURL", "http://localhost:3000"),
	}
}

func getEnv(key string, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
