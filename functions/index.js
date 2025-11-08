// ============================================================================
//  Firebase Cloud Functions - CityBikes Collector
//  Schedulata automaticamente per raccogliere dati Dublin Bikes
//  Automatically scheduled to collect Dublin Bikes data
// ============================================================================

const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger} = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getDatabase} = require("firebase-admin/database");
const https = require("https");

// Inizializza Firebase Admin
initializeApp();

// ---------------------------------------------------------------------------
// HTTP GET JSON
// ---------------------------------------------------------------------------
function httpGetJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// CLOUD FUNCTION SCHEDULATA
// Eseguita ogni 5 minuti per raccogliere dati bikes
// Run every 5 minutes to collect bikes data
// ---------------------------------------------------------------------------
exports.collectCityBikes = onSchedule(
    {
      schedule: "*/5 * * * *", // Ogni 5 minuti / Every 5 minutes
      timeZone: "Europe/Dublin",
      memory: "256MiB",
      timeoutSeconds: 60,
      maxInstances: 1,
    },
    async (event) => {
      try {
        const now = new Date();
        const iso = now.toISOString();

        logger.info("Inizio raccolta CityBikes / Starting CityBikes collection", {timestamp: iso});

        // 1. Scarica dati CityBikes / Fetch CityBikes data
        const bikes = await httpGetJSON("https://api.citybik.es/v2/networks/dublinbikes");

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

        const snapshot = {
          source: "citybikes",
          network: network.id || "dublinbikes",
          collected_at: iso,
          stations_count: stations.length,
          stations,
        };

        // 3. Costruisci percorso Firebase / Build Firebase path
        const d = new Date();
        const path =
          `bikes_data/` +
          `${d.getUTCFullYear()}/` +
          `${String(d.getUTCMonth() + 1).padStart(2, "0")}/` +
          `${String(d.getUTCDate()).padStart(2, "0")}/` +
          `${String(d.getUTCHours()).padStart(2, "0")}/` +
          `${String(d.getUTCMinutes()).padStart(2, "0")}`;

        // 4. Salvataggio su Firebase Realtime Database
        const db = getDatabase();
        await db.ref(path).set(snapshot);

        logger.info("Snapshot salvato con successo / Snapshot saved successfully", {
          path,
          stations: stations.length,
          timestamp: iso,
        });

        return {success: true, stations: stations.length, path};
      } catch (error) {
        logger.error("Errore durante raccolta / Error during collection", {error: error.message});
        throw error;
      }
    }
);

// ---------------------------------------------------------------------------
// FUNCTION HTTP per test manuale (opzionale)
// HTTP function for manual testing (optional)
// ---------------------------------------------------------------------------
const {onRequest} = require("firebase-functions/v2/https");

exports.testCollectCityBikes = onRequest(
    {
      memory: "256MiB",
      timeoutSeconds: 60,
    },
    async (req, res) => {
      try {
        const now = new Date();
        const iso = now.toISOString();

        // Scarica e salva dati
        const bikes = await httpGetJSON("https://api.citybik.es/v2/networks/dublinbikes");
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

        const snapshot = {
          source: "citybikes",
          network: network.id || "dublinbikes",
          collected_at: iso,
          stations_count: stations.length,
          stations,
        };

        const d = new Date();
        const path =
          `bikes_data/` +
          `${d.getUTCFullYear()}/` +
          `${String(d.getUTCMonth() + 1).padStart(2, "0")}/` +
          `${String(d.getUTCDate()).padStart(2, "0")}/` +
          `${String(d.getUTCHours()).padStart(2, "0")}/` +
          `${String(d.getUTCMinutes()).padStart(2, "0")}`;

        const db = getDatabase();
        await db.ref(path).set(snapshot);

        res.json({
          success: true,
          message: "Test raccolta completato / Test collection completed",
          stations: stations.length,
          path,
          timestamp: iso,
        });
      } catch (error) {
        logger.error("Errore test / Test error", {error: error.message});
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
);