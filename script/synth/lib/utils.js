export function noteToFrequency (note) {
  return Math.pow(2, (note - 58) / 12) * 440.0;
}
