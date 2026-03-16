package pdf

import "fmt"

// BuildHTML wraps converted HTML content in a full document with print-optimised CSS.
// Custom fonts (Google Sans, Open Sans, Roboto) are embedded via file:// @font-face rules.
func BuildHTML(bodyHTML string, s Settings) string {
	fontSize := s.FontSize
	if fontSize <= 0 {
		fontSize = 12
	}

	lineHeight := "1.6"

	if s.ChildFriendly {
		if fontSize < 16 {
			fontSize = 16
		}
		lineHeight = "1.9"
	}

	fontFamily := s.FontFamily
	if fontFamily == "" {
		fontFamily = "Arial"
	}

	// Inject @font-face for custom fonts; empty string for system fonts like Arial.
	customFontCSS := ""
	if fontFamily == "Google Sans" || fontFamily == "Open Sans" || fontFamily == "Roboto" {
		dir, err := prepareFontDir()
		if err == nil {
			customFontCSS = fontFaceCSS(fontFamily, dir)
		}
	}

	footerCSS := ""
	if s.FooterEnabled {
		footerCSS = `@page { margin-bottom: 20mm; }`
	}

	css := fmt.Sprintf(`
		%s

		* { box-sizing: border-box; margin: 0; padding: 0; }

		body {
			font-family: '%s', Arial, sans-serif;
			font-size: %dpt;
			line-height: %s;
			color: #1a2b3c;
			background: #ffffff;
		}

		h1, h2, h3, h4, h5, h6 {
			color: #0d3b6e;
			margin-top: 1.4em;
			margin-bottom: 0.5em;
			page-break-after: avoid;
		}

		h1 {
			font-size: 2em;
			border-bottom: 2px solid #2b7fd4;
			padding-bottom: 0.3em;
			margin-top: 0;
		}

		h2 {
			font-size: 1.5em;
			border-bottom: 1px solid #d6e4f0;
			padding-bottom: 0.2em;
		}

		h3 { font-size: 1.2em; }

		p { margin-bottom: 0.8em; }

		ul, ol {
			margin-bottom: 0.8em;
			padding-left: 1.8em;
		}

		li { margin-bottom: 0.3em; }

		table {
			width: 100%%;
			border-collapse: collapse;
			margin: 1em 0;
			page-break-inside: avoid;
		}

		th, td {
			border: 1px solid #d6e4f0;
			padding: 8px 12px;
			text-align: left;
		}

		th {
			background: #e8f2fc;
			font-weight: 600;
			color: #0d3b6e;
		}

		tr:nth-child(even) td { background: #f8fbff; }

		code {
			font-family: 'Courier New', 'Courier', monospace;
			font-size: 0.9em;
			background: #f0f6ff;
			padding: 2px 5px;
			border-radius: 3px;
			border: 1px solid #d6e4f0;
		}

		pre {
			background: #f0f6ff;
			border: 1px solid #d6e4f0;
			border-radius: 4px;
			padding: 16px;
			overflow-x: auto;
			margin-bottom: 1em;
			page-break-inside: avoid;
		}

		pre code {
			background: none;
			border: none;
			padding: 0;
		}

		blockquote {
			border-left: 4px solid #2b7fd4;
			padding-left: 1em;
			margin: 1em 0;
			color: #5b7a99;
			font-style: italic;
		}

		hr {
			border: none;
			border-top: 2px solid #d6e4f0;
			margin: 1.5em 0;
		}

		a { color: #2b7fd4; }

		strong { color: #0d3b6e; }

		img {
			max-width: 100%%;
			height: auto;
			page-break-inside: avoid;
		}

		img[src="placeholder"], img:not([src]), img[src=""] {
			display: block;
			width: 100%%;
			min-height: 120px;
			background: #E8F2FC;
			border: 2px dashed #2B7FD4;
		}

		%s

		%s
	`, customFontCSS, fontFamily, fontSize, lineHeight, footerCSS, s.CustomCSS)

	katexScript := `<script>window.addEventListener('load', function() {
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }
});</script>`

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<style>%s</style>
</head>
<body>%s%s</body>
</html>`, css, bodyHTML, katexScript)
}
