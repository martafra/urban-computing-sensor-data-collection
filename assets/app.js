
        // Import Firebase SDK / Importa Firebase SDK
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getDatabase, ref, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

        // Translations (EN default) / Traduzioni (EN predefinito)
        var txt = {
            it: {
                title: '<i class="bi bi-geo-alt-fill"></i> Raccolta Dati GPS e Suono <i class="bi bi-soundwave"></i>',
                labelMode: 'Modalità di raccolta:',
                labelFreq: 'Frequenza (secondi):',
                modeWalking: 'A piedi (3 sec)',
                modeCycling: 'In bicicletta (2 sec)',
                modeDriving: 'In auto (2 sec)',
                modeStationary: 'Punto fisso (30 sec)',
                modeLong: 'Lunga durata (60 sec)',
                modeCustom: 'Manuale',
                btnStart: '<i class="bi bi-play-fill"></i> Avvia Raccolta',
                btnStop: '<i class="bi bi-stop-fill"></i> Ferma Raccolta',
                btnFirebase: '<i class="bi bi-cloud-upload"></i> Connetti Firebase',
                btnExport: '<i class="bi bi-download"></i> Esporta CSV',
                btnClear: '<i class="bi bi-trash-fill"></i> Cancella Dati',
                labelStatus: 'Stato:',
                labelCount: 'Dati raccolti:',
                labelLastGPS: 'Ultima posizione:',
                labelLastSound: 'Ultimo livello suono:',
                thTime: 'Timestamp',
                thLat: 'Latitudine',
                thLng: 'Longitudine',
                thDB: 'Livello dB',
                nodata: 'Nessun dato raccolto',
                waiting: 'In attesa',
                recording: 'Registrazione in corso',
                stopped: 'Fermato',
                fbLocal: 'Modalità locale - dati solo su device',
                fbConnected: 'Firebase connesso - salvataggio cloud attivo',
                modalTitle: 'Connessione Firebase',
                modalDesc: 'Inserisci le credenziali Firebase per salvare i dati sul cloud in tempo reale.',
                errMic: 'Errore accesso microfono: ',
                errGPS: 'GPS non supportato',
                errCollect: 'Errore raccolta dati: ',
                errNoData: 'Nessun dato da esportare',
                errFirebase: 'Errore Firebase: ',
                confirmClear: 'Sei sicuro di voler cancellare tutti i dati raccolti?',
                csvFile: 'dati_gps_suono',
                csvTime: 'Data_Ora',
                csvLat: 'Latitudine',
                csvLng: 'Longitudine',
                csvDB: 'Livello_dB'
            },
            en: {
                title: '<i class="bi bi-geo-alt-fill"></i> GPS and Sound Data Collection <i class="bi bi-soundwave"></i>',
                labelMode: 'Collection mode:',
                labelFreq: 'Frequency (seconds):',
                modeWalking: 'Walking (3 sec)',
                modeCycling: 'Cycling (2 sec)',
                modeDriving: 'Driving (2 sec)',
                modeStationary: 'Fixed point (30 sec)',
                modeLong: 'Long duration (60 sec)',
                modeCustom: 'Manual',
                btnStart: '<i class="bi bi-play-fill"></i> Start Collection',
                btnStop: '<i class="bi bi-stop-fill"></i> Stop Collection',
                btnFirebase: '<i class="bi bi-cloud-upload"></i> Connect Firebase',
                btnExport: '<i class="bi bi-download"></i> Export CSV',
                btnClear: '<i class="bi bi-trash-fill"></i> Clear Data',
                labelStatus: 'Status:',
                labelCount: 'Data collected:',
                labelLastGPS: 'Last position:',
                labelLastSound: 'Last sound level:',
                thTime: 'Timestamp',
                thLat: 'Latitude',
                thLng: 'Longitude',
                thDB: 'Level dB',
                nodata: 'No data collected',
                waiting: 'Waiting',
                recording: 'Recording in progress',
                stopped: 'Stopped',
                fbLocal: 'Local mode - data stored on device only',
                fbConnected: 'Firebase connected - cloud storage active',
                modalTitle: 'Firebase Connection',
                modalDesc: 'Enter Firebase credentials to save data to cloud in real-time.',
                errMic: 'Microphone access error: ',
                errGPS: 'GPS not supported',
                errCollect: 'Data collection error: ',
                errNoData: 'No data to export',
                errFirebase: 'Firebase error: ',
                confirmClear: 'Are you sure you want to delete all collected data?',
                csvFile: 'gps_sound_data',
                csvTime: 'DateTime',
                csvLat: 'Latitude',
                csvLng: 'Longitude',
                csvDB: 'Sound_Level_dB'
            }
        };
        
        // Preset frequencies / Frequenze predefinite
        var freqs = { walking: 3, cycling: 2, driving: 2, stationary: 30, long: 60 };
        
        // State variables (sessionId is auto-generated) / Variabili di stato (sessionId generato automaticamente)
        var recording = false;
        var interval = null;
        var ctx = null;
        var analyzer = null;
        var mic = null;
        var freqData = null;
        var data = [];
        var lang = 'en'; // default language EN / lingua predefinita EN
        var db = null;
        var fbApp = null;
        var sessionId = null; // hidden session id / id di sessione nascosto
        
        // DOM references / Riferimenti DOM
        var elemMode = document.getElementById('mode');
        var elemFreq = document.getElementById('freq');
        var elemStart = document.getElementById('btnStart');
        var elemStop = document.getElementById('btnStop');
        var elemFirebase = document.getElementById('btnFirebase');
        var elemExport = document.getElementById('btnExport');
        var elemClear = document.getElementById('btnClear');
        var elemLang = document.getElementById('langSelect');
        var elemStatus = document.getElementById('status');
        var elemCount = document.getElementById('count');
        var elemGPS = document.getElementById('gps');
        var elemSound = document.getElementById('sound');
        var elemTbody = document.getElementById('tbody');
        var elemError = document.getElementById('error');
        var elemFbStatus = document.getElementById('firebaseStatus');
        var elemFbText = document.getElementById('firebaseText');
        var elemModal = document.getElementById('modalFirebase');
        var elemModalDbUrl = document.getElementById('modalDbUrl');
        var elemModalConnect = document.getElementById('btnModalConnect');
        var elemModalCancel = document.getElementById('btnModalCancel');
        
        // Mode change handler / Gestione cambio modalità
        elemMode.addEventListener('change', function() {
            var m = elemMode.value;
            if (m === 'custom') {
                elemFreq.disabled = false;
            } else {
                elemFreq.value = freqs[m];
                elemFreq.disabled = true;
            }
        });
        
        // Language change handler / Gestione cambio lingua
        elemLang.addEventListener('change', function() {
            updateLang(elemLang.value);
        });
        
        // Open Firebase modal / Apri modal Firebase
        elemFirebase.addEventListener('click', function() {
            elemModal.classList.add('show');
        });
        
        // Close modal / Chiudi modal
        elemModalCancel.addEventListener('click', function() {
            elemModal.classList.remove('show');
        });
        
        // Connect Firebase (session id auto) / Connetti Firebase (session id automatico)
        elemModalConnect.addEventListener('click', function() {
            var dbUrl = elemModalDbUrl.value.trim();
            
            if (!dbUrl) {
                showErr('Enter Database URL / Inserisci Database URL');
                return;
            }
            
            initFirebase(dbUrl);
            elemModal.classList.remove('show');
        });
        
        // Update UI texts / Aggiorna testi UI
        function updateLang(l) {
            lang = l;
            var t = txt[l];
            
            document.getElementById('title').innerHTML = t.title;
            document.getElementById('labelMode').textContent = t.labelMode;
            document.getElementById('labelFreq').textContent = t.labelFreq;
            
            var opts = elemMode.options;
            opts[0].text = t.modeWalking;
            opts[1].text = t.modeCycling;
            opts[2].text = t.modeDriving;
            opts[3].text = t.modeStationary;
            opts[4].text = t.modeLong;
            opts[5].text = t.modeCustom;
            
            elemStart.innerHTML = t.btnStart;
            elemStop.innerHTML = t.btnStop;
            elemFirebase.innerHTML = t.btnFirebase;
            elemExport.innerHTML = t.btnExport;
            elemClear.innerHTML = t.btnClear;
            
            document.getElementById('labelStatus').textContent = t.labelStatus;
            document.getElementById('labelCount').textContent = t.labelCount;
            document.getElementById('labelLastGPS').textContent = t.labelLastGPS;
            document.getElementById('labelLastSound').textContent = t.labelLastSound;
            
            document.getElementById('thTime').textContent = t.thTime;
            document.getElementById('thLat').textContent = t.thLat;
            document.getElementById('thLng').textContent = t.thLng;
            document.getElementById('thDB').textContent = t.thDB;
            
            document.getElementById('modalTitle').textContent = t.modalTitle;
            document.getElementById('modalDesc').textContent = t.modalDesc;
            
            if (!recording) {
                elemStatus.textContent = t.waiting;
            }
            
            updateFirebaseStatus();
            
            var nd = document.getElementById('nodata');
            if (nd) {
                nd.textContent = t.nodata;
            }
        }
        
        // Show error / Mostra errore
        function showErr(msg) {
            elemError.textContent = msg;
            elemError.style.display = 'block';
            setTimeout(function() {
                elemError.style.display = 'none';
            }, 5000);
        }
        
        // Initialize Firebase and auto-generate session id
        // Inizializza Firebase e genera automaticamente l'id sessione
        function initFirebase(dbUrl) {
            try {
                var firebaseConfig = {
                    databaseURL: dbUrl
                };
                
                fbApp = initializeApp(firebaseConfig);
                db = getDatabase(fbApp);
                
                // Auto-generate hidden session id (timestamp + random)
                // Genera automaticamente id di sessione nascosto (timestamp + casuale)
                sessionId = 'sess_' + new Date().toISOString().replace(/[:.]/g, '-') + '_' + Math.random().toString(36).slice(2, 8);
                
                updateFirebaseStatus(true);
            } catch (err) {
                showErr(txt[lang].errFirebase + err.message);
                updateFirebaseStatus(false);
            }
        }
        
        // Update Firebase status UI / Aggiorna stato Firebase UI
        function updateFirebaseStatus(connected) {
            if (connected === undefined) {
                connected = db !== null;
            }
            
            if (connected) {
                elemFbStatus.classList.remove('disconnected');
                elemFbText.textContent = txt[lang].fbConnected;
            } else {
                elemFbStatus.classList.add('disconnected');
                elemFbText.textContent = txt[lang].fbLocal;
            }
        }
        
        // Save to Firebase / Salva su Firebase
        function saveToFirebase(point) {
            if (!db || !sessionId) return;
            
            try {
                var dataRef = ref(db, 'noise_data/' + sessionId);
                push(dataRef, point);
            } catch (err) {
                console.error('Firebase save error:', err);
            }
        }
        
        // Setup microphone / Inizializza microfono
        function setupAudio() {
            return new Promise(function(resolve) {
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(function(stream) {
                        ctx = new (window.AudioContext || window.webkitAudioContext)();
                        analyzer = ctx.createAnalyser();
                        mic = ctx.createMediaStreamSource(stream);
                        analyzer.fftSize = 256;
                        freqData = new Uint8Array(analyzer.frequencyBinCount);
                        mic.connect(analyzer);
                        resolve(true);
                    })
                    .catch(function(err) {
                        showErr(txt[lang].errMic + err.message);
                        resolve(false);
                    });
            });
        }
        
        // Calculate dB level / Calcola livello dB
        function getDB() {
            if (!analyzer || !freqData) return 0;
            analyzer.getByteFrequencyData(freqData);
            var sum = 0;
            for (var i = 0; i < freqData.length; i++) {
                sum += freqData[i];
            }
            var avg = sum / freqData.length;
            var dbVal = 20 * Math.log10(avg / 255) + 100;
            return Math.max(0, Math.min(100, dbVal)).toFixed(1);
        }
        
        // Get GPS / Ottieni GPS
        function getGPS() {
            return new Promise(function(resolve, reject) {
                if (!navigator.geolocation) {
                    reject(new Error(txt[lang].errGPS));
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    function(pos) {
                        resolve({
                            lat: pos.coords.latitude.toFixed(6),
                            lng: pos.coords.longitude.toFixed(6)
                        });
                    },
                    function(err) {
                        reject(err);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            });
        }
        
        // Collect data / Raccolta dati
        function collect() {
            getGPS()
                .then(function(gps) {
                    var dbVal = getDB();
                    var ts = new Date().toISOString();
                    var point = { 
                        timestamp: ts, 
                        lat: parseFloat(gps.lat), 
                        lng: parseFloat(gps.lng), 
                        db: parseFloat(dbVal)
                    };
                    data.push(point);
                    updateUI(point);
                    saveToFirebase(point);
                })
                .catch(function(err) {
                    showErr(txt[lang].errCollect + err.message);
                });
        }
        
        // Update UI / Aggiorna UI
        function updateUI(point) {
            elemCount.textContent = data.length;
            elemGPS.textContent = point.lat + ', ' + point.lng;
            elemSound.textContent = point.db + ' dB';
            
            if (elemTbody.querySelector('td[colspan="4"]')) {
                elemTbody.innerHTML = '';
            }
            
            var row = document.createElement('tr');
            row.innerHTML = '<td>' + new Date(point.timestamp).toLocaleString() + '</td>' +
                           '<td>' + point.lat + '</td>' +
                           '<td>' + point.lng + '</td>' +
                           '<td>' + point.db + ' dB</td>';
            elemTbody.insertBefore(row, elemTbody.firstChild);
        }
        
        // Start collection / Avvia raccolta
        elemStart.addEventListener('click', function() {
            if (recording) return;
            
            setupAudio().then(function(ok) {
                if (!ok) return;
                
                recording = true;
                elemStart.disabled = true;
                elemStop.disabled = false;
                elemMode.disabled = true;
                elemFreq.disabled = true;
                elemFirebase.disabled = true;
                
                elemStatus.innerHTML = txt[lang].recording + ' <span class="recording-indicator"></span>';
                
                collect();
                var freq = parseInt(elemFreq.value) * 1000;
                interval = setInterval(collect, freq);
            });
        });
        
        // Stop collection / Ferma raccolta
        elemStop.addEventListener('click', function() {
            if (!recording) return;
            
            recording = false;
            elemStart.disabled = false;
            elemStop.disabled = true;
            elemMode.disabled = false;
            elemFirebase.disabled = false;
            
            if (elemMode.value === 'custom') {
                elemFreq.disabled = false;
            }
            
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
            
            if (mic) {
                mic.disconnect();
                mic = null;
            }
            
            if (ctx) {
                ctx.close();
                ctx = null;
            }
            
            elemStatus.textContent = txt[lang].stopped;
        });
        
        // Export CSV / Esporta CSV
        elemExport.addEventListener('click', function() {
            if (data.length === 0) {
                showErr(txt[lang].errNoData);
                return;
            }
            
            var t = txt[lang];
            var csv = t.csvTime + ',' + t.csvLat + ',' + t.csvLng + ',' + t.csvDB + '\n';
            
            for (var i = 0; i < data.length; i++) {
                var p = data[i];
                csv += p.timestamp + ',' + p.lat + ',' + p.lng + ',' + p.db + '\n';
            }
            
            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement('a');
            var url = URL.createObjectURL(blob);
            var ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            var filename = t.csvFile + '_' + ts + '.csv';
            
            link.href = url;
            link.download = filename;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
        
        // Clear data / Cancella dati
        elemClear.addEventListener('click', function() {
            if (confirm(txt[lang].confirmClear)) {
                data = [];
                elemTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;" id="nodata">' + txt[lang].nodata + '</td></tr>';
                elemCount.textContent = '0';
                elemGPS.textContent = '-';
                elemSound.textContent = '-';
            }
        });
        
        // Ensure UI language reflects default on load / Allinea UI alla lingua predefinita al caricamento
        updateLang('en');
    