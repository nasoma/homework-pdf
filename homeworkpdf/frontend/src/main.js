import { marked } from 'marked';
import { EventsOn } from '../wailsjs/runtime/runtime';
import { ExportPDF, SavePDF, SuggestedFilename, SaveToDownloads } from '../wailsjs/go/main/App';

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
const pageSizeEl           = document.getElementById('pageSize');
const fontFamilyEl         = document.getElementById('fontFamily');
const fontSizeEl           = document.getElementById('fontSize');
const fontSizeVal          = document.getElementById('fontSizeVal');
const marginTopEl          = document.getElementById('marginTop');
const marginBottomEl       = document.getElementById('marginBottom');
const marginLeftEl         = document.getElementById('marginLeft');
const marginRightEl        = document.getElementById('marginRight');
const marginTopVal         = document.getElementById('marginTopVal');
const marginBottomVal      = document.getElementById('marginBottomVal');
const marginLeftVal        = document.getElementById('marginLeftVal');
const marginRightVal       = document.getElementById('marginRightVal');
const childFriendlyEl      = document.getElementById('childFriendly');
const footerEnabledEl      = document.getElementById('footerEnabled');
const footerTextRow        = document.getElementById('footerTextRow');
const footerTextEl         = document.getElementById('footerText');
const customCSSEl          = document.getElementById('customCSS');
const orientationCtrl      = document.getElementById('orientationControl');
const autoDetectAnswerKeyEl= document.getElementById('autoDetectAnswerKey');
const unwrapFenceEl        = document.getElementById('unwrapFence');

// ─────────────────────────────────────────────
// Settings state
// ─────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  pageSize:             'A4',
  orientation:          'portrait',
  fontFamily:           'Arial',
  fontSize:             12,
  marginTop:            20,
  marginBottom:         20,
  marginLeft:           20,
  marginRight:          20,
  childFriendly:        false,
  footerEnabled:        false,
  footerText:           '',
  customCSS:            '',
  autoDetectAnswerKey:  true,
  unwrapFence:          true,
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
    pageSize:             pageSizeEl.value,
    orientation:          activeSegment ? activeSegment.dataset.value : 'portrait',
    fontFamily:           fontFamilyEl.value,
    fontSize:             parseInt(fontSizeEl.value, 10),
    marginTop:            parseInt(marginTopEl.value, 10),
    marginBottom:         parseInt(marginBottomEl.value, 10),
    marginLeft:           parseInt(marginLeftEl.value, 10),
    marginRight:          parseInt(marginRightEl.value, 10),
    childFriendly:        childFriendlyEl.checked,
    footerEnabled:        footerEnabledEl.checked,
    footerText:           footerTextEl.value,
    customCSS:            customCSSEl.value,
    autoDetectAnswerKey:  autoDetectAnswerKeyEl.checked,
    unwrapFence:          unwrapFenceEl.checked,
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
  childFriendlyEl.checked        = s.childFriendly;
  footerEnabledEl.checked        = s.footerEnabled;
  footerTextEl.value             = s.footerText;
  customCSSEl.value              = s.customCSS;
  autoDetectAnswerKeyEl.checked  = s.autoDetectAnswerKey;
  unwrapFenceEl.checked          = s.unwrapFence;
  footerTextRow.style.display    = s.footerEnabled ? '' : 'none';

  orientationCtrl.querySelectorAll('.segment').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === s.orientation);
  });
}

// ─────────────────────────────────────────────
// AI Markdown normalisation
// ─────────────────────────────────────────────
function normalizeMarkdown(text, settings) {
  // Unwrap incorrectly fenced content
  if (settings.unwrapFence) {
    const trimmed = text.trim();
    const fenceMatch = trimmed.match(/^```[^\n]*\n([\s\S]*)\n```$/);
    if (fenceMatch) {
      text = fenceMatch[1];
    }
  }

  // Collapse 3+ blank lines into 2
  text = text.replace(/\n{4,}/g, '\n\n\n');

  return text;
}

// ─────────────────────────────────────────────
// Preview rendering (debounced for typing)
// ─────────────────────────────────────────────
let debounceTimer = null;

function renderPreview(markdown) {
  if (!markdown.trim()) {
    preview.innerHTML = '<p class="preview-placeholder">Start typing to see a live preview…</p>';
    return;
  }
  const s = getSettings();
  preview.innerHTML = marked.parse(normalizeMarkdown(markdown, s));
  applyBrokenImageHandlers();
  if (window.renderMathInElement) {
    renderMathInElement(preview, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
    });
  }
}

function scheduleRender() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    renderPreview(editor.value);
    const s = getSettings();
    if (s.autoDetectAnswerKey) detectAnswerKey(editor.value);
  }, 400);
}

editor.addEventListener('input', () => {
  scheduleRender();
  saveSettings();
});

// ─────────────────────────────────────────────
// Paste — instant render + answer key detection
// ─────────────────────────────────────────────
editor.addEventListener('paste', () => {
  clearTimeout(debounceTimer);
  setTimeout(() => {
    renderPreview(editor.value);
    saveEditorContent();
    const s = getSettings();
    if (s.autoDetectAnswerKey) {
      detectAnswerKey(editor.value);
    } else {
      showStatus('Ready to export — press ⌘E', 'info', 3000);
    }
  }, 0);
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
// Image drag-and-drop into editor
// ─────────────────────────────────────────────
editorPanel.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});

