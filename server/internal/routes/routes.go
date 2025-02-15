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
	generalHandler := handlers.NewGeneralHandler()

	// General Routes
	router.HandleFunc("/user/{userID}", generalHandler.GetUser).Methods("GET")
	router.HandleFunc("/login", generalHandler.PostLogin).Methods("POST")

	// User routes
	router.HandleFunc("/user", auth.RequireRole("user", userHandler.PutUser)).Methods("PUT")

	// Admin Routes
	router.HandleFunc("/users", auth.RequireRole("admin", adminHandler.GetUsers)).Methods("GET")
	router.HandleFunc("/users/{userID}", auth.RequireRole("admin", adminHandler.DeleteUser)).Methods("DELETE")
	router.HandleFunc("/signup", auth.RequireRole("admin", adminHandler.PostSignup)).Methods("POST")

	router.HandleFunc("/roles", auth.RequireRole("admin", adminHandler.GetRoles)).Methods("GET")
	router.HandleFunc("/roles", auth.RequireRole("admin", adminHandler.CreateRole)).Methods("POST")
	router.HandleFunc("/roles/{roleName}", auth.RequireRole("admin", adminHandler.UpdateRole)).Methods("PUT")
	router.HandleFunc("/roles/{roleName}", auth.RequireRole("admin", adminHandler.DeleteRole)).Methods("DELETE")

}

func SetupStaticRoutes(router *mux.Router) {
	router.PathPrefix("/public/").Handler(
		http.StripPrefix("/public/", http.FileServer(http.Dir("./public/"))),
	)

	log.Println("Static file server running on /public")
}
