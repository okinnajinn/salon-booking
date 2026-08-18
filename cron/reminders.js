const { query } = require('../db');
const { sendSMS } = require('../utils/sms');

async function checkAndSend() {
  const now = new Date();
  
  const dayBefore = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayDate = dayBefore.toISOString().split('T')[0];
  
  const dayApps = await query(`
    SELECT a.id, c.phone, s.name as service_name, ts.date, ts.start_time,
           m.sms_enabled, m.smsru_api_key, ss1.value as sms_mode, ss2.value as platform_key
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    JOIN services s ON a.service_id = s.id
    JOIN time_slots ts ON a.slot_id = ts.id
    JOIN masters m ON m.id = (SELECT id FROM masters LIMIT 1)
    LEFT JOIN system_settings ss1 ON ss1.key = 'sms_mode'
    LEFT JOIN system_settings ss2 ON ss2.key = 'smsru_platform_api_key'
    WHERE ts.date = $1 AND a.status = 'waiting'
    AND NOT EXISTS (SELECT 1 FROM sms_log WHERE appointment_id = a.id AND type = 'day')
  `, [dayDate]);
  
  for (const app of dayApps.rows) {
    if (!app.sms_enabled) continue;
    const apiKey = app.sms_mode === 'individual' ? app.smsru_api_key : app.platform_key;
    if (!apiKey) {
      await query("INSERT INTO sms_log (id, appointment_id, type, status) VALUES ($1, $2, 'day', 'failed')", [require('crypto').randomUUID(), app.id]);
      continue;
    }
    const text = `Напоминание: завтра ${app.date} в ${app.start_time.slice(0,5)} — ${app.service_name}. Ждем вас!`;
    const result = await sendSMS(app.phone, text, apiKey);
    await query(`
      INSERT INTO sms_log (id, appointment_id, type, status, sent_at) VALUES ($1, $2, 'day', $3, $4)
    `, [require('crypto').randomUUID(), app.id, result.success ? 'sent' : 'failed', result.success ? new Date().toISOString() : null]);
  }
  
  const hourBefore = new Date(now.getTime() + 60 * 60 * 1000);
  const hourDate = hourBefore.toISOString().split('T')[0];
  const hourTime = hourBefore.toTimeString().slice(0,5);
  const hourTimeEnd = new Date(hourBefore.getTime() + 10*60000).toTimeString().slice(0,5);
  
  const hourApps = await query(`
    SELECT a.id, c.phone, s.name as service_name, ts.date, ts.start_time,
           m.sms_enabled, m.smsru_api_key, ss1.value as sms_mode, ss2.value as platform_key
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    JOIN services s ON a.service_id = s.id
    JOIN time_slots ts ON a.slot_id = ts.id
    JOIN masters m ON m.id = (SELECT id FROM masters LIMIT 1)
    LEFT JOIN system_settings ss1 ON ss1.key = 'sms_mode'
    LEFT JOIN system_settings ss2 ON ss2.key = 'smsru_platform_api_key'
    WHERE ts.date = $1 AND ts.start_time >= $2 AND ts.start_time <= $3
    AND a.status = 'waiting'
    AND NOT EXISTS (SELECT 1 FROM sms_log WHERE appointment_id = a.id AND type = 'hour')
  `, [hourDate, hourTime + ':00', hourTimeEnd + ':00']);
  
  for (const app of hourApps.rows) {
    if (!app.sms_enabled) continue;
    const apiKey = app.sms_mode === 'individual' ? app.smsru_api_key : app.platform_key;
    if (!apiKey) continue;
    const text = `Через час (${app.start_time.slice(0,5)}) — ${app.service_name}. До встречи!`;
    const result = await sendSMS(app.phone, text, apiKey);
    await query(`
      INSERT INTO sms_log (id, appointment_id, type, status, sent_at) VALUES ($1, $2, 'hour', $3, $4)
    `, [require('crypto').randomUUID(), app.id, result.success ? 'sent' : 'failed', result.success ? new Date().toISOString() : null]);
  }
}

if (require.main === module) {
  checkAndSend().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
}

module.exports = { checkAndSend };