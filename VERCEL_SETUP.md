Vercel setup (proxy for Google Apps Script)

1. In this project we use a serverless proxy at /api/proxy to avoid CORS issues when the frontend fetches your Google Apps Script Web App.

2. In Vercel:
   - Go to Project → Settings → Environment Variables
   - Add a new variable:
       Name: SHEET_ENDPOINT_REMOTE
       Value: <paste your Google Apps Script Web App URL here>
       Environment: Production (and Preview if you want previews to work)

3. Deploy the project (Import GitHub repo). The frontend is already configured to call `/api/proxy` by default.

4. For local development:
   - Either replace CONFIG.SHEET_ENDPOINT in wix-embed.html with your Apps Script URL, or run the server with CORS enabled and set SHEET_ENDPOINT_REMOTE in your local environment before starting.

5. Notes:
   - The proxy simply forwards the Apps Script response and sets Access-Control-Allow-Origin: *
   - Keep your Apps Script Web App set to "Anyone" or use auth and a secure Vercel var accordingly.
