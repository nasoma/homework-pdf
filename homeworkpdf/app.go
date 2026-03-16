package main

import (
	"context"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"unicode"

	"homeworkpdf/markdown"
	"homeworkpdf/pdf"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// App is the main application struct bound to the Wails frontend.
type App struct {
	ctx context.Context
}

// NewApp creates a new App instance.
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// ExportPDF converts markdown to PDF and returns the temp file path.
// The frontend should then call SavePDF with that path.
func (a *App) ExportPDF(markdownContent string, settings pdf.Settings) string {
	normalized := markdown.NormalizeMarkdown(markdownContent, settings.StripPreamble, settings.UnwrapFence)
	htmlBody := markdown.Convert(normalized)
	fullHTML := pdf.BuildHTML(htmlBody, settings)

	pdfBytes, err := pdf.Generate(fullHTML, settings)
	if err != nil {
		wailsRuntime.EventsEmit(a.ctx, "pdf:error", err.Error())
		return ""
	}

	tmpFile, err := os.CreateTemp("", "homeworkpdf-*.pdf")
	if err != nil {
		wailsRuntime.EventsEmit(a.ctx, "pdf:error", err.Error())
		return ""
	}
	defer tmpFile.Close()

	if _, err = tmpFile.Write(pdfBytes); err != nil {
		os.Remove(tmpFile.Name())
		wailsRuntime.EventsEmit(a.ctx, "pdf:error", err.Error())
		return ""
	}

	return tmpFile.Name()
}

// SavePDF prompts the user to choose a save location and writes the PDF there.
func (a *App) SavePDF(srcPath string, suggestedName string) string {
	if srcPath == "" {
		return ""
	}

	homeDir, err := os.UserHomeDir()
	defaultDir := ""
	if err == nil {
		downloadsDir := filepath.Join(homeDir, "Downloads")
		if _, statErr := os.Stat(downloadsDir); statErr == nil {
			defaultDir = downloadsDir
		}
	}

	savePath, err := wailsRuntime.SaveFileDialog(a.ctx, wailsRuntime.SaveDialogOptions{
		DefaultDirectory: defaultDir,
		DefaultFilename:  suggestedName,
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "PDF Files (*.pdf)", Pattern: "*.pdf"},
		},
	})

	// Always clean up the temp file
	defer os.Remove(srcPath)

	if err != nil || savePath == "" {
		return ""
	}

	data, err := os.ReadFile(srcPath)
	if err != nil {
		return ""
	}

	if err = os.WriteFile(savePath, data, 0644); err != nil {
		return ""
	}

	return savePath
}

// SaveToDownloads copies the file at srcPath to ~/Downloads with the given filename.
// The temp file at srcPath is deleted after copying.
func (a *App) SaveToDownloads(srcPath string, filename string) string {
	if srcPath == "" {
		return ""
	}
	defer os.Remove(srcPath)

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ""
	}

	destPath := filepath.Join(homeDir, "Downloads", filename)

	data, err := os.ReadFile(srcPath)
	if err != nil {
		return ""
	}

	if err = os.WriteFile(destPath, data, 0644); err != nil {
		return ""
	}

	return destPath
}

// slugify derives a safe filename from the first H1 heading in the markdown.
func slugify(markdownContent string) string {
	lines := strings.Split(markdownContent, "\n")
	title := ""
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "# ") {
			title = strings.TrimPrefix(line, "# ")
			break
		}
	}

	if title == "" {
		return "homework.pdf"
	}

	// Remove non-alphanumeric characters
	re := regexp.MustCompile(`[^\p{L}\p{N}\s-]`)
	slug := re.ReplaceAllString(title, "")

	// Replace spaces and multiple dashes with a single dash
	slug = strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) {
			return '-'
		}
		return unicode.ToLower(r)
	}, slug)

	slug = regexp.MustCompile(`-{2,}`).ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")

	if slug == "" {
		return "homework.pdf"
	}
	return slug + ".pdf"
}

// SuggestedFilename returns a slugified filename based on the first H1 heading.
func (a *App) SuggestedFilename(markdownContent string) string {
	return slugify(markdownContent)
}
