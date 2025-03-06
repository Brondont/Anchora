package handlers

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

type UserHandler struct {
	*Handler
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		Handler: NewHandler(),
	}
}
