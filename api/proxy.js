// Vercel Serverless function to proxy the Google Apps Script sheet endpoint
// Add the original Apps Script URL to your Vercel project env as SHEET_ENDPOINT_REMOTE

export default async function handler(req, res) {
  const target = process.env.SHEET_ENDPOINT_REMOTE;
  if (!target) {
    res.status(500).json({ error: 'SHEET_ENDPOINT_REMOTE not configured in environment variables.' });
    return;
  }
  try {
    const fetchRes = await fetch(target);
    const text = await fetchRes.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(fetchRes.status).send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).json({ error: 'Failed to fetch remote sheet endpoint' });
  }
}
