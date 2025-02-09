package routes

import (
	"log"
	"net/http"

	"github.com/Brondont/trust-api/internal/auth"
	"github.com/Brondont/trust-api/internal/handlers"
	"github.com/gorilla/mux"
)

func SetupRoutes(router *mux.Router) {
	userHandler := handlers.NewUserHandler()
	adminHandler := handlers.NewAdminHandler()

	// General Routes

	// User routes
	router.HandleFunc("/user", auth.IsAuth(userHandler.GetUser)).Methods("GET")
	router.HandleFunc("/user", auth.IsAuth(userHandler.PutUser)).Methods("PUT")

	// Admin Routes
	router.HandleFunc("/users", auth.IsAdmin(adminHandler.GetUsers)).Methods("GET")
	router.HandleFunc("/users/{userID}", auth.IsAdmin(adminHandler.DeleteUser)).Methods("DELETE")

	// Auth Routes
	router.HandleFunc("/login", userHandler.PostLogin).Methods("POST")
	router.HandleFunc("/signup", userHandler.PostSignup).Methods("POST")
}

func SetupStaticRoutes(router *mux.Router) {
	router.PathPrefix("/public/").Handler(
		http.StripPrefix("/public/", http.FileServer(http.Dir("./public/"))),
	)

	log.Println("Static file server running on /public")
}
