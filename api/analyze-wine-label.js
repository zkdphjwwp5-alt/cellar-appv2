export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is missing.' });
    }

    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: 'Missing image.' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an expert wine label reader. Return ONLY valid JSON with fields: producer, wine_name, vintage, country, region, appellation, colour, confidence.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Read this wine label and extract the requested fields.' },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'OpenAI request failed.' });
    }

    const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return res.status(200).json({
      producer: result.producer || '',
      wine_name: result.wine_name || '',
      vintage: result.vintage || '',
      country: result.country || '',
      region: result.region || '',
      appellation: result.appellation || '',
      colour: result.colour || '',
      confidence: Number(result.confidence || 0)
    });
  } catch (error) {
    return res.status(500).json({ error: String(error.message || error) });
  }
}
