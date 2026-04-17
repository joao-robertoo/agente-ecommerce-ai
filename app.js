/* =====================================================
   JHON — app.js v4
   Features:
     • Conversas persistidas no localStorage
     • Troca de conversa sem perder histórico
     • Upload de imagens (Llama Vision) e PDFs (PDF.js)
     • Streaming SSE + markdown
     • Event delegation (cópia funciona após restaurar DOM)
     • Transições cinematográficas
   ===================================================== */

marked.setOptions({ breaks: true, gfm: true });

// ── Constants ─────────────────────────────────────────
const STORE_KEY = 'jhon_v4_db';

// ── State ────────────────────────────────────────────
let currentId  = newId();
let history    = [];           // API messages array
let isStreaming = false;
let pendingFiles = [];         // files queued to send

// ── DOM refs ─────────────────────────────────────────
const splash          = document.getElementById('splash');
const app             = document.getElementById('app');
const messagesArea    = document.getElementById('messagesArea');
const welcome         = document.getElementById('welcome');
const userInput       = document.getElementById('userInput');
const sendBtn         = document.getElementById('sendBtn');
const newChatBtn      = document.getElementById('newChatBtn');
const sidebarToggle   = document.getElementById('sidebarToggle');
const sidebar         = document.getElementById('sidebar');
const convList        = document.getElementById('convList');
const currentConvItem = document.getElementById('currentConvItem');
const fileInput       = document.getElementById('fileInput');
const attachBtn       = document.getElementById('attachBtn');
const filePreviewArea = document.getElementById('filePreviewArea');
const dropOverlay     = document.getElementById('dropOverlay');

// ── DB helpers ────────────────────────────────────────
function loadDB() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { convs: [] }; }
  catch { return { convs: [] }; }
}

function saveDB(db) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
  catch (e) { console.warn('[JHON] localStorage cheio:', e); }
}

// ── ID generator ─────────────────────────────────────
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Time helper ───────────────────────────────────────
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'agora';
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

// ── Escape HTML ───────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Persist current conversation ──────────────────────
function persistCurrent() {
  if (history.length === 0) return;
  const db = loadDB();

  const firstUser = history.find(m => m.role === 'user');
  const raw       = firstUser?.content;
  let title       = 'Conversa';
  if (typeof raw === 'string') title = raw;
  else if (Array.isArray(raw)) {
    const t = raw.find(c => c.type === 'text');
    title = t?.text || '📎 Arquivo';
  }

  const conv = {
    id: currentId,
    title: title.slice(0, 60),
    history,
    html: messagesArea.innerHTML,
    ts:   Date.now(),
  };

  const idx = db.convs.findIndex(c => c.id === currentId);
  if (idx >= 0) db.convs[idx] = conv;
  else           db.convs.unshift(conv);

  saveDB(db);
}

// ── Render sidebar list ───────────────────────────────
function renderSidebar() {
  const db = loadDB();

  // Update current item label
  const label = currentConvItem.querySelector('.conv-label');
  if (history.length > 0) {
    const firstUser = history.find(m => m.role === 'user');
    const raw = firstUser?.content;
    let title = 'Conversa';
    if (typeof raw === 'string') title = raw;
    else if (Array.isArray(raw)) {
      const t = raw.find(c => c.type === 'text');
      title = t?.text || '📎 Arquivo';
    }
    label.textContent = title.slice(0, 34) + (title.length > 34 ? '…' : '');
  } else {
    label.textContent = 'Conversa atual';
  }

  // Rebuild past convs
  convList.querySelectorAll('.conv-item:not(#currentConvItem)').forEach(el => el.remove());

  db.convs.filter(c => c.id !== currentId).forEach(conv => {
    const item = document.createElement('div');
    item.className = 'conv-item';
    item.dataset.id = conv.id;

    item.innerHTML = `
      <svg class="conv-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <div class="conv-info">
        <span class="conv-label">${escapeHtml(conv.title.slice(0, 34))}${conv.title.length > 34 ? '…' : ''}</span>
        <span class="conv-time">${timeAgo(conv.ts)}</span>
      </div>
      <button class="conv-delete" title="Deletar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>`;

    item.addEventListener('click', e => {
      if (e.target.closest('.conv-delete')) return;
      openConv(conv.id);
    });

    item.querySelector('.conv-delete').addEventListener('click', e => {
      e.stopPropagation();
      removeConv(conv.id, item);
    });

    convList.appendChild(item);
  });
}