editorPanel.addEventListener('drop', (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  for (const file of files) {
    if (!file.type.match(/^image\/(png|jpeg|gif|webp)$/)) continue;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const insertion = `![image](${ev.target.result})`;
      const start = editor.selectionStart;
      const end   = editor.selectionEnd;
      editor.value = editor.value.slice(0, start) + insertion + editor.value.slice(end);
      editor.selectionStart = editor.selectionEnd = start + insertion.length;
      renderPreview(editor.value);
      saveEditorContent();
      showStatus('Image inserted as base64', 'info', 3000);
    };
    reader.readAsDataURL(file);
    break; // only first image per drop
  }
});

// ─────────────────────────────────────────────
// Broken image handler
// ─────────────────────────────────────────────
function applyBrokenImageHandlers() {
  preview.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => img.classList.add('img-broken'), { once: true });
  });
}

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
[
  pageSizeEl, fontFamilyEl, childFriendlyEl, footerTextEl, customCSSEl,
  autoDetectAnswerKeyEl, unwrapFenceEl,
].forEach(el => {
  el.addEventListener('change', saveSettings);
});

// ─────────────────────────────────────────────
// Status messages
// ─────────────────────────────────────────────
let statusTimer = null;

function showStatus(msg, type = 'info', duration = 4000) {
  clearTimeout(statusTimer);
  statusMsg.textContent = msg;
  statusMsg.className = 'status-message ' + type;
  if (duration > 0) {
    statusTimer = setTimeout(() => {
      statusMsg.textContent = '';
      statusMsg.className = 'status-message';
    }, duration);
  }
}

// ─────────────────────────────────────────────
// Answer key detection
// ─────────────────────────────────────────────
const ANSWER_KEY_RE = /^#{1,2}\s*(answer\s*key|answers|solutions|answer\s*sheet)\s*$/im;

let answerKeySplit = null; // { studentMd, fullMd, slug }

function detectAnswerKey(markdown) {
  const match = markdown.match(ANSWER_KEY_RE);
  if (!match) {
    clearAnswerKeyPrompt();
    return;
  }

  const idx = markdown.search(ANSWER_KEY_RE);
  const studentMd = markdown.slice(0, idx).trimEnd();

  answerKeySplit = { studentMd, fullMd: markdown };
  showAnswerKeyPrompt();
}

function showAnswerKeyPrompt() {
  clearTimeout(statusTimer);
  statusMsg.innerHTML =
    'Answer key detected — export student version and answer key separately? ' +
    '<button class="status-btn" id="exportBothBtn">Export Both</button>' +
    '<button class="status-btn status-btn--ghost" id="exportFullBtn">Export Full Document</button>';
  statusMsg.className = 'status-message info';

  document.getElementById('exportBothBtn').addEventListener('click', handleExportBoth);
  document.getElementById('exportFullBtn').addEventListener('click', handleExportFull);
}

function clearAnswerKeyPrompt() {
  if (!answerKeySplit) return;
  answerKeySplit = null;
  clearTimeout(statusTimer);
  statusMsg.textContent = '';
  statusMsg.className = 'status-message';
}

function deriveSlug(markdown) {
  for (const line of markdown.split('\n')) {
    const m = line.match(/^#\s+(.+)/);
    if (m) {
      return m[1].trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'homework';
    }
  }
  return 'homework';
}

async function handleExportBoth() {
  if (!answerKeySplit) return;

  const { studentMd, fullMd } = answerKeySplit;
  const slug = deriveSlug(fullMd);
  const studentFilename = `${slug}-student.pdf`;
  const answersFilename = `${slug}-answers.pdf`;

  exportBtn.classList.add('loading');
  exportBtn.textContent = 'Generating…';
  statusMsg.textContent = 'Generating both PDFs…';
  statusMsg.className = 'status-message info';

  try {
    const settings = getSettings();

    const studentTmp = await ExportPDF(studentMd, settings);
    if (!studentTmp) {
      showStatus('Failed to generate student PDF. Is Google Chrome installed?', 'error');
      return;
    }

    const answersTmp = await ExportPDF(fullMd, settings);
    if (!answersTmp) {
      showStatus('Failed to generate answers PDF.', 'error');
      return;
    }

    const [savedStudent, savedAnswers] = await Promise.all([
      SaveToDownloads(studentTmp, studentFilename),
      SaveToDownloads(answersTmp, answersFilename),
    ]);

    if (savedStudent && savedAnswers) {
      showStatus(`Saved to Downloads: ${studentFilename} and ${answersFilename}`, 'success');
    } else {
      showStatus('Error saving files to Downloads.', 'error');
    }
  } catch (err) {
    showStatus(`Error: ${err}`, 'error');
  } finally {
    exportBtn.classList.remove('loading');
    exportBtn.textContent = 'Export PDF';
    answerKeySplit = null;
  }
}

function handleExportFull() {
  clearAnswerKeyPrompt();
  exportBtn.click();
}

// ─────────────────────────────────────────────
// Export PDF (single document)
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
    clearAnswerKeyPrompt();
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
  const s = loadSettings();
  applySettings(s);
  editor.value = loadEditorContent();
  renderPreview(editor.value);
  if (s.autoDetectAnswerKey) detectAnswerKey(editor.value);
  editor.focus();
}

init();
