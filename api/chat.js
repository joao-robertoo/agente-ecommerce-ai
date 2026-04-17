export const config = { runtime: 'edge' };

const TEXT_MODEL   = 'llama-3.3-70b-versatile';
const VISION_MODEL = 'llama-3.2-11b-vision-preview';

const SYSTEM_PROMPT = `Você é Jhon, um assistente de IA avançado da NovaTech.
Você é extremamente inteligente, prestativo e direto ao ponto.
Pode ajudar com qualquer assunto: código, redação, análise, criatividade, estratégia, visão computacional.
Quando o usuário enviar uma imagem, analise-a detalhadamente e responda com base no que você vê.
Quando receber conteúdo de PDF, analise o documento e responda as perguntas do usuário sobre ele.
Quando usar código, sempre use blocos de código com a linguagem especificada.
Formate respostas longas com markdown (títulos, listas, negrito) para facilitar a leitura.
Responda sempre em português brasileiro, a menos que o usuário escreva em outro idioma.`;

function hasImages(messages) {
  return messages.some(m =>
    Array.isArray(m.content) &&
    m.content.some(c => c.type === 'image_url')
  );
}

function cleanForTextModel(messages) {
  return messages.map(m => {
    if (!Array.isArray(m.content)) return m;
    const texts  = m.content.filter(c => c.type === 'text').map(c => c.text);
    const hasImg = m.content.some(c => c.type === 'image_url');
    const joined = [hasImg ? '[Imagem enviada pelo usuário]' : '', ...texts].filter(Boolean).join('\n');
    return { ...m, content: joined };
  });
}

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405, headers: cors });

  if (!process.env.GROQ_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY não configurada.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...cors } }
    );
  }

  let messages;
  try {
    ({ messages } = await req.json());
    if (!Array.isArray(messages)) throw new Error('not array');
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body inválido. Esperado { messages: [] }' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...cors } }
    );
  }

  const useVision   = hasImages(messages);
  const model       = useVision ? VISION_MODEL : TEXT_MODEL;
  const finalMsgs   = useVision ? messages : cleanForTextModel(messages);

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...finalMsgs],
      max_tokens:  2000,
      temperature: 0.7,
      stream:      true,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return new Response(
      JSON.stringify({ error: `Groq ${groqRes.status}: ${err}` }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...cors } }
    );
  }

  return new Response(groqRes.body, {
    status: 200,
    headers: {
      'Content-Type':    'text/event-stream',
      'Cache-Control':   'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      ...cors,
    },
  });
}
