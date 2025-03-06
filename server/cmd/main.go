package main

import (
	"fmt"
	"log"

	"github.com/Brondont/trust-api/cmd/api"
	"github.com/Brondont/trust-api/db"
)

func main() {
	fmt.Println("starting backend server")
	db.ConnectDB()

	server := api.NewAPIServer(":3080", nil)
	if err := server.Run(); err != nil {
		log.Fatal(err)
	}
}
