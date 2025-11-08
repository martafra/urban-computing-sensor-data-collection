// Dublin Bikes Data Collector per Firebase
// Raccoglie dati dalle stazioni Dublin Bikes e li salva su Firebase in tempo reale

const https = require('https');

// CONFIGURAZIONE FIREBASE
// Usa variabili d'ambiente per sicurezza
// Esegui con: FIREBASE_URL=https://your-project.firebaseio.com node bikes_collector.js
const FIREBASE_URL = process.env.FIREBASE_URL || '';
const FIREBASE_PATH = '/bikes_data';

// CONFIGURAZIONE API DUBLIN BIKES
const BIKES_API_URL = 'https://data.smartdublin.ie/cgi-bin/rtpi/realtimebikeinformation.cgi?operator=jcdecaux&action=list';

// Intervallo di raccolta (millisecondi) - 5 minuti
const COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minuti

// Funzione per fare richieste HTTP / HTTP request function
function httpGet(url) {
    return new Promise(function(resolve, reject) {
        https.get(url, function(res) {
            var data = '';
            
            res.on('data', function(chunk) {
                data += chunk;
            });
            
            res.on('end', function() {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', function(err) {
            reject(err);
        });
    });
}

// Salva dati su Firebase / Save data to Firebase
function saveToFirebase(data) {
    return new Promise(function(resolve, reject) {
        var timestamp = new Date().toISOString();
        var url = FIREBASE_URL + FIREBASE_PATH + '/' + timestamp.replace(/[:.]/g, '_') + '.json';
        
        var dataStr = JSON.stringify(data);
        var urlObj = new URL(url);
        
        var options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': dataStr.length
            }
        };
        
        var req = https.request(options, function(res) {
            var responseData = '';
            
            res.on('data', function(chunk) {
                responseData += chunk;
            });
            
            res.on('end', function() {
                if (res.statusCode === 200) {
                    resolve(responseData);
                } else {
                    reject(new Error('Firebase error: ' + res.statusCode));
                }
            });
        });
        
        req.on('error', function(err) {
            reject(err);
        });
        
        req.write(dataStr);
        req.end();
    });
}

// Processa dati bikes / Process bikes data
function processBikesData(rawData) {
    if (!rawData || !Array.isArray(rawData)) {
        console.error('Dati non validi ricevuti dall\'API');
        return null;
    }
    
    var processed = [];
    
    for (var i = 0; i < rawData.length; i++) {
        var station = rawData[i];
        
        processed.push({
            id: station.number,
            name: station.name,
            address: station.address,
            lat: station.position.lat,
            lng: station.position.lng,
            bikes: station.available_bikes,
            stands: station.available_bike_stands,
            total: station.bike_stands,
            status: station.status,
            lastUpdate: station.last_update
        });
    }
    
    return processed;
}

// Raccolta dati principale / Main data collection
function collectBikesData() {
    console.log('[' + new Date().toISOString() + '] Raccolta dati Dublin Bikes...');
    
    httpGet(BIKES_API_URL)
        .then(function(data) {
            console.log('Dati ricevuti: ' + data.length + ' stazioni');
            
            var processed = processBikesData(data);
            if (!processed) {
                console.error('Errore nel processamento dati');
                return;
            }
            
            return saveToFirebase(processed);
        })
        .then(function() {
            console.log('Dati salvati su Firebase con successo!');
        })
        .catch(function(err) {
            console.error('Errore:', err.message);
        });
}

// Verifica configurazione / Check configuration
function checkConfig() {
    if (!FIREBASE_URL) {
        console.error('\n===========================================');
        console.error('ERRORE: Firebase URL non configurato!');
        console.error('===========================================\n');
        console.log('Esegui con:');
        console.log('  FIREBASE_URL=https://your-project.firebaseio.com node bikes_collector.js\n');
        console.log('Oppure crea un file .env con:');
        console.log('  FIREBASE_URL=https://your-project.firebaseio.com\n');
        process.exit(1);
    }
}

// Avvia collector / Start collector
function start() {
    checkConfig();
    
    console.log('===========================================');
    console.log('   Dublin Bikes Collector per Firebase');
    console.log('===========================================');
    console.log('Database URL:', FIREBASE_URL);
    console.log('Intervallo:', COLLECTION_INTERVAL / 1000, 'secondi');
    console.log('===========================================\n');
    
    // Prima raccolta immediata
    collectBikesData();
    
    // Poi ogni X minuti
    setInterval(collectBikesData, COLLECTION_INTERVAL);
    
    console.log('Collector avviato! Premi Ctrl+C per fermare.\n');
}

// Avvia il programma
start();
