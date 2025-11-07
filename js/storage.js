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

export { initFirebase, updateFirebaseStatus, saveToFirebase };
