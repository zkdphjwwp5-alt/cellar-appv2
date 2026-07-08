export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY is missing.' });

    const { query } = req.body || {};
    if (!query || String(query).trim().length < 2) return res.status(400).json({ error: 'Search text is too short.' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a wine catalogue assistant. Return only JSON with a wines array. Each wine must include producer, wine_name, vintage, colour, country, region, subregion, appellation, bottle_size, drink_from, drink_to, notes, confidence. Use empty strings if unsure.' },
          { role: 'user', content: `Find up to 5 likely wine catalogue matches for: ${query}` }
        ],
        max_tokens: 700
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'OpenAI request failed.' });

    const result = JSON.parse(data.choices?.[0]?.message?.content || '{"wines":[]}');
    return res.status(200).json({ wines: Array.isArray(result.wines) ? result.wines.slice(0, 5) : [] });
  } catch (error) {
    return res.status(500).json({ error: String(error.message || error) });
  }
}
