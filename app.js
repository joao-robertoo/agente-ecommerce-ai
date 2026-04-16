/* =====================================================
   JHON — app.js
   Features: streaming, markdown, copy, auto-resize,
             conversation history, new chat
   ===================================================== */

// --- Configure marked ---
marked.setOptions({
  breaks: true,
  gfm: true,
});

// --- State ---
let conversationHistory = [];
let isStreaming = false;

// --- DOM refs ---
const messagesArea    = document.getElementById('messagesArea');
const welcome         = document.getElementById('welcome');
const userInput       = document.getElementById('userInput');
const sendBtn         = document.getElementById('sendBtn');
const newChatBtn      = document.getElementById('newChatBtn');
const sidebarToggle   = document.getElementById('sidebarToggle');
const sidebar         = document.getElementById('sidebar');
const convList        = document.getElementById('convList');
const currentConvItem = document.getElementById('currentConvItem');

// --- Auto-resize textarea ---
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
  sendBtn.disabled = userInput.value.trim() === '' || isStreaming;
});

// --- Send on Enter (Shift+Enter = newline) ---
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// --- Sidebar toggle (mobile) ---
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('is-open');
});

// Close sidebar on backdrop click (mobile)
document.addEventListener('click', (e) => {
  if (
    window.innerWidth <= 768 &&
    sidebar.classList.contains('is-open') &&
    !sidebar.contains(e.target) &&
    e.target !== sidebarToggle
  ) {
    sidebar.classList.remove('is-open');
  }
});

// --- New chat ---
newChatBtn.addEventListener('click', () => {
  if (isStreaming) return;

  // Archive old conversation in sidebar list if it had messages
  if (conversationHistory.length > 0) {
    const firstMsg = conversationHistory[0]?.content || 'Conversa';
    const preview  = firstMsg.slice(0, 36) + (firstMsg.length > 36 ? '…' : '');

    const item = document.createElement('div');
    item.className = 'conv-item';
    item.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span>${preview}</span>`;
    convList.insertBefore(item, currentConvItem.nextSibling);
  }

  // Reset
  conversationHistory = [];
  isStreaming = false;

  // Clear messages, restore welcome screen
  messagesArea.innerHTML = '';
  messagesArea.appendChild(welcome);
  welcome.style.display = '';

  currentConvItem.querySelector('span').textContent = 'Conversa atual';
  document.querySelectorAll('.conv-item').forEach(i => i.classList.remove('is-active'));
  currentConvItem.classList.add('is-active');

  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
  sidebar.classList.remove('is-open');
});

// --- Suggestion cards ---
document.querySelectorAll('.suggestion').forEach(btn => {
  btn.addEventListener('click', () => {
    userInput.value = btn.dataset.msg;
    userInput.dispatchEvent(new Event('input'));
    sendMessage();
  });
});

// --- Scroll helpers ---
function scrollToBottom(force = false) {
  const threshold = 120;
  const nearBottom = messagesArea.scrollHeight - messagesArea.scrollTop - messagesArea.clientHeight < threshold;
  if (nearBottom || force) {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
}

// --- Add user message bubble ---
function addUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row user-row';
  row.innerHTML = `<div class="bubble-user">${escapeHtml(text)}</div>`;
  messagesArea.appendChild(row);
  scrollToBottom(true);
  return row;
}

// --- Add bot message wrapper (returns the content element) ---
function addBotMessage() {
  const row = document.createElement('div');
  row.className = 'message-row bot-row';

  row.innerHTML = `
    <div class="bot-wrapper">
      <div class="bot-avatar">J</div>
      <div class="bubble-bot" id="streamTarget"></div>
      <button class="copy-btn" title="Copiar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </div>`;

  // Copy button logic
  const copyBtn    = row.querySelector('.copy-btn');
  const bubbleEl   = row.querySelector('.bubble-bot');
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

  return row.querySelector('#streamTarget');
}

// --- Main send function ---
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isStreaming) return;

  // Hide welcome
  if (welcome.parentNode === messagesArea) {
    welcome.style.display = 'none';
  }

  // Update sidebar label
  if (conversationHistory.length === 0) {
    const preview = text.slice(0, 34) + (text.length > 34 ? '…' : '');
    currentConvItem.querySelector('span').textContent = preview;
  }

  // Add user bubble
  addUserMessage(text);

  // Add to history
  conversationHistory.push({ role: 'user', content: text });

  // Clear input
  userInput.value = '';
  userInput.style.height = 'auto';
  sendBtn.disabled = true;
  isStreaming = true;

  // Bot message element
  const botEl = addBotMessage();
  botEl.innerHTML = '<span class="cursor-blink"></span>';

  let fullText = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete last line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;

        try {
          const parsed = JSON.parse(raw);
          const token  = parsed.choices?.[0]?.delta?.content;
          if (token) {
            fullText += token;
            botEl.dataset.raw = fullText;
            botEl.innerHTML   = marked.parse(fullText) + '<span class="cursor-blink"></span>';
            scrollToBottom();
          }
        } catch (_) { /* skip malformed */ }
      }
    }

    // Final render — remove cursor
    botEl.innerHTML   = marked.parse(fullText || '…');
    botEl.dataset.raw = fullText;

    // Save to history
    conversationHistory.push({ role: 'assistant', content: fullText });

  } catch (err) {
    console.error('Streaming error:', err);
    botEl.innerHTML = `<p style="color:#ff6b6b">Erro ao conectar. Tente novamente.</p>`;
  }

  isStreaming = false;
  sendBtn.disabled = userInput.value.trim() === '';
  userInput.focus();
  scrollToBottom(true);
}

// --- Escape HTML for user messages ---
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// --- Focus on load ---
userInput.focus();
