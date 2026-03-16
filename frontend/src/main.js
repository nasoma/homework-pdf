import { marked } from 'marked';
import { EventsOn } from '../wailsjs/runtime/runtime';
import { ExportPDF, SavePDF, SuggestedFilename } from '../wailsjs/go/main/App';

// ─────────────────────────────────────────────
// Sample homework template shown on launch
// ─────────────────────────────────────────────
const SAMPLE_MARKDOWN = `# Times Tables Practice

**Name:** ________________________  **Date:** ________________  **Class:** ________

---

## Instructions

Solve each multiplication as quickly as you can. Show your working where needed.

---

## Section 1 — Complete the Table

| × | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| **3** | | | | | | | | | | |
| **7** | | | | | | | | | | |
| **9** | | | | | | | | | | |

---

## Section 2 — Solve These

1. 6 × 8 = ______
2. 7 × 7 = ______
3. 9 × 4 = ______
4. 12 × 6 = ______
5. 8 × 9 = ______

---

## Section 3 — Word Problem

> A teacher has **7 boxes** of crayons. Each box contains **12 crayons**.
> How many crayons are there in total? Show your working.

**Working:**

&nbsp;

&nbsp;

**Answer:** ______________________

---

*Well done for completing your homework! ⭐*
`;

// ─────────────────────────────────────────────
// Configure marked
// ─────────────────────────────────────────────
marked.use({
  breaks: true,
  gfm: true,
});

// ─────────────────────────────────────────────
// DOM references
// ─────────────────────────────────────────────
const editor         = document.getElementById('editor');
const preview        = document.getElementById('preview');
const exportBtn      = document.getElementById('exportBtn');
const clearBtn       = document.getElementById('clearBtn');
const settingsBtn    = document.getElementById('settingsBtn');
const settingsDrawer = document.getElementById('settingsDrawer');
const settingsOverlay= document.getElementById('settingsOverlay');
const settingsClose  = document.getElementById('settingsClose');
const statusMsg      = document.getElementById('statusMessage');

// Settings controls
const pageSizeEl      = document.getElementById('pageSize');
const fontFamilyEl    = document.getElementById('fontFamily');
const fontSizeEl      = document.getElementById('fontSize');
const fontSizeVal     = document.getElementById('fontSizeVal');
const marginTopEl     = document.getElementById('marginTop');
const marginBottomEl  = document.getElementById('marginBottom');
const marginLeftEl    = document.getElementById('marginLeft');
const marginRightEl   = document.getElementById('marginRight');
const marginTopVal    = document.getElementById('marginTopVal');
const marginBottomVal = document.getElementById('marginBottomVal');
const marginLeftVal   = document.getElementById('marginLeftVal');
const marginRightVal  = document.getElementById('marginRightVal');
const childFriendlyEl = document.getElementById('childFriendly');
const footerEnabledEl = document.getElementById('footerEnabled');
const footerTextRow   = document.getElementById('footerTextRow');
const footerTextEl    = document.getElementById('footerText');
const customCSSEl     = document.getElementById('customCSS');
const orientationCtrl = document.getElementById('orientationControl');

// ─────────────────────────────────────────────
// Settings state
// ─────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  pageSize:      'A4',
  orientation:   'portrait',
  fontFamily:    'Arial',
  fontSize:      12,
  marginTop:     20,
  marginBottom:  20,
  marginLeft:    20,
  marginRight:   20,
  childFriendly: false,
  footerEnabled: false,
  footerText:    '',
  customCSS:     '',
};

function loadSettings() {
  try {
    const stored = localStorage.getItem('homeworkpdf-settings');
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem('homeworkpdf-settings', JSON.stringify(getSettings()));
}

function getSettings() {
  const activeSegment = orientationCtrl.querySelector('.segment.active');
  return {
    pageSize:      pageSizeEl.value,
    orientation:   activeSegment ? activeSegment.dataset.value : 'portrait',
    fontFamily:    fontFamilyEl.value,
    fontSize:      parseInt(fontSizeEl.value, 10),
    marginTop:     parseInt(marginTopEl.value, 10),
    marginBottom:  parseInt(marginBottomEl.value, 10),
    marginLeft:    parseInt(marginLeftEl.value, 10),
    marginRight:   parseInt(marginRightEl.value, 10),
    childFriendly: childFriendlyEl.checked,
    footerEnabled: footerEnabledEl.checked,
    footerText:    footerTextEl.value,
    customCSS:     customCSSEl.value,
  };
}

function applySettings(s) {
  pageSizeEl.value    = s.pageSize;
  fontFamilyEl.value  = s.fontFamily;
  fontSizeEl.value    = s.fontSize;
  fontSizeVal.textContent = s.fontSize + 'pt';
  marginTopEl.value    = s.marginTop;    marginTopVal.textContent    = s.marginTop;
  marginBottomEl.value = s.marginBottom; marginBottomVal.textContent = s.marginBottom;
  marginLeftEl.value   = s.marginLeft;   marginLeftVal.textContent   = s.marginLeft;
  marginRightEl.value  = s.marginRight;  marginRightVal.textContent  = s.marginRight;
  childFriendlyEl.checked = s.childFriendly;
  footerEnabledEl.checked = s.footerEnabled;
  footerTextEl.value   = s.footerText;
  customCSSEl.value    = s.customCSS;
  footerTextRow.style.display = s.footerEnabled ? '' : 'none';

  // Orientation segmented control
  orientationCtrl.querySelectorAll('.segment').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === s.orientation);
  });
}

// ─────────────────────────────────────────────
// Preview rendering (debounced)
// ─────────────────────────────────────────────
let debounceTimer = null;

