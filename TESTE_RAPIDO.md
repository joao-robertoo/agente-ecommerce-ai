# 🧪 TESTE RÁPIDO - 2 MINUTOS

## ⏱️ Teste Básico (2 minutos)

### Passo 1: Abrir DevTools
- Pressione **F12**
- Vá para **Console**

### Passo 2: Enviar Mensagem
- Escreva: `Oi`
- Clique em Enviar (ou Enter)

### Passo 3: Verificar Resultado
Você deve ver **exatamente** isso no console:
```
Response status: 200 OK
Response headers: {contentType: 'text/event-stream', ...}
Enviando para Groq: {model: 'llama-3.3-70b-versatile', stream: true, messages_count: 1}
Resposta Groq status: 200
```

E na tela: A resposta do bot aparece em **tempo real**, palavra por palavra.

**❌ Se ver erro "Erro ao conectar":**
- Verifique se GROQ_API_KEY está configurada em Vercel
- Copie o erro do console e compartilhe

---

## 🎯 Teste do Delete Button (30 segundos)

### Passo 1: Nova Conversa
- Clique em **"Nova conversa"** na sidebar

### Passo 2: Enviar Mensagem
- Escreva: `teste`
- Pressione Enter

### Passo 3: Criar Novo Item
- Clique em **"Nova conversa"** novamente
- Agora você tem um item de histórico

### Passo 4: Testar Delete
- **Passe o mouse** sobre o item de histórico
- Você deve ver um botão **×** em **vermelho** aparecer
- Clique no botão **×**
- O item desaparece

**❌ Se o botão não aparecer:**
- Abra DevTools → Elementos
- Procure por `.conv-item:hover`
- Verifique se tem `visibility: visible`

---

## ✅ Quando Tudo Funcionar

```
✅ Mensagens são enviadas e respondidas
✅ Resposta aparece em tempo real
✅ Delete button aparece ao fazer hover
✅ Markdown é renderizado (títulos, **negrito**, listas)
✅ Sem erros "Erro ao conectar"
```

**Pronto para usar! 🚀**
