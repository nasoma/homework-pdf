package pdf

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

// pageDimensions returns paper width and height in inches for the given page size.
// When landscape is true, width and height are swapped.
func pageDimensions(pageSize string, landscape bool) (width, height float64) {
	switch pageSize {
	case "Letter":
		width, height = 8.5, 11.0
	case "A5":
		width, height = 5.83, 8.27
	default: // A4
		width, height = 8.27, 11.69
	}
	if landscape {
		return height, width
	}
	return width, height
}

// mmToInches converts millimetres to inches.
func mmToInches(mm float64) float64 {
	return mm / 25.4
}

// KaTeXRenderWait is the delay after page load before printing to PDF,
// giving KaTeX time to finish rendering math expressions.
// Increase this on slower machines if math appears unrendered in exports.
const KaTeXRenderWait = 500 * time.Millisecond

// Generate renders fullHTML to PDF bytes using chromedp headless Chrome.
func Generate(fullHTML string, s Settings) ([]byte, error) {
	// Write HTML to a temp file so chromedp can navigate to it via file://
	tmpHTML, err := os.CreateTemp("", "homeworkpdf-*.html")
	if err != nil {
		return nil, fmt.Errorf("creating temp HTML file: %w", err)
	}
	defer os.Remove(tmpHTML.Name())

	if _, err = tmpHTML.WriteString(fullHTML); err != nil {
		tmpHTML.Close()
		return nil, fmt.Errorf("writing HTML: %w", err)
	}
	tmpHTML.Close()

	fileURL := "file://" + tmpHTML.Name()

	// Create chromedp context
	allocCtx, cancelAlloc := chromedp.NewExecAllocator(context.Background(),
		append(chromedp.DefaultExecAllocatorOptions[:],
			chromedp.Flag("headless", true),
			chromedp.Flag("disable-gpu", true),
			chromedp.Flag("no-sandbox", true),
			chromedp.Flag("disable-dev-shm-usage", true),
		)...,
	)
	defer cancelAlloc()

	ctx, cancelCtx := chromedp.NewContext(allocCtx)
	defer cancelCtx()

	timeoutCtx, cancelTimeout := context.WithTimeout(ctx, 60*time.Second)
	defer cancelTimeout()

	paperWidth, paperHeight := pageDimensions(s.PageSize, s.Orientation == "landscape")
	landscape := s.Orientation == "landscape"

	marginTop := mmToInches(s.MarginTop)
	marginBottom := mmToInches(s.MarginBottom)
	marginLeft := mmToInches(s.MarginLeft)
	marginRight := mmToInches(s.MarginRight)

	printParams := page.PrintToPDF().
		WithPaperWidth(paperWidth).
		WithPaperHeight(paperHeight).
		WithLandscape(landscape).
		WithPrintBackground(true).
		WithMarginTop(marginTop).
		WithMarginBottom(marginBottom).
		WithMarginLeft(marginLeft).
		WithMarginRight(marginRight)

	if s.FooterEnabled {
		footerHTML := buildFooterTemplate(s.FooterText)
		printParams = printParams.
			WithDisplayHeaderFooter(true).
			WithHeaderTemplate(`<div></div>`).
			WithFooterTemplate(footerHTML)
	} else {
		printParams = printParams.WithDisplayHeaderFooter(false)
	}

	var pdfBuf []byte
	if err := chromedp.Run(timeoutCtx,
		chromedp.Navigate(fileURL),
		chromedp.WaitReady("body"),
		chromedp.Sleep(KaTeXRenderWait),
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			pdfBuf, _, err = printParams.Do(ctx)
			return err
		}),
	); err != nil {
		return nil, fmt.Errorf("generating PDF: %w", err)
	}

	return pdfBuf, nil
}

func buildFooterTemplate(customText string) string {
	text := customText
	pageNum := `<span class="pageNumber"></span>`
	total := `<span class="totalPages"></span>`

	content := fmt.Sprintf(`Page %s of %s`, pageNum, total)
	if text != "" {
		content = fmt.Sprintf(`%s &nbsp;·&nbsp; %s`, text, content)
	}

	return fmt.Sprintf(`
		<div style="
			font-family: Georgia, serif;
			font-size: 9px;
			color: #5b7a99;
			text-align: center;
			width: 100%%;
			padding: 0 20px;
		">%s</div>`, content)
}