function renderPreview(markdown) {
  if (!markdown.trim()) {
    preview.innerHTML = '<p class="preview-placeholder">Start typing to see a live preview…</p>';
    return;
  }
  preview.innerHTML = marked.parse(markdown);
}

function scheduleRender() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => renderPreview(editor.value), 400);
}

editor.addEventListener('input', () => {
  scheduleRender();
  saveSettings();
});

// ─────────────────────────────────────────────
// Editor content persistence
// ─────────────────────────────────────────────
function saveEditorContent() {
  localStorage.setItem('homeworkpdf-content', editor.value);
}

function loadEditorContent() {
  return localStorage.getItem('homeworkpdf-content') ?? SAMPLE_MARKDOWN;
}

editor.addEventListener('input', saveEditorContent);

// ─────────────────────────────────────────────
// Splitter (resizable panels)
// ─────────────────────────────────────────────
const splitter    = document.getElementById('splitter');
const editorPanel = document.getElementById('editorPanel');
const mainContent = document.querySelector('.main-content');

let isDragging = false;

splitter.addEventListener('mousedown', (e) => {
  isDragging = true;
  splitter.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const rect = mainContent.getBoundingClientRect();
  const offset = e.clientX - rect.left;
  const totalWidth = rect.width - splitter.offsetWidth;
  const pct = Math.min(Math.max(offset / totalWidth, 0.2), 0.8);
  editorPanel.style.flex = `0 0 ${pct * 100}%`;
});

document.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  splitter.classList.remove('dragging');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
});

// ─────────────────────────────────────────────
// Settings drawer
// ─────────────────────────────────────────────
function openSettings() {
  settingsDrawer.classList.add('open');
  settingsDrawer.setAttribute('aria-hidden', 'false');
  settingsOverlay.classList.add('active');
}

function closeSettings() {
  settingsDrawer.classList.remove('open');
  settingsDrawer.setAttribute('aria-hidden', 'true');
  settingsOverlay.classList.remove('active');
}

settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', closeSettings);

// Range sliders live update
fontSizeEl.addEventListener('input', () => {
  fontSizeVal.textContent = fontSizeEl.value + 'pt';
  saveSettings();
});

[
  [marginTopEl, marginTopVal],
  [marginBottomEl, marginBottomVal],
  [marginLeftEl, marginLeftVal],
  [marginRightEl, marginRightVal],
].forEach(([input, label]) => {
  input.addEventListener('input', () => {
    label.textContent = input.value;
    saveSettings();
  });
});

// Segmented orientation control
orientationCtrl.querySelectorAll('.segment').forEach(btn => {
  btn.addEventListener('click', () => {
    orientationCtrl.querySelectorAll('.segment').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    saveSettings();
  });
});

// Footer text row visibility
footerEnabledEl.addEventListener('change', () => {
  footerTextRow.style.display = footerEnabledEl.checked ? '' : 'none';
  saveSettings();
});

// Persist all settings inputs
[pageSizeEl, fontFamilyEl, childFriendlyEl, footerTextEl, customCSSEl].forEach(el => {
  el.addEventListener('change', saveSettings);
});

// ─────────────────────────────────────────────
// Status messages
// ─────────────────────────────────────────────
let statusTimer = null;

function showStatus(msg, type = 'info', duration = 4000) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-message ' + type;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusMsg.textContent = '';
    statusMsg.className = 'status-message';
  }, duration);
}

// ─────────────────────────────────────────────
// Export PDF
// ─────────────────────────────────────────────
exportBtn.addEventListener('click', async () => {
  const markdown = editor.value.trim();
  if (!markdown) {
    showStatus('Nothing to export — write some content first.', 'error');
    return;
  }

  exportBtn.classList.add('loading');
  exportBtn.textContent = 'Generating…';
  showStatus('Generating PDF, please wait…', 'info', 30000);

  try {
    const settings = getSettings();
    const tmpPath = await ExportPDF(markdown, settings);

    if (!tmpPath) {
      showStatus('PDF generation failed. Is Google Chrome installed?', 'error');
      return;
    }

    const filename = await SuggestedFilename(markdown);
    const saved = await SavePDF(tmpPath, filename);

    if (saved) {
      showStatus(`Saved: ${saved.split('/').pop()}`, 'success');
    } else {
      showStatus('Export cancelled.', 'info', 2000);
    }
  } catch (err) {
    showStatus(`Error: ${err}`, 'error');
  } finally {
    exportBtn.classList.remove('loading');
    exportBtn.textContent = 'Export PDF';
  }
});

// ─────────────────────────────────────────────
// Clear editor
// ─────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  if (!editor.value.trim()) return;
  if (confirm('Clear the editor? This cannot be undone.')) {
    editor.value = '';
    renderPreview('');
    saveEditorContent();
    showStatus('Editor cleared.', 'info', 2000);
  }
});

// ─────────────────────────────────────────────
// Keyboard shortcuts
// ─────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (!e.metaKey && !e.ctrlKey) return;

  switch (e.key.toLowerCase()) {
    case 'e':
      e.preventDefault();
      exportBtn.click();
      break;
    case ',':
      e.preventDefault();
      openSettings();
      break;
    case 'k':
      e.preventDefault();
      clearBtn.click();
      break;
  }
});

// ─────────────────────────────────────────────
// Backend error events
// ─────────────────────────────────────────────
EventsOn('pdf:error', (msg) => {
  showStatus(`PDF error: ${msg}`, 'error', 6000);
  exportBtn.classList.remove('loading');
  exportBtn.textContent = 'Export PDF';
});

// ─────────────────────────────────────────────
// Initialise on load
// ─────────────────────────────────────────────
function init() {
  // Load persisted settings
  applySettings(loadSettings());

  // Load content
  editor.value = loadEditorContent();

  // Initial render
  renderPreview(editor.value);

  // Focus editor
  editor.focus();
}

init();
