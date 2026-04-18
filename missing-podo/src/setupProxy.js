const { URL } = require('url');

const JOTFORM_API_BASE = 'https://api.jotform.com';

function readApiKeys() {
  return (process.env.JOTFORM_API_KEYS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

module.exports = function setupProxy(app) {
  app.get('/api/jotform/form/:formId/submissions', async (req, res) => {
    const apiKeys = readApiKeys();

    if (apiKeys.length === 0) {
      res.status(500).json({
        message: 'JOTFORM_API_KEYS is not configured.',
      });
      return;
    }

    const { formId } = req.params;
    const limit = req.query.limit || '1000';
    const offset = req.query.offset || '0';

    for (const apiKey of apiKeys) {
      try {
        const url = new URL(`${JOTFORM_API_BASE}/form/${formId}/submissions`);
        url.searchParams.set('apiKey', apiKey);
        url.searchParams.set('limit', limit);
        url.searchParams.set('offset', offset);

        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
        });

        const payload = await response.text();

        if (!response.ok) {
          continue;
        }

        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(payload);
        return;
      } catch (error) {
        // Try the next key if this request fails.
      }
    }

    res.status(502).json({
      message: `Unable to fetch submissions for form ${formId} with the configured Jotform API keys.`,
    });
  });
};
