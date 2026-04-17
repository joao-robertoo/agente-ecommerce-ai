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
const messagesArea         = document.getElementById('messagesArea');
const welcome              = document.getElementById('welcome');
const userInput            = document.getElementById('userInput');
const sendBtn              = document.getElementById('sendBtn');
const newChatBtn           = document.getElementById('newChatBtn');
const sidebarToggle        = document.getElementById('sidebarToggle');
const desktopSidebarToggle = document.getElementById('desktopSidebarToggle');
const sidebar              = document.getElementById('sidebar');
const convList             = document.getElementById('convList');
const currentConvItem      = document.getElementById('currentConvItem');

// --- Auto-resize textarea ---
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
  sendBtn.disabled = userInput.value.trim() === '' || isStreaming;
});

// --- Focus on input (scroll into view on mobile) ---
userInput.addEventListener('focus', () => {
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      userInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }
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
sidebarToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  sidebar.classList.toggle('is-open');
});

// --- Sidebar toggle (desktop) ---
desktopSidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// Close sidebar on backdrop click (mobile)
document.addEventListener('click', (e) => {
  if (
    window.innerWidth <= 768 &&
    sidebar.classList.contains('is-open') &&
    !sidebar.contains(e.target) &&
    e.target !== sidebarToggle &&
    !sidebarToggle.contains(e.target)
  ) {
    sidebar.classList.remove('is-open');
  }
});

// Close sidebar when clicking on a conversation item or button in sidebar (mobile)
convList.addEventListener('click', () => {
  if (window.innerWidth <= 768 && sidebar.classList.contains('is-open')) {
    sidebar.classList.remove('is-open');
  }
});

newChatBtn.addEventListener('click', function(e) {
  if (window.innerWidth <= 768 && sidebar.classList.contains('is-open')) {
    setTimeout(() => {
      sidebar.classList.remove('is-open');
    }, 100);
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
    item.setAttribute('data-test', 'conv-history-item');
    
    item.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span class="conv-item-text">${preview}</span>
      <button class="conv-item-delete" type="button" title="Deletar conversa">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
    
    // Debug log
    console.log('Criando item de conversa:', {
      preview,
      deleteButton: item.querySelector('.conv-item-delete'),
      allClasses: item.className,
    });
    
    // Add delete event listener
    const deleteBtn = item.querySelector('.conv-item-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Delete clicado');
        item.style.animation = 'fade-out 0.2s ease-out';
        setTimeout(() => item.remove(), 200);
      });
    } else {
      console.warn('Delete button not found!');
    }

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
  
  // Close mobile sidebar after new chat
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('is-open');
  }
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

    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', {
      contentType: response.headers.get('content-type'),
      cacheControl: response.headers.get('cache-control'),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

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
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
    });
    botEl.innerHTML = `<p style="color:#ff6b6b">❌ Erro ao conectar: ${err.message || 'Erro desconhecido'}</p>`;
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
