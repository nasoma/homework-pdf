# Homework PDF

A macOS desktop app for writing and exporting homework sheets as polished PDFs. Write in Markdown, see a live preview, and export with one keystroke.

![App Screenshot](assets/screenhsot.png)

---

## Features

- **Live preview** — Markdown renders in real time as you type
- **One-click PDF export** — chromedp generates a pixel-perfect PDF via headless Chrome
- **Page settings** — A4, Letter, A5; portrait or landscape; adjustable margins
- **Typography** — choose font (Arial, Google Sans, Open Sans, Roboto) and font size
- **Child-Friendly Mode** — bumps text to ≥16pt with relaxed line spacing for younger readers
- **Page footer** — optional page numbers with custom footer text
- **Custom CSS** — inject your own styles directly into the PDF stylesheet
- **Persistent state** — editor content and settings are saved to localStorage

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘E` | Export PDF |
| `⌘,` | Open Settings |
| `⌘K` | Clear editor |

## Requirements

- macOS (arm64 or Intel)
- [Google Chrome](https://www.google.com/chrome/) installed — used by chromedp for PDF generation

## Build & Run

```bash
# Development (hot reload)
make dev

# Production build (Apple Silicon)
make build

# Production build (Intel)
make build-intel
```

The built app is output to `build/bin/homeworkpdf.app`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop framework | [Wails v2](https://wails.io) (Go + macOS WebView) |
| PDF generation | [chromedp](https://github.com/chromedp/chromedp) |
| Markdown parsing | [goldmark](https://github.com/yuin/goldmark) (backend) + [marked.js](https://marked.js.org) (preview) |
| Frontend | Vanilla HTML/CSS/JS bundled with [Vite](https://vitejs.dev) |
