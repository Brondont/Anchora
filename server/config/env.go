package config

import (
	"os"
)

type Config struct {
	DBUser     string
	DBPassword string
	DBName     string
  JWTSecret string
}

var Envs = initConfig()

func initConfig() Config {
	return Config{
		DBUser:     getEnv("DBUser", "kadi"),
		DBPassword: getEnv("DBPassword", "kadi010203"),
		DBName:     getEnv("DBName", "ecomdb"),
    JWTSecret:   getEnv("JWTSecret", "jfeaiowjdiowfawijfdawo"),
	}
}

func getEnv(key string, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
