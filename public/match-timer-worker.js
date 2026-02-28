// Web Worker for match timer
// Uses system timestamps for accuracy even when phone screen is off

let intervalId = null;
let startTimestamp = null;
let pausedElapsed = 0;

self.onmessage = function (e) {
  const { type, elapsed } = e.data;

  switch (type) {
    case "start":
      pausedElapsed = elapsed || 0;
      startTimestamp = Date.now();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        const now = Date.now();
        const totalElapsed = pausedElapsed + (now - startTimestamp);
        self.postMessage({ type: "tick", elapsed: totalElapsed });
      }, 100);
      break;

    case "pause":
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      if (startTimestamp) {
        pausedElapsed += Date.now() - startTimestamp;
        startTimestamp = null;
      }
      self.postMessage({ type: "paused", elapsed: pausedElapsed });
      break;

    case "reset":
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      startTimestamp = null;
      pausedElapsed = 0;
      self.postMessage({ type: "reset", elapsed: 0 });
      break;

    case "stop":
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      startTimestamp = null;
      pausedElapsed = 0;
      break;
  }
};
