# 🤖 Jhon — Agente Conversacional com Memória
### Powered by Groq · Llama 3.1 · Vercel Serverless

<br>

> *"Não é um chatbot. É um agente que lembra, entende contexto e responde como um profissional de atendimento real."*

<br>

🔗 **[Demo ao vivo → agente-ecommerce-ai.vercel.app](https://agente-ecommerce-ai.vercel.app/)**

---

## ⚡ O que é isso?

**Jhon** é um agente conversacional de atendimento ao cliente construído do zero com JavaScript puro, integração direta com a API da Groq e deploy serverless na Vercel.

Diferente de um chatbot simples que responde mensagens isoladas, o Jhon **mantém memória real da conversa** — cada mensagem que o usuário envia carrega todo o histórico anterior, permitindo que o agente entenda contexto, referências e continuidade, exatamente como um atendente humano faria.

---

## 🧠 Como a memória funciona?

A maioria dos chatbots esquece tudo a cada mensagem. O Jhon não.

```
Usuário: "Quero trocar meu pedido"
Jhon:    "Claro! Qual é o número do pedido?"
Usuário: "É o 4821"
Jhon:    "Perfeito, vou verificar o pedido 4821 para você."
          ↑ ele lembrou — sem o usuário repetir nada
```

Isso é possível porque o `conversationHistory` em `app.js` acumula cada turno da conversa e envia o array completo a cada requisição para a API:

```javascript
// Cada mensagem nova empilha no histórico
conversationHistory.push({ role: 'user', content: text });

// E o histórico inteiro vai pro modelo
body: JSON.stringify({ messages: conversationHistory })
```

O modelo recebe todo o contexto e responde com coerência narrativa — não com respostas genéricas e desconexas.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│   index.html + style.css + app.js               │
│   Interface do chat + gerenciamento de memória  │
└─────────────────┬───────────────────────────────┘
                  │  POST /api/chat
                  │  { messages: [...histórico] }
                  ▼
┌─────────────────────────────────────────────────┐
│            VERCEL SERVERLESS FUNCTION            │
│              api/chat.js                         │
│   Recebe histórico → injeta system prompt       │
│   → chama Groq API → retorna resposta           │
└─────────────────┬───────────────────────────────┘
                  │  Bearer GROQ_API_KEY
                  ▼
┌─────────────────────────────────────────────────┐
│               GROQ API                           │
│          Modelo: Llama 3.1 8B Instant           │
│     Inferência ultrarrápida — ~200ms p/ turno   │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Técnica

| Camada | Tecnologia | Por quê |
|---|---|---|
| Frontend | HTML · CSS · JavaScript vanilla | Zero dependências, deploy instantâneo |
| Backend | Vercel Serverless Functions | API key protegida, sem servidor próprio |
| LLM | Groq API + Llama 3.1 8B Instant | Inferência mais rápida do mercado (~200ms) |
| Deploy | Vercel | CI/CD automático via GitHub |
| Controle de versão | Git + GitHub | Histórico completo do projeto |

---

## 📁 Estrutura do Projeto

```
agente-ecommerce-ai/
│
├── api/
│   └── chat.js          # Serverless function — ponte entre frontend e Groq
│
├── index.html           # Interface do chat
├── style.css            # Design dark mode, responsivo
├── app.js               # Lógica do chat + gerenciamento de memória
└── vercel.json          # Configuração de rotas da Vercel
```

---

## 🚀 Como rodar localmente

### Pré-requisitos
- Node.js instalado
- Conta na [Groq Console](https://console.groq.com) com uma API Key

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/agente-ecommerce-ai.git
cd agente-ecommerce-ai

# 2. Instale a Vercel CLI
npm install -g vercel

# 3. Crie o arquivo de variáveis locais
echo "GROQ_API_KEY=sua_chave_aqui" > .env.local

# 4. Rode localmente
vercel dev
```

Acesse `http://localhost:3000` e o agente estará funcionando com a API real.

---

## ☁️ Deploy na Vercel

```bash
# Faça login na Vercel
vercel login

# Deploy de produção
vercel --prod
```

Ou conecte o repositório diretamente em [vercel.com](https://vercel.com) e configure a variável de ambiente:

```
GROQ_API_KEY = sua_chave_da_groq
```

---

## 🎯 Conceitos demonstrados neste projeto

- ✅ **Agente conversacional com memória persistente** por sessão
- ✅ **Integração com LLM** via API REST (Groq / Llama 3.1)
- ✅ **System prompt** para definição de persona e comportamento do agente
- ✅ **Serverless function** para proteger credenciais de API
- ✅ **Deploy em produção** com CI/CD automático
- ✅ **UI responsiva** dark mode sem frameworks

---

## 🔮 Próximos passos (roadmap)

- [ ] Memória persistente entre sessões (banco de dados)
- [ ] Painel administrativo para editar o system prompt em tempo real
- [ ] Integração com WhatsApp Business API via N8N
- [ ] Suporte multimodal — envio de imagens de produtos
- [ ] Avaliação automática de qualidade das respostas do agente

---

## 👨‍💻 Autor

**João Roberto** — Desenvolvedor Web & AI Specialist

Construo agentes de IA, automações com WhatsApp e sites premium para pequenas empresas.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-João_Roberto-0077B5?style=flat&logo=linkedin)](https://linkedin.com/in/joaorobertoo)
[![Instagram](https://img.shields.io/badge/Instagram-@jrdev.ia-E4405F?style=flat&logo=instagram)](https://instagram.com/jrdev.ia)
[![Portfolio](https://img.shields.io/badge/Portfolio-joaoroberto.vercel.app-000?style=flat&logo=vercel)](https://joaoroberto.vercel.app)

---

<p align="center">
  Construído com 🤖 Groq · ⚡ Vercel · ☕ e muita determinação
</p>
