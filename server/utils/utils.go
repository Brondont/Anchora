package utils

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/Brondont/trust-api/middleware"
	"golang.org/x/crypto/bcrypt"
)

type ErrorResponse struct {
	Error struct {
		Msg string `json:"msg"`
	} `json:"error"`
}

type MultiPartFormData struct {
	Fields map[string][]string
	File   *multipart.FileHeader
	Files  []*multipart.FileHeader
	Model  *multipart.FileHeader
}

func ParseJson(r *http.Request, payload any) error {
	if r.Body == nil {
		return fmt.Errorf("missing request body")
	}
	return json.NewDecoder(r.Body).Decode(payload)
}

func WriteJson(w http.ResponseWriter, status int, v any) error {
	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(v)
}

func WriteError(w http.ResponseWriter, status int, err error) {
	response := ErrorResponse{}
	response.Error.Msg = err.Error()
	WriteJson(w, status, response)
}

func WriteInputValidationError(w http.ResponseWriter, status int, err interface{}) {
	response := middleware.ErrorResponse{}

	// Convert the error based on its type
	switch e := err.(type) {
	case middleware.InputValidationError:
		// Single error - convert to array with one item
		response.Error = []middleware.InputValidationError{e}
	case []middleware.InputValidationError:
		// Array of errors - use directly
		response.Error = e
	}

	WriteJson(w, status, response)
}

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// VerifyPassword verifies if the given password matches the stored hash.
func VerifyPassword(password string, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// ParseMultipartForm parses a multipart form and returns structured data
func ParseMultipartForm(r *http.Request, maxMemory int64) (*MultiPartFormData, error) {
	if err := r.ParseMultipartForm(maxMemory); err != nil {
		return nil, fmt.Errorf("parse multipart form: %w", err)
	}

	data := &MultiPartFormData{
		Fields: make(map[string][]string),
	}

	// Get form fields - handles both Form and PostForm
	for key, values := range r.MultipartForm.Value {
		if len(values) > 0 {
			data.Fields[key] = values
		}
	}

	// Get the first file if it exists

	if fileHeader, ok := r.MultipartForm.File["image"]; ok && len(fileHeader) > 0 {
		data.File = fileHeader[0]
	}

	if modelHeader, ok := r.MultipartForm.File["model"]; ok && len(modelHeader) > 0 {
		data.Model = modelHeader[0]
	}

	if files, ok := r.MultipartForm.File["images"]; ok {
		data.Files = append(data.Files, files...)
	}

	return data, nil
}

// SaveUploadedFile saves a file to disk and returns its path
func SaveUploadedFile(file *multipart.FileHeader, destDir string) (string, error) {
	if file == nil {
		return "", fmt.Errorf("no file provided")
	}

	// Get the current working directory (project root)
	cwd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("get working directory: %w", err)
	}

	// Ensure the path is relative to the project root directory
	absDestDir := filepath.Join(cwd, destDir)

	// Ensure destination directory exists
	if err := os.MkdirAll(absDestDir, 0755); err != nil {
		return "", fmt.Errorf("create directory: %w", err)
	}

	// Create a new random source and generator
	randSource := rand.NewSource(time.Now().UnixNano())
	randGen := rand.New(randSource)

	// Generate a random number and timestamp to ensure uniqueness
	randomID := randGen.Intn(1_000_000)
	timestamp := fmt.Sprintf("%d", time.Now().UnixNano())

	// Extract file extension from the original file
	fileExtension := filepath.Ext(file.Filename)

	// Generate the new unique filename with random number, timestamp, and file extension
	filename := fmt.Sprintf("%d_%s%s", randomID, timestamp, fileExtension)
	filePath := filepath.Join(absDestDir, filename)

	// Open the source file
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("open source file: %w", err)
	}
	defer src.Close()

	// Create the destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("create destination file: %w", err)
	}
	defer dst.Close()

	// Copy the content from the source to the destination file
	if _, err = io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("copy file: %w", err)
	}

	// Return the path to the saved file
	return destDir + "/" + filename, nil
}
