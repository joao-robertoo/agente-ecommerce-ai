const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// MEMÓRIA — histórico completo da conversa
const conversationHistory = [];

function addMessage(text, sender) {
  const div = document.createElement('div');
  div.classList.add('message', sender);
  div.innerHTML = `<p>${text}</p>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  userInput.value = '';
  sendBtn.disabled = true;

  // Adiciona ao histórico (memória da conversa)
  conversationHistory.push({
    role: 'user',
    content: text
  });

  const typingDiv = addMessage('Sofia está digitando...', 'typing');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();
    typingDiv.remove();

    if (data.message) {
      addMessage(data.message, 'bot');

      // Resposta da IA entra no histórico também
      conversationHistory.push({
        role: 'assistant',
        content: data.message
      });
    }

  } catch (error) {
    typingDiv.remove();
    addMessage('Erro ao conectar. Tente novamente.', 'bot');
  }

  sendBtn.disabled = false;
  userInput.focus();
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});