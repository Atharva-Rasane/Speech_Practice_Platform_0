// voskWorker.js — runs inside a Web Worker
importScripts('https://cdn.jsdelivr.net/npm/vosk-browser@0.0.5/dist/vosk.js');

let model;

onmessage = async (e) => {
  const { cmd } = e.data;

  // 1) load the model once
  if (cmd === 'init') {
    model = await Vosk.createModel(e.data.modelUrl);
    postMessage({ cmd:'ready' });
    return;
  }

  // 2) transcribe each chunk
  if (cmd === 'transcribe') {
    const { pcm, sampleRate } = e.data;
    // pcm is an ArrayBuffer of Int16 samples

    // → Recreate Int16Array
    const int16 = new Int16Array(pcm);

    // → Convert to Float32Array in [–1..1]
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    // Build recognizer *with* sampleRate
    const rec = new model.KaldiRecognizer(sampleRate);
    rec.setWords(false);

    // Pass *only* the Float32Array
    rec.acceptWaveform(float32);

    const { text } = rec.finalResult();
    postMessage({ cmd:'transcript', text });
    rec.free();
  }
};
