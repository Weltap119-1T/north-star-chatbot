'use strict';

const http = require('http');

const BASE = 'http://localhost:3000';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      BASE + path,
      {
        method,
        headers: body
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
          : {},
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null });
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function createSession() {
  const res = await request('POST', '/api/session');
  if (res.status !== 200 || !res.body.sessionId) {
    throw new Error(`Session creation failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.sessionId;
}

async function chat(sessionId, message) {
  const res = await request('POST', '/api/chat', { sessionId, message });
  if (res.status !== 200) {
    throw new Error(`Chat failed (${message}): ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function main() {
  const results = [];

  async function scenario(name, fn) {
    try {
      await fn();
      results.push({ name, pass: true });
      console.log(`PASS  ${name}`);
    } catch (err) {
      results.push({ name, pass: false, error: err.message });
      console.log(`FAIL  ${name}: ${err.message}`);
    }
  }

  const health = await request('GET', '/api/health');
  if (health.status !== 200 || health.body.status !== 'ok') {
    throw new Error('Health check failed');
  }
  console.log('PASS  Health check');

  await scenario('SHIPPING — How long does shipping take?', async () => {
    const sid = await createSession();
    const r = await chat(sid, 'How long does shipping take?');
    if (r.state !== 'RESOLVED') throw new Error(`state=${r.state}`);
    if (!/Standard.*3.5 business days/s.test(r.message)) throw new Error('missing standard');
    if (!/Expedited.*1.2 business days/s.test(r.message)) throw new Error('missing expedited');
    if (!r.options.includes('Track my order') || !r.options.includes('Back to menu')) {
      throw new Error(`options=${JSON.stringify(r.options)}`);
    }
  });

  await scenario('SHIPPING — What shipping options do you have?', async () => {
    const sid = await createSession();
    const r = await chat(sid, 'What shipping options do you have?');
    if (r.state !== 'RESOLVED' || !/Expedited/i.test(r.message)) throw new Error('bad response');
  });

  await scenario('SHIPPING — express delivery', async () => {
    const sid = await createSession();
    const r = await chat(sid, 'Do you offer express delivery?');
    if (r.state !== 'RESOLVED' || !/Standard/i.test(r.message)) throw new Error('bad response');
  });

  await scenario('SHIPPING — When will my package arrive?', async () => {
    const sid = await createSession();
    const r = await chat(sid, 'When will my package arrive?');
    if (r.state !== 'RESOLVED' || !/business days/i.test(r.message)) throw new Error('bad response');
  });

  await scenario('ORDER TRACKING — 111', async () => {
    const sid = await createSession();
    await chat(sid, 'Track my order');
    const r = await chat(sid, '111');
    if (!/shipped/i.test(r.message) || !/tomorrow/i.test(r.message)) throw new Error(r.message);
  });

  await scenario('ORDER TRACKING — 222', async () => {
    const sid = await createSession();
    await chat(sid, 'Where is my order?');
    const r = await chat(sid, '222');
    if (!/processing/i.test(r.message) || !/24 hours/i.test(r.message)) throw new Error(r.message);
  });

  await scenario('ORDER TRACKING — 333', async () => {
    const sid = await createSession();
    await chat(sid, 'Has my order arrived?');
    const r = await chat(sid, '333');
    if (!/delivered/i.test(r.message) || !/return or exchange/i.test(r.message)) throw new Error(r.message);
  });

  await scenario('ORDER TRACKING — unknown 999', async () => {
    const sid = await createSession();
    await chat(sid, 'Track my order');
    const r = await chat(sid, '999');
    if (!/couldn't find an order/i.test(r.message)) throw new Error(r.message);
  });

  await scenario('RETURNS — policy summary', async () => {
    const sid = await createSession();
    const r = await chat(sid, 'I want to return something');
    if (!/30 days/i.test(r.message) || !/unused/i.test(r.message) || !/original packaging/i.test(r.message)) {
      throw new Error(r.message);
    }
    if (!/northstargear\.com\/returns/.test(r.message)) throw new Error('missing returns link in summary');
  });

  await scenario('RETURNS — portal link on yes', async () => {
    const sid = await createSession();
    await chat(sid, 'I want to return something');
    const r = await chat(sid, 'Yes, I have an order to return');
    if (!/northstargear\.com\/returns/.test(r.message)) throw new Error(r.message);
  });

  await scenario('PRODUCT RECOMMENDATIONS — two-step flow', async () => {
    const sid = await createSession();
    const r1 = await chat(sid, 'I need some gear');
    const r2 = await chat(sid, 'trail hiking');
    const r3 = await chat(sid, 'Moderate / regular use');
    if (r1.state !== 'AWAITING_PRODUCT_USE') throw new Error(`r1 state ${r1.state}`);
    if (r2.state !== 'AWAITING_PRODUCT_CONDITIONS') throw new Error(`r2 state ${r2.state}`);
    if (r3.state !== 'RESOLVED' || !/hiking/i.test(r3.message)) throw new Error(r3.message);
  });

  await scenario('HUMAN HANDOFF — LIVE_AGENT', async () => {
    const sid = await createSession();
    const r1 = await chat(sid, 'I want to speak to a person');
    const r2 = await chat(sid, 'No, just connect me');
    if (r1.state !== 'HUMAN_HANDOFF') throw new Error(`r1 state ${r1.state}`);
    if (r2.state !== 'LIVE_AGENT') throw new Error(`r2 state ${r2.state}`);
  });

  await scenario('FALLBACK — unrecognized input', async () => {
    const sid = await createSession();
    const r = await chat(sid, 'asdfghjkl');
    if (!/didn't understand/i.test(r.message)) throw new Error(r.message);
    if (!r.options || r.options.length === 0) throw new Error('no options');
  });

  await scenario('GENERAL — menu shipping option', async () => {
    const sid = await createSession();
    const r = await chat(sid, '🚚 Shipping information');
    if (r.state !== 'RESOLVED' || !/Standard/i.test(r.message)) throw new Error(r.message);
  });

  await scenario('GENERAL — back to menu from resolved', async () => {
    const sid = await createSession();
    await chat(sid, 'How long does shipping take?');
    const r = await chat(sid, 'Back to menu');
    if (r.state !== 'IDLE' || !/North Star Support/i.test(r.message)) throw new Error(r.message);
    if (!r.options.includes('🚚 Shipping information')) throw new Error('menu missing shipping');
  });

  const failed = results.filter((r) => !r.pass);
  console.log(`\nHTTP E2E: ${results.length - failed.length}/${results.length} scenarios passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error('HTTP E2E runner error:', err);
  process.exit(1);
});
