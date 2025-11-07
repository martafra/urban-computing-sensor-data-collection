// Main UI wiring
import { initFirebase, signInAnon, startSession, savePoint, endSession } from './storage.js';
import { startSensors, stopSensors } from './sensors.js';

const elConfig = document.getElementById('firebaseConfig');
const elBtnInit = document.getElementById('btnInit');
const elInitStatus = document.getElementById('initStatus');

const elBtnStart = document.getElementById('btnStart');
const elBtnStop = document.getElementById('btnStop');
const elRunStatus = document.getElementById('runStatus');

const elFreq = document.getElementById('freqSec');
const elMode = document.getElementById('mode');
const elSessionId = document.getElementById('sessionId');

const elExportCSV = document.getElementById('btnExportCSV');
const elExportJSON = document.getElementById('btnExportJSON');
const elTableBody = document.querySelector('#dataTable tbody');

let localRows = [];
let running = false;
let currentSessionId = null;

function appendRow(pt){
  localRows.push(pt);
  const tr = document.createElement('tr');
  tr.innerHTML = \`
    <td>\${localRows.length}</td>
    <td>\${new Date(pt.ts).toISOString()}</td>
    <td>\${pt.lat?.toFixed(6) ?? ''}</td>
    <td>\${pt.lng?.toFixed(6) ?? ''}</td>
    <td>\${pt.acc ?? ''}</td>
    <td>\${pt.db?.toFixed(1) ?? ''}</td>
  \`;
  elTableBody.appendChild(tr);
}

function clearRows(){
  localRows = [];
  elTableBody.innerHTML = '';
}

elBtnInit.addEventListener('click', async () => {
  try {
    const cfg = JSON.parse(elConfig.value.trim());
    await initFirebase(cfg);
    await signInAnon();
    elInitStatus.textContent = 'Firebase pronto OK';
    elBtnStart.disabled = false;
  } catch (e) {
    console.error(e);
    elInitStatus.textContent = 'Config non valida: ' + (e?.message || e);
  }
});

elBtnStart.addEventListener('click', async () => {
  try {
    const meta = {
      mode: elMode.value,
      samplingSec: Number(elFreq.value || 3),
      userAgent: navigator.userAgent,
      locale: navigator.language
    };
    currentSessionId = await startSession(meta);
    elSessionId.textContent = currentSessionId;
    clearRows();
    running = true;
    elBtnStart.disabled = true;
    elBtnStop.disabled = false;
    elExportCSV.disabled = true;
    elExportJSON.disabled = true;
    elRunStatus.textContent = 'Acquisizione in corso...';
    // Avvia sensori
    await startSensors(meta.samplingSec, async (pt) => {
      appendRow(pt);
      await savePoint(pt);
    });
  } catch (e) {
    console.error(e);
    elRunStatus.textContent = 'Errore start: ' + (e?.message || e);
  }
});

elBtnStop.addEventListener('click', async () => {
  try {
    running = false;
    await stopSensors();
    await endSession();
    elBtnStart.disabled = false;
    elBtnStop.disabled = true;
    elRunStatus.textContent = 'Sessione terminata.';
    elExportCSV.disabled = localRows.length === 0;
    elExportJSON.disabled = localRows.length === 0;
  } catch (e) {
    console.error(e);
    elRunStatus.textContent = 'Errore stop: ' + (e?.message || e);
  }
});

function download(name, text, type='text/plain'){
  const blob = new Blob([text], {type});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
}

elExportCSV.addEventListener('click', () => {
  const header = 'ts,lat,lng,acc,db\n';
  const body = localRows.map(r => [r.ts, r.lat, r.lng, r.acc, r.db].join(',')).join('\n');
  download(\`noise_\${currentSessionId}.csv\`, header + body, 'text/csv');
});

elExportJSON.addEventListener('click', () => {
  download(\`noise_\${currentSessionId}.json\`, JSON.stringify(localRows, null, 2), 'application/json');
});
