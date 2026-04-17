# 🔧 GUIA DE DEBUG - JHON

## Para Testar e Verificar os Problemas:

### 1️⃣ Abra o DevTools
- Pressione **F12** no navegador (ou Ctrl+Shift+I)
- Vá para a aba **Console**

### 2️⃣ Teste a Conversa
- Escreva "Oi" na caixa de chat
- Clique em Enviar (ou Enter)

### 3️⃣ Verifique os Logs (Console)
Você deve ver algo como:
```
Response status: 200 OK
Response headers: {contentType: 'text/event-stream', cacheControl: 'no-cache, no-transform'}
Enviando para Groq: {"model":"llama-3.3-70b-versatile","stream":true,"messages_count":1}
Resposta Groq status: 200
```

### 4️⃣ Teste o Botão Delete
- Mande outra mensagem (exemplo: "Teste")
- Clique em "Nova conversa"
- Passe o mouse sobre a conversa anterior na sidebar
- O botão **×** deve aparecer em vermelho
- Clique nele para deletar

## ✅ Esperado:
- Mensagem recebida e respondida normalmente ✨
- Botão delete aparece ao fazer hover
- Sem erros "Erro ao conectar" ❌

## 🔍 Se Ainda Não Funcionar:
1. Verifique no Console se há erros em vermelho
2. Verifique se a variável `GROQ_API_KEY` está configurada no `.env` ou Vercel
3. Copie o erro exato do console e compartilhe

## 📝 Arquivos Alterados:
- `/api/chat.js` - Melhorado com CORS e logging
- `/chat.js` - Sincronizado
- `app.js` - Debug logging adicionado
- `style.css` - CSS com !important e visibility:hidden
