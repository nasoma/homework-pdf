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

var (
	headingRe    = regexp.MustCompile(`^#{1,6}\s`)
	listItemRe   = regexp.MustCompile(`^[-*+]\s`)
	orderedRe    = regexp.MustCompile(`^\d+\.\s`)
	excessiveNLs = regexp.MustCompile(`\n{4,}`)
)

// NormalizeMarkdown applies the AI-output normalisation pipeline before conversion.
// stripPreamble removes conversational prose before the first heading/list.
// unwrapFence strips a single triple-backtick wrapper around the entire document.
func NormalizeMarkdown(input string, stripPreamble, unwrapFence bool) string {
	text := input

	// b) Unwrap incorrectly fenced content
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

	// a) Strip conversational preamble
	if stripPreamble {
		lines := strings.Split(text, "\n")
		firstIdx := -1
		for i, line := range lines {
			t := strings.TrimSpace(line)
			if headingRe.MatchString(t) || listItemRe.MatchString(t) || orderedRe.MatchString(t) {
				firstIdx = i
				break
			}
		}
		if firstIdx > 0 {
			hasContent := false
			for _, l := range lines[:firstIdx] {
				if strings.TrimSpace(l) != "" {
					hasContent = true
					break
				}
			}
			if hasContent {
				text = strings.Join(lines[firstIdx:], "\n")
			}
		}
	}

	// c) Collapse 3+ consecutive blank lines into 2
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
