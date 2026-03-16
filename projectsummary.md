# HomeworkPDF — Project Summary

A macOS desktop application for creating clean, printable homework sheets from Markdown.
Built with **Go + Wails v2** (native macOS WebView, no Electron).

---

## Tech Stack

| Layer | Technology |
|---|---|
| App framework | [Wails v2](https://wails.io) — Go backend + macOS WebView frontend |
| PDF generation | [chromedp](https://github.com/chromedp/chromedp) — headless Chrome via `Page.PrintToPDF` |
| Markdown parsing (backend) | [goldmark](https://github.com/yuin/goldmark) — GFM, tables, strikethrough, task lists |
| Markdown parsing (frontend) | [marked.js](https://marked.js.org) v12 — live preview rendering |
| Frontend bundler | [Vite](https://vitejs.dev) v5 |
| Frontend language | Vanilla HTML / CSS / JavaScript — no framework |
| Dependency management | Go modules + npm |

---

## File Structure

```
homeworkpdf/
├── main.go                   # Wails app entry point, window config
├── app.go                    # Bound Go methods exposed to the frontend
├── pdf/
│   ├── types.go              # Settings struct (all PDF export options)
│   ├── generator.go          # chromedp headless Chrome → PDF bytes
│   └── stylesheet.go         # BuildHTML — wraps content in print-optimised HTML+CSS
├── markdown/
│   └── converter.go          # goldmark Markdown → HTML
├── frontend/
│   ├── index.html            # Full app UI layout
│   ├── package.json          # npm deps: marked, vite
│   └── src/
│       ├── main.js           # All frontend logic
│       └── style.css         # Complete blue-palette design system
├── build/
│   └── bin/
│       └── homeworkpdf.app   # Compiled macOS .app bundle (arm64, ~11 MB)
├── Makefile                  # make dev / build / build-intel
└── wails.json                # Wails project config
```

---

## Layout

The app is a single-window, three-zone layout with a fixed toolbar and status bar.

```
┌─────────────────────────────────────────────────────┐
│  TOOLBAR  [HomeworkPDF logo] [word count] [buttons]  │
├────────────────────────┬────────────────────────────┤
│  EDITOR PANEL          │  PREVIEW PANEL             │
│  (Markdown textarea)   │  (Live rendered HTML)      │
│                        │                            │
│  Monospace font        │  White "page" card         │
│  Soft caret colour     │  Drop shadow               │
│  Subtle placeholder    │  Full typography styles    │
│                        │                            │
│         ◀ drag splitter ▶                           │
├────────────────────────┴────────────────────────────┤
│  STATUS BAR  [message]              [keyboard hints] │
└─────────────────────────────────────────────────────┘
         ↗ Settings drawer slides in from the right
```

### Window
- Default size: **1280 × 800 px**
- Minimum size: **960 × 640 px**
- Resizable, native macOS title bar (hidden-inset style with traffic-light buttons)

---

## Features

### Editor
- Full-height `<textarea>` with monospace font and comfortable line-height
- Distraction-free; no toolbar clutter inside the editing area
- Placeholder text guides new users
- Pre-loaded sample homework template on first launch (times tables exercise)
- Editor content **persisted to `localStorage`** — survives app restarts

### Live Preview
- Rendered via **marked.js** with a **400 ms debounce** on keystrokes
- Displayed as a white "printed page" card with drop shadow on a slightly darker background
- Full typographic styles: headings, tables, code blocks, blockquotes, task-list checkboxes, horizontal rules, bold, italic, strikethrough
- Mirrors the actual PDF output as closely as possible

### Resizable Splitter
- Drag the vertical divider to redistribute space between the editor and preview panels
- Constrained to 20 %–80 % of available width
- Visual highlight on hover and while dragging

### Settings Drawer
Slides in from the right edge with a smooth CSS transition. Divided into sections:

| Section | Controls |
|---|---|
| **Page** | Page size (A4 / Letter / A5), Orientation (Portrait / Landscape segmented toggle) |
| **Typography** | Font family (Georgia / Arial / Helvetica / System Default), Font size slider (10–24 pt) |
| **Margins** | Top / Bottom / Left / Right sliders (10–40 mm each), live mm readout |
| **Options** | Child-Friendly Mode toggle, Page Footer toggle + footer text field |
| **Custom CSS** | Free-form textarea injected into the PDF stylesheet |

All settings are **persisted to `localStorage`** and restored on next launch.

### Child-Friendly Mode
When enabled:
- Font size is forced to a minimum of **16 pt**
- Line height increases to **1.9** for easier reading
- PDF background becomes a **soft warm cream** (`#FFFDF5`)

### Page Footer
When enabled:
- Renders "Page N of M" in the PDF footer using Chrome's native print header/footer system
- Optional custom label (e.g. "Year 3 Maths") prepended to the page number

### PDF Export Flow
1. User clicks **Export PDF** (or presses ⌘E)
2. Frontend collects current Markdown + all settings → calls Go backend
3. Go converts Markdown → HTML (goldmark), wraps in styled HTML document
4. chromedp launches headless Chrome, navigates to a `file://` temp URL, calls `Page.PrintToPDF` with all paper/margin/landscape settings
5. PDF bytes written to a temp file; path returned to frontend
6. Native **Save File dialog** opens (defaulting to `~/Downloads`)
7. Suggested filename derived from the first `# H1` heading, slugified (e.g. `maths-homework.pdf`), falling back to `homework.pdf`
8. PDF written to chosen location; status bar confirms save

### Status Bar
- Timed status messages for success, info, and error states — never blocking alerts
- Colour-coded: green (success), blue (info), red (error)
- Keyboard shortcut hints always visible on the right

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| ⌘E | Export PDF |
| ⌘, | Open Settings drawer |
| ⌘K | Clear editor (with confirmation) |

### Word / Character Count
- Live count in the toolbar centre, updated on every keystroke

---

## Design System

All colours drawn from a refined blue palette. No dark mode.

| Role | Value |
|---|---|
| App background | `#F4F7FB` — cool white |
| Panel surfaces | `#FFFFFF` with `1px #D6E4F0` border + soft shadow |
| Primary accent | `#2B7FD4` — buttons, sliders, focus rings |
| Secondary accent | `#E8F2FC` — hover fills, selected states |
| Deep blue | `#0D3B6E` — headings, labels, app title |
| Body text | `#1A2B3C` — blue-tinted near-black |
| Muted text | `#5B7A99` |
| Settings drawer bg | `#F0F6FF` — subtly distinct layer |
| Transitions | `150 ms ease` on all interactive states |

---

## PDF Output Quality

The generated PDF uses a print-optimised stylesheet:
- Semantic heading hierarchy with `#0D3B6E` deep blue colour
- H1 with a solid `#2B7FD4` bottom border
- Tables with alternating row shading and blue header cells
- Syntax-highlighted code blocks with `#F0F6FF` background
- Blockquotes with a left accent bar
- Page-break hints (`page-break-inside: avoid`) on tables and code blocks
- Custom CSS fully injected after base styles (allows per-document overrides)

---

## Build & Distribution

### Prerequisites
- Go 1.21+
- Wails v2: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Node.js + npm
- Google Chrome (required at runtime for PDF generation via chromedp)

### Commands

```bash
make dev           # Hot-reload dev server (wails dev)
make build         # Production .app — Apple Silicon (arm64)
make build-intel   # Production .app — Intel Mac (amd64)
```

Output: `build/bin/homeworkpdf.app` (~11 MB, self-contained)

---

## Go Backend API (Wails-bound methods)

```go
// ExportPDF converts Markdown to PDF and returns a temp file path.
func (a *App) ExportPDF(markdown string, settings pdf.Settings) string

// SavePDF opens a native Save dialog and writes the PDF to the chosen path.
func (a *App) SavePDF(srcPath string, suggestedName string) string

// SuggestedFilename slugifies the first H1 heading into a filename.
func (a *App) SuggestedFilename(markdown string) string
```
