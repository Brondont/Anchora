package main

import (
	"fmt"
	"log"

	"github.com/Brondont/trust-api/blockchain"
	"github.com/Brondont/trust-api/cmd/api"
	"github.com/Brondont/trust-api/db"
)

func main() {
	fmt.Println("starting backend server")
	fmt.Println("starting connection to database")
	db.ConnectDB()

	log.Println("Synchronizing database with blockchain…")
	blockchain.ChainSyncDB()

	server := api.NewAPIServer(":3080", nil)
	if err := server.Run(); err != nil {
		log.Fatal(err)
	}
}
