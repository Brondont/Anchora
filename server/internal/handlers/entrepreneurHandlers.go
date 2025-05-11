package handlers

import "net/http"

type EntrepreneurHandler struct {
	*Handler
}

func NewEntrepreneurHandler() *EntrepreneurHandler {
	return &EntrepreneurHandler{
		Handler: NewHandler(),
	}
}

const (
	DocTypeAdmin     = "administrative" // Dossier de candidature
	DocTypeTechnical = "technical"      // Offre technique
	DocTypeFinancial = "financial"      // Offre financière
)

func (h *EntrepreneurHandler) PostProposal(w http.ResponseWriter, r *http.Request) {

}
