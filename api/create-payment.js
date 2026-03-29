/**
 * Serverless для Vercel: создание платежа ЮKassa без PHP на основном хостинге.
 * В панели Vercel → Settings → Environment Variables:
 *   YOOKASSA_SHOP_ID=1235468
 *   YOOKASSA_SECRET_KEY=live_...
 */
const { randomUUID } = require('crypto');

/** На Vercel Node-функциях req.body часто пустой — читаем поток вручную */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body != null) {
      if (typeof req.body === 'string' && req.body.length) {
        try {
          return resolve(JSON.parse(req.body));
        } catch {
          return resolve({});
        }
      }
      if (Buffer.isBuffer(req.body) && req.body.length) {
        try {
          return resolve(JSON.parse(req.body.toString('utf8')));
        } catch {
          return resolve({});
        }
      }
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body) && Object.keys(req.body).length > 0) {
        return resolve(req.body);
      }
    }
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj));
}

function cors(res, req) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, X-Requested-With'
  );
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

module.exports = async function handler(req, res) {
  if (cors(res, req)) return;

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const shopId = process.env.YOOKASSA_SHOP_ID || '1235468';
  const secret = process.env.YOOKASSA_SECRET_KEY || '';
  if (!secret) {
    return sendJson(res, 500, { error: 'YOOKASSA_SECRET_KEY не задан в Vercel (Environment Variables → Production)' });
  }

  let input;
  try {
    input = await readJsonBody(req);
  } catch (err) {
    return sendJson(res, 400, { error: 'Не удалось прочитать тело запроса' });
  }
  if (!input || typeof input !== 'object') input = {};

  const amountRub = parseFloat(String(input.amount_rub ?? ''));
  let description = String(input.description || '').trim() || 'Заказ накидок';
  description = description.slice(0, 128);

  let returnUrl = String(input.return_url || '').trim();
  if (!/^https:\/\/(www\.)?irina-sketch\.ru(\/|$)/.test(returnUrl)) {
    returnUrl = 'https://irina-sketch.ru/';
  }

  const customerEmail = String(input.customer_email || '').trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail);
  if (!emailOk) {
    return sendJson(res, 400, { error: 'Укажите корректный email — на него уйдёт чек (54‑ФЗ).' });
  }

  if (!Number.isFinite(amountRub) || amountRub < 1 || amountRub > 500000) {
    return sendJson(res, 400, { error: 'Некорректная сумма — обновите страницу и выберите товар снова' });
  }

  const value = amountRub.toFixed(2);
  const vatCode = 1;

  const payload = {
    amount: { value, currency: 'RUB' },
    confirmation: { type: 'redirect', return_url: returnUrl },
    capture: true,
    description,
    receipt: {
      customer: { email: customerEmail },
      items: [
        {
          description,
          quantity: '1.00',
          amount: { value, currency: 'RUB' },
          vat_code: vatCode,
          payment_mode: 'full_payment',
          payment_subject: 'commodity',
        },
      ],
    },
  };

  const idem = randomUUID();
  const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');

  let yookassaRes;
  try {
    yookassaRes = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idem,
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return sendJson(res, 502, { error: 'Сеть недоступна, попробуйте позже' });
  }

  const text = await yookassaRes.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    return sendJson(res, 502, { error: 'Некорректный ответ банка' });
  }

  const http = yookassaRes.status;
  const confirmUrl = data.confirmation && data.confirmation.confirmation_url;
  const ok = (http === 200 || http === 201) && typeof confirmUrl === 'string' && confirmUrl;

  if (!ok) {
    let msg = 'Не удалось создать платёж';
    if (data.description) msg = data.description;
    else if (data.code) msg = data.code;
    if (data.parameter) msg += ` (${data.parameter})`;
    return sendJson(res, 502, { error: msg, http });
  }

  return sendJson(res, 200, { confirmation_url: confirmUrl });
}
