package pdf

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

//go:embed fonts/*.ttf
var embeddedFonts embed.FS

// fontDir is initialised once and holds temp copies of embedded font files.
var (
	fontDirOnce sync.Once
	fontDir     string
	fontDirErr  error
)

// prepareFontDir writes embedded TTF files to a temp directory on first call
// and returns the directory path for use in file:// CSS src references.
func prepareFontDir() (string, error) {
	fontDirOnce.Do(func() {
		dir, err := os.MkdirTemp("", "homeworkpdf-fonts-*")
		if err != nil {
			fontDirErr = err
			return
		}

		entries, err := embeddedFonts.ReadDir("fonts")
		if err != nil {
			fontDirErr = err
			return
		}

		for _, entry := range entries {
			data, err := embeddedFonts.ReadFile("fonts/" + entry.Name())
			if err != nil {
				fontDirErr = err
				return
			}
			if err = os.WriteFile(filepath.Join(dir, entry.Name()), data, 0644); err != nil {
				fontDirErr = err
				return
			}
		}

		fontDir = dir
	})

	return fontDir, fontDirErr
}

// fontFaceCSS returns @font-face declarations for a given family name,
// referencing files in dir via file:// URLs.
// Returns an empty string for system fonts (Arial, etc.) that need no declaration.
func fontFaceCSS(family string, dir string) string {
	type weight struct {
		weight int
		style  string
		file   string
	}

	var variants []weight

	switch family {
	case "Google Sans":
		variants = []weight{
			{400, "normal", "GoogleSans-Regular.ttf"},
			{700, "normal", "GoogleSans-Bold.ttf"},
			{400, "italic", "GoogleSans-Italic.ttf"},
			{700, "italic", "GoogleSans-BoldItalic.ttf"},
		}
	case "Open Sans":
		variants = []weight{
			{400, "normal", "OpenSans-Regular.ttf"},
			{700, "normal", "OpenSans-Bold.ttf"},
			{400, "italic", "OpenSans-Italic.ttf"},
			{700, "italic", "OpenSans-BoldItalic.ttf"},
		}
	case "Roboto":
		variants = []weight{
			{400, "normal", "Roboto-Regular.ttf"},
			{700, "normal", "Roboto-Bold.ttf"},
			{400, "italic", "Roboto-Italic.ttf"},
			{700, "italic", "Roboto-BoldItalic.ttf"},
		}
	default:
		return "" // system font — no @font-face needed
	}

	css := ""
	for _, v := range variants {
		path := filepath.Join(dir, v.file)
		css += "@font-face {\n" +
			"  font-family: '" + family + "';\n" +
			"  src: url('file://" + path + "') format('truetype');\n" +
			"  font-weight: " + itoa(v.weight) + ";\n" +
			"  font-style: " + v.style + ";\n" +
			"}\n"
	}
	return css
}

func itoa(n int) string {
	return fmt.Sprintf("%d", n)
}
