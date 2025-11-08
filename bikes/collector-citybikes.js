// Dublin Bikes Data Collector for Firebase (CityBikes API - no key)
// Raccoglie i dati delle stazioni Dublin Bikes e li salva su Firebase (CityBikes API - senza chiave)

const https = require('https');

// FIREBASE CONFIG (env var) / Configurazione Firebase (variabile d'ambiente)
const FIREBASE_URL = process.env.FIREBASE_URL || '';
const FIREBASE_PATH = '/bikes_data';

// CITYBIKES ENDPOINT (Dublin) / Endpoint CityBikes (Dublino)
const BIKES_API_URL = 'https://api.citybik.es/v2/networks/dublinbikes';

// Collection interval (ms) / Intervallo di raccolta (ms)
const COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes / 5 minuti

function httpGet(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(res) {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

// Save array snapshot to Firebase RTDB / Salva snapshot array su Firebase RTDB
function saveToFirebase(payload) {
  return new Promise(function(resolve, reject) {
    const ts = new Date().toISOString().replace(/[:.]/g, '_');
    const url = FIREBASE_URL + FIREBASE_PATH + '/' + ts + '.json';
    const body = JSON.stringify(payload);
    const u = new URL(url);
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } };
    const req = https.request(opts, function(res) {
      let out=''; res.on('data', c => out += c);
      res.on('end', () =>
        res.statusCode === 200
          ? resolve(out)
          : reject(new Error('Firebase error ' + res.statusCode + ': ' + out))
      );
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

// Map CityBikes → canonical fields / Converte CityBikes → campi canonici
function processBikesData(raw) {
  if (!raw || !raw.network || !Array.isArray(raw.network.stations)) return null;
  const s = raw.network.stations;
  const out = [];
  for (let i=0;i<s.length;i++) {
    const st = s[i];
    out.push({
      id: st.id,
      name: st.name,
      address: st.extra && st.extra.address || '',
      lat: st.latitude,
      lng: st.longitude,
      bikes: st.free_bikes,
      stands: st.empty_slots,
      total: (st.free_bikes || 0) + (st.empty_slots || 0),
      status: st.extra && st.extra.status || '',
      lastUpdate: st.timestamp || null
    });
  }
  return out;
}

// Main loop / Ciclo principale
function collectBikesData() {
  console.log('[' + new Date().toISOString() + '] Fetching Dublin Bikes (CityBikes)...');
  httpGet(BIKES_API_URL)
    .then(function(json) {
      const arr = processBikesData(json);
      if (!arr) { console.error('Parse error: unexpected payload'); return; }
      console.log('Stations received:', arr.length);
      return saveToFirebase(arr);
    })
    .then(function() { console.log('Saved to Firebase.'); })
    .catch(function(err) { console.error('Collector error:', err.message); });
}

// Config checks / Verifiche configurazione
function checkConfig() {
  if (!FIREBASE_URL) { console.error('Missing FIREBASE_URL'); process.exit(1); }
}

// Start / Avvio
function start() {
  checkConfig();
  console.log('===========================================');
  console.log(' Dublin Bikes Collector (CityBikes)');
  console.log(' Database URL:', FIREBASE_URL);
  console.log(' Interval:', COLLECTION_INTERVAL/1000, 'seconds');
  console.log('===========================================\n');
  collectBikesData();
  setInterval(collectBikesData, COLLECTION_INTERVAL);
}

if (require.main === module) start();
module.exports = { httpGet, processBikesData, saveToFirebase, collectBikesData };