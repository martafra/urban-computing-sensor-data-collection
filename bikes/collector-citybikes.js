// Dublin Bikes Data Collector per Firebase / Dublin Bikes Data Collector for Firebase
// Raccoglie dati dalle stazioni Dublin Bikes e li salva su Firebase in tempo reale
// Collects Dublin Bikes station data and saves to Firebase in real-time

const https = require('https');

// CONFIGURAZIONE FIREBASE / FIREBASE CONFIGURATION
// Usa variabili d'ambiente per sicurezza / Use environment variables for security
// Esegui con / Run with: FIREBASE_URL=https://your-project.firebaseio.com node bikes_collector.js
const FIREBASE_URL = process.env.FIREBASE_URL || '';
const FIREBASE_PATH = '/bikes_data';

// CONFIGURAZIONE API CITYBIKES (Dublin) / CITYBIKES API CONFIGURATION (Dublin)
const BIKES_API_URL = 'https://api.citybik.es/v2/networks/dublinbikes';

// Intervallo di raccolta (millisecondi) / Collection interval (milliseconds)
const COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minuti / 5 minutes

// Contatore per debug / Counter for debugging
let collectionCount = 0;

// Funzione per fare richieste HTTP / HTTP request function
function httpGet(url) {
    return new Promise(function(resolve, reject) {
        console.log('  → HTTP GET:', url);
        https.get(url, function(res) {
            let data = '';
            
            res.on('data', function(chunk) {
                data += chunk;
            });
            
            res.on('end', function() {
                console.log('  ✓ HTTP response:', res.statusCode);
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    console.error('  ✗ JSON parse error:', err.message);
                    reject(err);
                }
            });
        }).on('error', function(err) {
            console.error('  ✗ HTTP error:', err.message);
            reject(err);
        });
    });
}

// Salva dati su Firebase / Save data to Firebase
function saveToFirebase(data) {
    return new Promise(function(resolve, reject) {
        // Usa timestamp Unix più semplice / Use simpler Unix timestamp
        const timestamp = Date.now();
        const path = FIREBASE_PATH + '/' + timestamp + '.json';
        const fullUrl = FIREBASE_URL + path;
        
        console.log('  → Firebase PUT:', path);
        
        const dataStr = JSON.stringify(data);
        const urlObj = new URL(fullUrl);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataStr)
            }
        };
        
        const req = https.request(options, function(res) {
            let responseData = '';
            
            res.on('data', function(chunk) {
                responseData += chunk;
            });
            
            res.on('end', function() {
                console.log('  ✓ Firebase response:', res.statusCode);
                
                if (res.statusCode === 200) {
                    console.log('  ✓ Data saved successfully');
                    resolve(responseData);
                } else {
                    console.error('  ✗ Firebase error:', res.statusCode);
                    console.error('  ✗ Response body:', responseData);
                    reject(new Error('Firebase error ' + res.statusCode + ': ' + responseData));
                }
            });
        });
        
        req.on('error', function(err) {
            console.error('  ✗ Request error:', err.message);
            reject(err);
        });
        
        req.write(dataStr);
        req.end();
    });
}

// Processa dati bikes / Process bikes data
function processBikesData(rawData) {
    if (!rawData || !rawData.network || !Array.isArray(rawData.network.stations)) {
        console.error('  ✗ Invalid data structure');
        return null;
    }
    
    const stations = rawData.network.stations;
    const processed = [];
    
    for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        
        processed.push({
            id: station.id,
            name: station.name,
            address: (station.extra && station.extra.address) || '',
            lat: station.latitude,
            lng: station.longitude,
            bikes: station.free_bikes,
            stands: station.empty_slots,
            total: (station.free_bikes || 0) + (station.empty_slots || 0),
            status: (station.extra && station.extra.status) || '',
            lastUpdate: station.timestamp || null
        });
    }
    
    console.log('  ✓ Processed', processed.length, 'stations');
    return processed;
}

// Raccolta dati principale / Main data collection
function collectBikesData() {
    collectionCount++;
    console.log('\n============================================');
    console.log('[Collection #' + collectionCount + '] ' + new Date().toISOString());
    console.log('============================================');
    
    httpGet(BIKES_API_URL)
        .then(function(data) {
            console.log('  ✓ API response received');
            
            const processed = processBikesData(data);
            if (!processed) {
                console.error('  ✗ Failed to process data');
                return Promise.reject(new Error('Data processing failed'));
            }
            
            return saveToFirebase(processed);
        })
        .then(function() {
            console.log('  ✓ Collection completed successfully');
            console.log('============================================\n');
        })
        .catch(function(err) {
            console.error('  ✗ Collection failed:', err.message);
            console.error('============================================\n');
        });
}

// Verifica configurazione / Check configuration
function checkConfig() {
    if (!FIREBASE_URL) {
        console.error('\n===========================================');
        console.error('ERROR: Firebase URL not configured!');
        console.error('===========================================\n');
        console.log('Run with:');
        console.log('  FIREBASE_URL=https://your-project.firebaseio.com node bikes_collector.js\n');
        console.log('Or create a .env file with:');
        console.log('  FIREBASE_URL=https://your-project.firebaseio.com\n');
        process.exit(1);
    }
    
    // Verifica formato URL / Validate URL format
    try {
        new URL(FIREBASE_URL);
    } catch (err) {
        console.error('ERROR: Invalid Firebase URL:', FIREBASE_URL);
        process.exit(1);
    }
}

// Avvia collector / Start collector
function start() {
    checkConfig();
    
    console.log('===========================================');
    console.log('   Dublin Bikes Collector (CityBikes)');
    console.log('===========================================');
    console.log('Database URL:', FIREBASE_URL);
    console.log('API:', BIKES_API_URL);
    console.log('Interval:', COLLECTION_INTERVAL / 1000, 'seconds (' + (COLLECTION_INTERVAL / 60000) + ' minutes)');
    console.log('===========================================\n');
    
    // Prima raccolta immediata / First immediate collection
    collectBikesData();
    
    // Poi ogni X minuti / Then every X minutes
    setInterval(collectBikesData, COLLECTION_INTERVAL);
    
    console.log('✓ Collector started!');
    console.log('✓ Next collection in', COLLECTION_INTERVAL / 1000, 'seconds');
    console.log('✓ Press Ctrl+C to stop.\n');
}

// Gestione terminazione pulita / Clean shutdown handler
process.on('SIGINT', function() {
    console.log('\n\n===========================================');
    console.log('Collector stopped by user');
    console.log('Collections completed:', collectionCount);
    console.log('===========================================\n');
    process.exit(0);
});

// Avvia il programma / Start the program
if (require.main === module) {
    start();
}

// Export per testing / Export for testing
module.exports = { httpGet, processBikesData, saveToFirebase, collectBikesData };