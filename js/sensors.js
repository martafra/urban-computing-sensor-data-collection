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
        }

export { setupAudio, getDB, getGPS };
