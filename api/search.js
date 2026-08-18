export default async function handler(req, res) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters sent from frontend
    const { prompt, context, action } = req.body || {};
    const query = prompt || context;

    if (!query) {
      return res.status(400).json({ error: 'No prompt or query provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not configured on Vercel.' });
    }

    // Determine task: categorization prompt vs general search prompt
    let systemPrompt = query;
    if (action === 'categorize') {
      systemPrompt = `Categorize the following text related to "${context || ''}" into a single concise category name. Return valid JSON only in this format: {"category": "CategoryName"}. Text: ${prompt}`;
    }

    // Call Gemini API directly
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    // Return Gemini's exact response structure to match index.html expectations
    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