// ── Open saved conversation ───────────────────────────
function openConv(id) {
  if (id === currentId || isStreaming) return;

  persistCurrent();

  const db   = loadDB();
  const conv = db.convs.find(c => c.id === id);
  if (!conv) return;

  // Transition out
  messagesArea.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
  messagesArea.style.opacity    = '0';
  messagesArea.style.transform  = 'translateX(-10px)';

  setTimeout(() => {
    currentId = conv.id;
    history   = conv.history || [];

    messagesArea.innerHTML      = conv.html || '';
    welcome.style.display       = 'none';

    // Mark active
    convList.querySelectorAll('.conv-item').forEach(el => {
      el.classList.toggle('is-active', el.dataset.id === id || el.id === 'currentConvItem');
    });
    currentConvItem.classList.remove('is-active');

    // Transition in
    messagesArea.style.transform = 'translateX(10px)';
    requestAnimationFrame(() => {
      messagesArea.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      messagesArea.style.opacity    = '1';
      messagesArea.style.transform  = 'translateX(0)';
    });

    setTimeout(() => { messagesArea.style.transition = ''; }, 300);

    renderSidebar();
    scrollToBottom(true);
    sidebar.classList.remove('is-open');
  }, 180);
}

// ── Remove conversation ───────────────────────────────
function removeConv(id, itemEl) {
  itemEl.style.transition  = 'opacity 0.2s ease, max-height 0.2s ease, margin 0.2s ease, padding 0.2s ease';
  itemEl.style.opacity     = '0';
  itemEl.style.maxHeight   = itemEl.offsetHeight + 'px';

  setTimeout(() => {
    itemEl.style.maxHeight    = '0';
    itemEl.style.padding      = '0';
    itemEl.style.marginBottom = '0';
    setTimeout(() => {
      itemEl.remove();
      const db = loadDB();
      db.convs = db.convs.filter(c => c.id !== id);
      saveDB(db);
    }, 200);
  }, 200);
}

// ── Delete current conversation (from #currentConvItem) ──
window.deleteConversation = function(btn) {
  const db = loadDB();
  db.convs = db.convs.filter(c => c.id !== currentId);
  saveDB(db);
  startNewChat(false);
};

// ── New chat ──────────────────────────────────────────
function startNewChat(fromButton = true) {
  if (isStreaming) return;
  persistCurrent();

  currentId = newId();
  history   = [];

  messagesArea.innerHTML = '';
  welcome.style.display  = '';
  messagesArea.appendChild(welcome);

  pendingFiles = [];
  renderPendingFiles();

  currentConvItem.querySelector('.conv-label').textContent = 'Conversa atual';
  currentConvItem.classList.add('is-active');

  userInput.value      = '';
  userInput.style.height = 'auto';
  sendBtn.disabled     = true;

  renderSidebar();
  if (fromButton) sidebar.classList.remove('is-open');
}

newChatBtn.addEventListener('click', () => startNewChat(true));

// ── Splash animation ──────────────────────────────────
window.addEventListener('load', () => {
  renderSidebar(); // populate sidebar on load

  setTimeout(() => {
    app.classList.add('visible');
    const canvas = document.getElementById('particleCanvas');
    if (canvas) canvas.classList.add('visible');
    setTimeout(() => { splash.classList.add('hide'); }, 300);
  }, 2200);
});

// ── Auto-resize textarea ─────────────────────────────
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
  updateSendBtn();
});

userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

function updateSendBtn() {
  sendBtn.disabled = (userInput.value.trim() === '' && pendingFiles.length === 0) || isStreaming;
}

// ── Sidebar toggle ────────────────────────────────────
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('is-open');
});

document.addEventListener('click', e => {
  if (
    window.innerWidth <= 768 &&
    sidebar.classList.contains('is-open') &&
    !sidebar.contains(e.target) &&
    !sidebarToggle.contains(e.target)
  ) sidebar.classList.remove('is-open');
});

// ── Suggestion cards ──────────────────────────────────
document.querySelectorAll('.suggestion').forEach(btn => {
  btn.addEventListener('click', () => {
    userInput.value = btn.dataset.msg;
    userInput.dispatchEvent(new Event('input'));
    sendMessage();
  });
});

// ── Scroll helpers ────────────────────────────────────
function scrollToBottom(force = false) {
  const threshold = 150;
  const nearBottom = messagesArea.scrollHeight - messagesArea.scrollTop - messagesArea.clientHeight < threshold;
  if (nearBottom || force) messagesArea.scrollTop = messagesArea.scrollHeight;
}

