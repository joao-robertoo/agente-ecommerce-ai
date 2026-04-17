export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages:', messages);
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    console.log('Enviando para Groq:', JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      stream: true,
      messages_count: messages.length,
    }));

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Você é Jhon, um assistente de IA avançado da NovaTech.
Você é extremamente inteligente, prestativo e direto ao ponto.
Pode ajudar com qualquer assunto: código, redação, análise, criatividade, estratégia.
Quando usar código, sempre use blocos de código com a linguagem especificada.
Formate respostas longas com markdown (títulos, listas, negrito) para facilitar a leitura.
Responda sempre em português brasileiro, a menos que o usuário escreva em outro idioma.`,
          },
          ...messages,
        ],
        max_tokens: 1500,
        temperature: 0.7,
        stream: true,
      }),
    });

    console.log('Resposta Groq status:', groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', groqResponse.status, errorText);
      return res.status(500).json({ 
        error: `Groq API Error: ${groqResponse.status} - ${errorText}`,
        details: errorText 
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    // Pipe the response directly
    groqResponse.body.pipe(res);

  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ 
      error: `Internal Server Error: ${err.message}`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
