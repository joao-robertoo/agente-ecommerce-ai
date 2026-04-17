export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

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
      const errText = await groqResponse.text();
      console.error('Groq error:', groqResponse.status, errText);
      return new Response(
        JSON.stringify({ error: `Groq API error: ${groqResponse.status}` }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...CORS },
        }
      );
    }

    // Stream the response back with CORS headers
    return new Response(groqResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        ...CORS,
      },
    });

  } catch (err) {
    console.error('Handler error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', detail: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS },
      }
    );
  }
}
