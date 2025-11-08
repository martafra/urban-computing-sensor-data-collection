// ============================================================================
//  CityBikes Single-Shot Collector
//  Colleziona un singolo snapshot dei dati Dublin Bikes e lo salva su Firebase.
//  Collects a single snapshot of Dublin Bikes data and saves it to Firebase.
// ============================================================================

const https = require('https');
const { URL } = require('url');

// ---------------------------------------------------------------------------
// CONFIGURAZIONE FIREBASE / FIREBASE CONFIGURATION
// ---------------------------------------------------------------------------

const FIREBASE_URL = process.env.FIREBASE_URL || '';

if (!FIREBASE_URL) {
  console.error('FIREBASE_URL mancante / missing FIREBASE_URL');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// HTTP GET JSON
// Scarica JSON via HTTPS / Fetch JSON via HTTPS
// ---------------------------------------------------------------------------
function httpGetJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// HTTP PUT JSON verso Firebase
// JSON PUT to Firebase
// ---------------------------------------------------------------------------
function httpPutJSON(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = Buffer.from(JSON.stringify(body));
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
    };

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// MAIN
// Esegue una singola raccolta / Performs a single collection
// ---------------------------------------------------------------------------
(async () => {
  const now = new Date();
  const iso = now.toISOString();

  // 1. Scarica dati CityBikes / Fetch CityBikes data
  const bikes = await httpGetJSON('https://api.citybik.es/v2/networks/dublinbikes');

  // 2. Normalizza le stazioni / Normalize station records
  const network = bikes.network || {};
  const stations = (network.stations || []).map((s) => ({
    id: s.id,
    name: s.name,
    free_bikes: s.free_bikes,
    empty_slots: s.empty_slots,
    timestamp: s.timestamp || iso,
    latitude: s.latitude,
    longitude: s.longitude,
    extra: s.extra || {},
  }));

  const out = {
    source: 'citybikes',
    network: network.id || 'dublinbikes',
    collected_at: iso,
    stations,
  };

  // 3. Costruisci percorso Firebase / Build Firebase path
  const d = new Date();
  const path =
    `/bikes_data/` +
    `${d.getUTCFullYear()}/` +
    `${String(d.getUTCMonth() + 1).padStart(2, '0')}/` +
    `${String(d.getUTCDate()).padStart(2, '0')}/` +
    `${String(d.getUTCHours()).padStart(2, '0')}/` +
    `${String(d.getUTCMinutes()).padStart(2, '0')}.json`;

  // Firebase URL finale (senza token) / Final Firebase URL (no token)
  const url = `${FIREBASE_URL.replace(/\/$/, '')}${path}`;

  // 4. Salvataggio su Firebase / Save to Firebase
  const res = await httpPutJSON(url, out);

  if (res.status >= 200 && res.status < 300) {
    console.log(
      'Snapshot salvato / Snapshot saved:',
      path,
      'stazioni / stations:',
      stations.length
    );
  } else {
    console.error('Errore Firebase / Firebase error:', res.status, res.body);
    process.exit(2);
  }
})().catch((e) => {
  console.error('Errore / Error:', e);
  process.exit(1);
});
