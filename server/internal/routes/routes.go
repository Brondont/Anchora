package routes

import (
	"log"
	"net/http"

	"github.com/Brondont/trust-api/internal/auth"
	"github.com/Brondont/trust-api/internal/handlers"
	"github.com/gorilla/mux"
)

func SetupRoutes(router *mux.Router) {
	adminHandler := handlers.NewAdminHandler()
	generalHandler := handlers.NewGeneralHandler()
	userHandler := handlers.NewUserHandler()
	tenderHandler := handlers.NewTenderHandler()
	entrepreneurHandler := handlers.NewEntrepreneurHandler()

	// General Routes (accessible without role restrictions)
	router.HandleFunc("/user-profile/{userID}", generalHandler.GetUserProfile).Methods("GET")
	router.HandleFunc("/user/activate", generalHandler.ActivateUser).Methods("PUT")
	router.HandleFunc("/user/forgot-password", generalHandler.ForgotPassword).Methods("POST")
	router.HandleFunc("/user/reset-password", generalHandler.ResetPassword).Methods("PUT")
	router.HandleFunc("/login", generalHandler.PostLogin).Methods("POST")
	router.HandleFunc("/sectors", generalHandler.GetSectors).Methods("GET")
	router.HandleFunc("/offer/{offerID}", generalHandler.GetOffer).Methods("GET")
	router.HandleFunc("/offers", generalHandler.GetOffers).Methods("GET")

	// User routes that require authentication only without a role
	router.HandleFunc("/user/{userID}", auth.RequireRole(userHandler.GetUser)).Methods("GET")
	router.HandleFunc("/user/email", auth.RequireRole(userHandler.UpdateEmail)).Methods("PUT")
	router.HandleFunc("/user/phone-number", auth.RequireRole(userHandler.UpdatePhoneNumber)).Methods("PUT")
	router.HandleFunc("/user/wallet", auth.RequireRole(userHandler.UpdateWallet)).Methods("PUT")

	// Admin Routes (require "admin" role)
	router.HandleFunc("/user/{userID}", auth.RequireRole(adminHandler.PutUser, "admin")).Methods("PUT")
	router.HandleFunc("/user/{userID}/roles", auth.RequireRole(adminHandler.PostUserRole, "admin")).Methods("POST")
	router.HandleFunc("/user/{userID}/roles/{roleID}", auth.RequireRole(adminHandler.DeleteUserRole, "admin")).Methods("DELETE")
	router.HandleFunc("/user", auth.RequireRole(adminHandler.PostUser, "admin")).Methods("POST")
	router.HandleFunc("/users", auth.RequireRole(adminHandler.GetUsers, "admin")).Methods("GET")
	router.HandleFunc("/users/{userID}", auth.RequireRole(adminHandler.DeleteUser, "admin")).Methods("DELETE")

	router.HandleFunc("/roles", auth.RequireRole(adminHandler.GetRoles, "admin")).Methods("GET")

	router.HandleFunc("/roles", auth.RequireRole(adminHandler.CreateRole, "admin")).Methods("POST")
	router.HandleFunc("/roles/{roleName}", auth.RequireRole(adminHandler.UpdateRole, "admin")).Methods("PUT")
	router.HandleFunc("/roles/{roleName}", auth.RequireRole(adminHandler.DeleteRole, "admin")).Methods("DELETE")

	// tender routes
	router.HandleFunc("/tender/offer", auth.RequireRole(tenderHandler.PostOffer, "tender")).Methods("POST")

	// entrepreneur routes
	router.HandleFunc("/entrepreneur/proposal", auth.RequireRole(entrepreneurHandler.PostProposal, "entrepreneur")).Methods("POST")
}

func SetupStaticRoutes(router *mux.Router) {
	// Create a file server for the public directory
	fileServer := http.FileServer(http.Dir("./public/"))

	// For open/public static files (no authentication required)
	router.PathPrefix("/public/").Handler(http.StripPrefix("/public/", fileServer))
	log.Println("Public static file server running on /public")

	privateFileServer := http.FileServer(http.Dir("./authenticated/"))

	// For protected static files (authentication required)
	protectedFileServer := http.StripPrefix("/authenticated/", privateFileServer)

	// This allows any authenticated user to access these files
	router.PathPrefix("/authenticated/").Handler(auth.RequireRoleHandler(protectedFileServer))
	log.Println("Protected static file server running on /authenticated")
}
