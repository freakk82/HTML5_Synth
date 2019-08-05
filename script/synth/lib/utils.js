import {BROWSER} from "./browser.js";

export function noteToFrequency(note) {
  return Math.pow(2, (note - 58) / 12) * 440.0;
}

export function getAudioContext(browser) {
  try {
    // Fix up for prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    if (browser === BROWSER.CHROME) {
      context.resume();
    }
    return context;
  } catch (e) {
    alert('Web Audio API is not supported in this browser');
    throw e;
  }
}

export function setPannerPosition(panner, ctx, x, y, z) {
  panner.orientationX.setValueAtTime(x, ctx.currentTime);
  panner.orientationY.setValueAtTime(y, ctx.currentTime);
  panner.orientationZ.setValueAtTime(z, ctx.currentTime);
}
