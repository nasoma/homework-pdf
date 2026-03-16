package markdown

import (
	"bytes"
	"regexp"
	"strings"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	"github.com/yuin/goldmark/renderer/html"
)

var excessiveNLs = regexp.MustCompile(`\n{4,}`)

// NormalizeMarkdown applies the AI-output normalisation pipeline before conversion.
// unwrapFence strips a single triple-backtick wrapper around the entire document.
func NormalizeMarkdown(input string, unwrapFence bool) string {
	text := input

	// Unwrap incorrectly fenced content
	if unwrapFence {
		trimmed := strings.TrimSpace(text)
		if strings.HasPrefix(trimmed, "```") {
			firstNL := strings.Index(trimmed, "\n")
			if firstNL != -1 {
				rest := trimmed[firstNL+1:]
				if lastFence := strings.LastIndex(rest, "\n```"); lastFence != -1 {
					if strings.TrimSpace(rest[lastFence+1:]) == "```" {
						text = rest[:lastFence]
					}
				}
			}
		}
	}

	// Collapse 3+ consecutive blank lines into 2
	text = excessiveNLs.ReplaceAllString(text, "\n\n\n")

	return text
}

var md = goldmark.New(
	goldmark.WithExtensions(
		extension.GFM,
		extension.Table,
		extension.Strikethrough,
		extension.TaskList,
	),
	goldmark.WithParserOptions(
		parser.WithAutoHeadingID(),
	),
	goldmark.WithRendererOptions(
		html.WithUnsafe(),
	),
)

// Convert parses Markdown and returns HTML.
func Convert(markdownContent string) string {
	var buf bytes.Buffer
	if err := md.Convert([]byte(markdownContent), &buf); err != nil {
		return ""
	}
	return buf.String()
}
