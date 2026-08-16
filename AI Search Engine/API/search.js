export default async function handler(req, res) {
  // CORS setup so your GitHub Pages site can talk to this Vercel function
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle browser pre-flight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Safely read the API key from Vercel's environment variables
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel.' });
  }

  const { prompt, action, context } = req.body;

  try {
    let finalPrompt = prompt;

    // AI Auto-Categorization Prompt
    if (action === 'categorize') {
      finalPrompt = `
        You are a categorization assistant.
        Item to pin: "${prompt}"
        Search Context: "${context}"
        
        Assign this pin to a short 1-2 word category name based on topic.
        Respond ONLY with a raw JSON object matching this exact format:
        {"category": "Category Name"}
      `;
    }

    // Call Google's Gemini API securely from the backend
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }]
        })
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}