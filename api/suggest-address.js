/**
 * Подсказки адресов по России (DaData) для формы заказа.
 * Vercel → Environment Variables: DADATA_API_KEY, DADATA_SECRET_KEY (секрет для других методов DaData).
 */
const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

function cors(res, req) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

module.exports = async function handler(req, res) {
  if (cors(res, req)) return;

  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const apiKey =
    process.env.DADATA_API_KEY || 'da132461d3aaab9884d83c7eacc7bc7b2a25e84e';
  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'DADATA_API_KEY не задан',
    });
  }

  const q = String((req.query && req.query.q) || '').trim();
  if (q.length < 2) {
    return sendJson(res, 200, { suggestions: [] });
  }

  try {
    const dadataRes = await fetch(DADATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        query: q,
        count: 10,
        locations: [{ country_iso_code: 'RU' }],
      }),
    });

    const data = await dadataRes.json().catch(() => ({}));
    if (!dadataRes.ok) {
      return sendJson(res, 502, { error: 'Ошибка сервиса подсказок адресов' });
    }

    const suggestions = (Array.isArray(data.suggestions) ? data.suggestions : [])
      .map((item) => {
        const value = String(item.value || item.unrestricted_value || '').trim();
        if (!value) return null;
        const postal = item.data && item.data.postal_code ? String(item.data.postal_code) : '';
        return {
          value,
          postal_code: postal,
        };
      })
      .filter(Boolean);

    sendJson(res, 200, { suggestions });
  } catch {
    sendJson(res, 502, { error: 'Не удалось загрузить подсказки адресов' });
  }
};
