export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { messages } = await req.json();

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

  if (!groqResponse.ok) {
    const err = await groqResponse.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(groqResponse.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
