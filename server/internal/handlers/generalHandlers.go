package handlers

type GeneralHandler struct {
	*Handler
}

func NewGeneralHandler() *GeneralHandler {
	return &GeneralHandler{
		Handler: NewHandler(),
	}
}
