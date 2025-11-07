// Microphone + Geolocation sampling
let ctx, analyser, micStream;
let running = false;
let timerId = null;

function computeDbFromTimeDomain(analyser){
  const buf = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(buf);
  // Convert to RMS in [0..1], then to dBFS
  let sum = 0;
  for (let i=0;i<buf.length;i++){
    const v = (buf[i]-128)/128; // -1..1
    sum += v*v;
  }
  const rms = Math.sqrt(sum / buf.length) || 1e-8;
  const db = 20 * Math.log10(rms); // dBFS (0 is max, negative otherwise)
  return db;
}

async function getPosition(){
  return new Promise((resolve) => {
    if(!('geolocation' in navigator)){
      resolve({lat: null, lng: null, acc: null});
      return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
      resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        acc: Math.round(pos.coords.accuracy || 0)
      });
    }, _err => {
      resolve({lat: null, lng: null, acc: null});
    }, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
  });
}

export async function startSensors(samplingSec, onData){
  if(running) return;
  running = true;

  // Audio setup
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const src = ctx.createMediaStreamSource(micStream);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  src.connect(analyser);

  async function tick(){
    if(!running) return;
    const ts = Date.now();
    const db = computeDbFromTimeDomain(analyser);
    const pos = await getPosition();
    const row = { ts, db, ...pos };
    await onData(row);
    timerId = setTimeout(tick, samplingSec * 1000);
  }
  tick();
}

export async function stopSensors(){
  running = false;
  if (timerId) clearTimeout(timerId);
  try {
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
    }
    if (ctx && ctx.state !== 'closed') {
      await ctx.close();
    }
  } catch {}
}
