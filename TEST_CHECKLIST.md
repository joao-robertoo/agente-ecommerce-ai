# ✅ CHECKLIST DE TESTES - AGENTE ECOMMERCE AI

## 📋 TESTES A REALIZAR

### 1️⃣ Teste de Conectividade API
- [ ] Abra `index.html` no navegador
- [ ] Abra DevTools (F12)
- [ ] Vá para a aba **Console**
- [ ] Escreva uma mensagem simples: "Oi"
- [ ] Clique em "Enviar" ou pressione Enter
- [ ] **Esperado no Console:**
  ```
  Response status: 200 OK
  Response headers: {...}
  Enviando para Groq: {...}
  Resposta Groq status: 200
  ```
- [ ] **Resultado esperado:** Resposta aparece na tela sem erro

### 2️⃣ Teste de Delete Button
- [ ] Envie uma mensagem
- [ ] Clique em "Nova conversa"
- [ ] A mensagem anterior aparece na sidebar como item de histórico
- [ ] **PASSE O MOUSE** sobre o item de histórico
- [ ] **Esperado:** Botão **×** aparece em vermelho no lado direito
- [ ] Clique no botão **×**
- [ ] **Esperado:** Item de histórico é deletado

### 3️⃣ Teste de Streaming
- [ ] Envie uma mensagem mais longa: "Me explique sobre inteligência artificial em 3 parágrafos"
- [ ] A resposta deve aparecer **em tempo real**, palavra por palavra
- [ ] Não deve aparecer tudo de uma vez
- [ ] Deve ter suporte a **markdown** (títulos, negrito, listas)

### 4️⃣ Teste de Histórico de Conversa
- [ ] Envie 3 mensagens em uma conversa
- [ ] Clique em "Nova conversa"
- [ ] As 3 mensagens anteriores desaparecem da tela
- [ ] Um novo item aparece na sidebar
- [ ] Clique em um item anterior
- [ ] **Esperado:** Conversa anterior recarrega com todas as mensagens

### 5️⃣ Verificação de Erros
- [ ] Desconecte a internet (ou simule no DevTools)
- [ ] Envie uma mensagem
- [ ] **Esperado:** Aparece mensagem de erro clara: "❌ Erro ao conectar: ..."
- [ ] **Não deve:** Travar a interface

### 6️⃣ Verificação de Variáveis de Ambiente
- [ ] No terminal/console do Vercel, verifique se `GROQ_API_KEY` está configurada
- [ ] **Sem isso, as requisições falharão**

---

## 🔴 SE ALGO NÃO FUNCIONAR

### Erro: "Erro ao conectar"
1. Abra DevTools (F12)
2. Vá para **Console**
3. Procure por mensagens em vermelho
4. Copie o erro completo
5. Verifique se `GROQ_API_KEY` está configurada

### Delete button não aparece
1. Abra DevTools
2. Vá para **Elementos** (Elements/Inspector)
3. Procure por `.conv-item:hover .conv-item-delete`
4. Verifique se o CSS está sendo aplicado

### Resposta não aparece
1. Verifique na aba **Network** se a requisição para `/api/chat` está retornando 200
2. Verifique se o tipo de resposta é `text/event-stream`

---

## ✅ DEPOIS QUE TUDO FUNCIONAR

Commit as mudanças no git:
```bash
git add .
git commit -m "Fix: Corrigir erro de conexão API e botão delete do histórico"
git push origin main
```

Deploy no Vercel (se ainda não fez):
```bash
vercel --prod
```

---

**IMPORTANTE:** Todas as 6 seções devem passar nos testes para considerar 100% RESOLVIDO ✅