// ── Event delegation: copy buttons ───────────────────
messagesArea.addEventListener('click', e => {
  const copyBtn = e.target.closest('.copy-btn');
  if (!copyBtn) return;

  const bubble = copyBtn.closest('.bot-wrapper')?.querySelector('.bubble-bot');
  if (!bubble) return;

  const raw = bubble.dataset.raw || bubble.innerText;
  navigator.clipboard.writeText(raw).then(() => {
    copyBtn.classList.add('copied');
    copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    setTimeout(() => {
      copyBtn.classList.remove('copied');
      copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    }, 2000);
  });
});

// ═══════════════════════════════════════════════════════
//   FILE UPLOAD
// ═══════════════════════════════════════════════════════

attachBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  handleFiles(fileInput.files);
  fileInput.value = '';
});

// ── Drag & Drop ───────────────────────────────────────
let dragCounter = 0;

document.addEventListener('dragenter', e => {
  if (!e.dataTransfer.types.includes('Files')) return;
  dragCounter++;
  dropOverlay.classList.add('visible');
});

document.addEventListener('dragleave', () => {
  dragCounter--;
  if (dragCounter <= 0) { dragCounter = 0; dropOverlay.classList.remove('visible'); }
});

document.addEventListener('dragover', e => e.preventDefault());

document.addEventListener('drop', e => {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.classList.remove('visible');
  if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});

// ── Process dropped/selected files ───────────────────
async function handleFiles(fileList) {
  for (const file of Array.from(fileList)) {
    if (file.type.startsWith('image/')) {
      await addImageFile(file);
    } else if (file.type === 'application/pdf') {
      await addPDFFile(file);
    } else {
      showToast(`Tipo não suportado: ${file.type || file.name}`);
    }
  }
  renderPendingFiles();
  updateSendBtn();
}

async function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

async function resizeImageForPreview(base64, maxPx = 240) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      res(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = base64;
  });
}

async function addImageFile(file) {
  const base64  = await fileToBase64(file);
  const preview = await resizeImageForPreview(base64);
  pendingFiles.push({ type: 'image', name: file.name, base64, preview });
}

async function addPDFFile(file) {
  try {
    if (!window.pdfjsLib) throw new Error('PDF.js não carregado');
    const ab  = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    const maxPages = Math.min(pdf.numPages, 15);
    let text = `[Documento PDF: ${file.name} — ${pdf.numPages} página(s)]\n\n`;

    for (let i = 1; i <= maxPages; i++) {
      const page    = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += `--- Página ${i} ---\n`;
      text += content.items.map(item => item.str).join(' ') + '\n\n';
    }
    if (pdf.numPages > maxPages) text += `[...restante do documento omitido]\n`;

    pendingFiles.push({ type: 'pdf', name: file.name, text, pages: pdf.numPages });
    showToast(`PDF carregado: ${pdf.numPages} páginas`);
  } catch (err) {
    console.error('PDF error:', err);
    showToast('Erro ao ler PDF. Tente novamente.');
  }
}

// ── Render file chips ─────────────────────────────────
function renderPendingFiles() {
  filePreviewArea.innerHTML = '';
  if (pendingFiles.length === 0) {
    filePreviewArea.style.display = 'none';
    return;
  }
  filePreviewArea.style.display = 'flex';

  pendingFiles.forEach((f, i) => {
    const chip = document.createElement('div');
    chip.className = 'file-chip';

    if (f.type === 'image') {
      chip.innerHTML = `
        <img src="${f.preview}" class="chip-thumb" alt="${escapeHtml(f.name)}">
        <span class="chip-name">${escapeHtml(f.name.slice(0, 20))}</span>
        <button class="chip-remove" data-i="${i}" title="Remover">×</button>`;
    } else {
      chip.innerHTML = `
        <div class="chip-pdf-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="chip-info">
          <span class="chip-name">${escapeHtml(f.name.slice(0, 20))}</span>
          <span class="chip-meta">${f.pages} págs.</span>
        </div>
        <button class="chip-remove" data-i="${i}" title="Remover">×</button>`;
    }

    chip.querySelector('.chip-remove').addEventListener('click', () => {
      pendingFiles.splice(i, 1);
      renderPendingFiles();
      updateSendBtn();
    });

    filePreviewArea.appendChild(chip);
  });
}

// ── Build API content from text + pending files ───────
function buildContent(text) {
  if (pendingFiles.length === 0) return text || '';

  const parts = [];

  // PDFs as text context
  pendingFiles.filter(f => f.type === 'pdf').forEach(f => {
    parts.push({ type: 'text', text: f.text.slice(0, 12000) });
  });

  // User text
  const combined = text.trim();
  if (combined) parts.push({ type: 'text', text: combined });
  else if (parts.length === 0) parts.push({ type: 'text', text: 'Analise este arquivo.' });

  // Images
  pendingFiles.filter(f => f.type === 'image').forEach(f => {
    parts.push({ type: 'image_url', image_url: { url: f.base64 } });
  });

  return parts;
}

