package pdf

// Settings holds all user-configurable PDF export options.
type Settings struct {
	PageSize      string  `json:"pageSize"`
	Orientation   string  `json:"orientation"`
	FontFamily    string  `json:"fontFamily"`
	FontSize      int     `json:"fontSize"`
	MarginTop     float64 `json:"marginTop"`
	MarginBottom  float64 `json:"marginBottom"`
	MarginLeft    float64 `json:"marginLeft"`
	MarginRight   float64 `json:"marginRight"`
	ChildFriendly bool    `json:"childFriendly"`
	FooterEnabled bool    `json:"footerEnabled"`
	FooterText    string  `json:"footerText"`
	CustomCSS     string  `json:"customCSS"`
	StripPreamble bool    `json:"stripPreamble"`
	UnwrapFence   bool    `json:"unwrapFence"`
}
