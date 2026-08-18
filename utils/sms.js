const fetch = require('node-fetch');

async function sendSMS(phone, text, apiKey) {
  if (!apiKey) return { success: false, error: 'Нет API-ключа' };
  const url = `https://sms.ru/sms/send?api_id=${apiKey}&to=${phone}&msg=${encodeURIComponent(text)}&json=1`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === 'OK' && data.sms[phone]?.status === 'OK') return { success: true };
    return { success: false, error: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { sendSMS };