// ── Toast ─────────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.className   = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 2500);
}

// ═══════════════════════════════════════════════════════
//   MESSAGE RENDERING
// ═══════════════════════════════════════════════════════

function addUserMessage(text, files) {
  const row = document.createElement('div');
  row.className = 'message-row user-row';

  let filesHTML = '';
  if (files && files.length > 0) {
    filesHTML = '<div class="msg-attachments">';
    files.forEach(f => {
      if (f.type === 'image') {
        filesHTML += `<img src="${f.preview}" class="msg-img" alt="${escapeHtml(f.name)}">`;
      } else {
        filesHTML += `
          <div class="msg-pdf-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            ${escapeHtml(f.name)}
          </div>`;
      }
    });
    filesHTML += '</div>';
  }

  const textHTML = text ? `<div class="bubble-user">${escapeHtml(text).replace(/\n/g, '<br>')}</div>` : '';
  row.innerHTML = filesHTML + textHTML;

  messagesArea.appendChild(row);
  scrollToBottom(true);
}

function addBotMessage() {
  const row = document.createElement('div');
  row.className = 'message-row bot-row';

  row.innerHTML = `
    <div class="bot-wrapper">
      <div class="bot-avatar thinking">
        <img src="jhon.jpg" class="jhon-photo" alt="J" onerror="this.style.display='none'">
        <span class="jhon-letter">J</span>
      </div>
      <div class="bubble-bot" id="streamTarget"></div>
      <button class="copy-btn" title="Copiar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>`;

  messagesArea.appendChild(row);
  scrollToBottom(true);

  return {
    bubbleEl: row.querySelector('.bubble-bot'),
    avatarEl: row.querySelector('.bot-avatar'),
  };
}

// ═══════════════════════════════════════════════════════
//   SEND MESSAGE
// ═══════════════════════════════════════════════════════

async function sendMessage() {
  const text = userInput.value.trim();
  if ((text === '' && pendingFiles.length === 0) || isStreaming) return;

  // Hide welcome
  if (welcome.parentNode === messagesArea) welcome.style.display = 'none';

  // Snapshot files before clearing
  const snapshotFiles = [...pendingFiles];

  // Update sidebar label on first message
  if (history.length === 0) {
    const label   = text || snapshotFiles[0]?.name || 'Arquivo';
    const preview = label.slice(0, 34) + (label.length > 34 ? '…' : '');
    currentConvItem.querySelector('.conv-label').textContent = preview;
  }

  const content = buildContent(text);

  addUserMessage(text, snapshotFiles);
  history.push({ role: 'user', content });

  // Clear input
  userInput.value        = '';
  userInput.style.height = 'auto';
  pendingFiles           = [];
  renderPendingFiles();
  sendBtn.disabled       = true;
  isStreaming            = true;

  const { bubbleEl, avatarEl } = addBotMessage();
  bubbleEl.innerHTML = '<span class="cursor-blink"></span>';

  let fullText   = '';
  let firstToken = false;

  try {
    const response = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: history }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;

        try {
          const parsed = JSON.parse(raw);
          const token  = parsed.choices?.[0]?.delta?.content;
          if (token) {
            if (!firstToken) {
              firstToken = true;
              avatarEl.classList.remove('thinking');
            }
            fullText            += token;
            bubbleEl.dataset.raw = fullText;
            bubbleEl.innerHTML   = marked.parse(fullText) + '<span class="cursor-blink"></span>';
            scrollToBottom();
          }
        } catch (_) { /* skip */ }
      }
    }

    bubbleEl.innerHTML   = marked.parse(fullText || '…');
    bubbleEl.dataset.raw = fullText;
    avatarEl.classList.remove('thinking');

    history.push({ role: 'assistant', content: fullText });
    persistCurrent();
    renderSidebar();

  } catch (err) {
    console.error('Error:', err);
    bubbleEl.innerHTML = `<p style="color:#ff6b6b">Erro ao conectar. Tente novamente.</p>`;
    avatarEl.classList.remove('thinking');
  }

  isStreaming       = false;
  sendBtn.disabled  = userInput.value.trim() === '' && pendingFiles.length === 0;
  userInput.focus();
  scrollToBottom(true);
}

// ── Focus on load ─────────────────────────────────────
userInput.focus();
