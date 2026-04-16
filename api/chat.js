export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { messages } = req.body;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `Você é o Jhon, assistente virtual da loja NovaTech.
Você ajuda clientes com dúvidas sobre pedidos, produtos, trocas e devoluções.
Seja simpática, objetiva e profissional.
Se não souber algo, diga que vai verificar com a equipe.
Responda sempre em português brasileiro.`
        },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    return res.status(500).json({ error: 'Erro na API Groq' });
  }

  res.status(200).json({
    message: data.choices[0].message.content
  });
}