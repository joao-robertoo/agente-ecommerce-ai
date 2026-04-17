/* =====================================================
   JHON — app.js v3
   Features: splash screen, streaming, markdown,
             thinking avatar, copy, delete conversation,
             auto-resize textarea, new chat
   ===================================================== */

marked.setOptions({ breaks: true, gfm: true });

// ── State ────────────────────────────────────────────
let conversationHistory = [];
let isStreaming = false;

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

// ── Splash animation ──────────────────────────────────
// Show splash for 2.2s then fade out and reveal app
window.addEventListener('load', () => {
  setTimeout(() => {
    app.classList.add('visible');
    // Activate particle canvas
    const canvas = document.getElementById('particleCanvas');
    if (canvas) canvas.classList.add('visible');
    setTimeout(() => {
      splash.classList.add('hide');
    }, 300);
  }, 2200);
});

// ── Auto-resize textarea ─────────────────────────────
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
  sendBtn.disabled = userInput.value.trim() === '' || isStreaming;
});

// ── Send on Enter (Shift+Enter = newline) ─────────────
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// ── Sidebar toggle (mobile) ───────────────────────────
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('is-open');
});

document.addEventListener('click', (e) => {
  if (
    window.innerWidth <= 768 &&
    sidebar.classList.contains('is-open') &&
    !sidebar.contains(e.target) &&
    !sidebarToggle.contains(e.target)
  ) {
    sidebar.classList.remove('is-open');
  }
});

// ── Delete conversation ───────────────────────────────
function deleteConversation(btn) {
  btn.stopPropagation?.();
  const item = btn.closest('.conv-item');
  if (!item) return;

  // Animate out
  item.style.transition = 'all 0.25s ease';
  item.style.opacity = '0';
  item.style.transform = 'translateX(-12px)';
  item.style.maxHeight = item.offsetHeight + 'px';

  setTimeout(() => {
    item.style.maxHeight = '0';
    item.style.padding = '0';
    item.style.marginBottom = '0';
    setTimeout(() => item.remove(), 200);
  }, 200);

  // If deleting active conversation, reset
  if (item.classList.contains('is-active')) {
    conversationHistory = [];
    messagesArea.innerHTML = '';
    welcome.style.display = '';
    messagesArea.appendChild(welcome);
  }
}

// Make it global so inline onclick can reach it
window.deleteConversation = deleteConversation;

// ── New chat ──────────────────────────────────────────
newChatBtn.addEventListener('click', () => {
  if (isStreaming) return;

  // Archive old conversation
  if (conversationHistory.length > 0) {
    const firstMsg = conversationHistory[0]?.content || 'Conversa';
    const preview  = firstMsg.slice(0, 36) + (firstMsg.length > 36 ? '…' : '');

    const item = document.createElement('div');
    item.className = 'conv-item';
    item.innerHTML = `
      <svg class="conv-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="conv-label">${escapeHtml(preview)}</span>
      <button class="conv-delete" title="Deletar" onclick="deleteConversation(this)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>`;

    // Insert after current item
    currentConvItem.after(item);
  }

  // Reset state
  conversationHistory = [];
  isStreaming = false;

  // Clear messages, restore welcome
  messagesArea.innerHTML = '';
  welcome.style.display = '';
  messagesArea.appendChild(welcome);

  currentConvItem.querySelector('.conv-label').textContent = 'Conversa atual';
  document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('is-active'));
  currentConvItem.classList.add('is-active');

  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
  sidebar.classList.remove('is-open');
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
  const threshold = 120;
  const nearBottom =
    messagesArea.scrollHeight - messagesArea.scrollTop - messagesArea.clientHeight < threshold;
  if (nearBottom || force) {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
}

// ── Add user message ──────────────────────────────────
function addUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row user-row';
  row.innerHTML = `<div class="bubble-user">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
  messagesArea.appendChild(row);
  scrollToBottom(true);
}

// ── Add bot message ───────────────────────────────────
function addBotMessage() {
  const row = document.createElement('div');
  row.className = 'message-row bot-row';

  row.innerHTML = `
    <div class="bot-wrapper">
      <div class="bot-avatar thinking" id="thinkingAvatar"><img src="jhon.jpg" class="jhon-photo" alt="J" onerror="this.style.display='none'"><span class="jhon-letter">J</span></div>
      <div class="bubble-bot" id="streamTarget"></div>
      <button class="copy-btn" title="Copiar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>`;

  const copyBtn  = row.querySelector('.copy-btn');
  const bubbleEl = row.querySelector('.bubble-bot');

  copyBtn.addEventListener('click', () => {
    const raw = bubbleEl.dataset.raw || bubbleEl.innerText;
    navigator.clipboard.writeText(raw).then(() => {
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
      }, 2000);
    });
  });

  messagesArea.appendChild(row);
  scrollToBottom(true);

  return {
    bubbleEl,
    avatarEl: row.querySelector('#thinkingAvatar'),
    streamTargetEl: row.querySelector('#streamTarget'),
  };
}

// ── Main send function ────────────────────────────────
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isStreaming) return;

  // Hide welcome
  if (welcome.parentNode === messagesArea) {
    welcome.style.display = 'none';
  }

  // Update sidebar label on first message
  if (conversationHistory.length === 0) {
    const preview = text.slice(0, 34) + (text.length > 34 ? '…' : '');
    currentConvItem.querySelector('.conv-label').textContent = preview;
  }

  addUserMessage(text);
  conversationHistory.push({ role: 'user', content: text });

  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
  isStreaming = true;

  const { bubbleEl, avatarEl } = addBotMessage();

  // Show thinking state — cursor blink while no tokens yet
  bubbleEl.innerHTML = '<span class="cursor-blink"></span>';

  let fullText = '';
  let firstToken = false;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errBody}`);
    }

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
            // First token — stop thinking animation
            if (!firstToken) {
              firstToken = true;
              avatarEl.classList.remove('thinking');
            }

            fullText += token;
            bubbleEl.dataset.raw = fullText;
            bubbleEl.innerHTML   = marked.parse(fullText) + '<span class="cursor-blink"></span>';
            scrollToBottom();
          }
        } catch (_) { /* skip malformed */ }
      }
    }

    // Final render
    bubbleEl.innerHTML   = marked.parse(fullText || '…');
    bubbleEl.dataset.raw = fullText;
    avatarEl.classList.remove('thinking');

    conversationHistory.push({ role: 'assistant', content: fullText });

  } catch (err) {
    console.error('Error:', err);
    bubbleEl.innerHTML = `<p style="color:#ff6b6b">Erro ao conectar. Tente novamente.</p>`;
    avatarEl.classList.remove('thinking');
  }

  isStreaming = false;
  sendBtn.disabled = userInput.value.trim() === '';
  userInput.focus();
  scrollToBottom(true);
}

// ── Escape HTML ───────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Focus on load ─────────────────────────────────────
userInput.focus();
