export const WAVEFORMS = Object.freeze({
  sine: "sine",
  square: "square",
  saw: "saw",
  triangle: "triangle",
});
export const WAVEFORMS_LIST = Object.freeze([WAVEFORMS.sine, WAVEFORMS.square, WAVEFORMS.saw, WAVEFORMS.triangle]);

export class Oscillator {

  constructor(context, outNode, waveform = WAVEFORMS.sine, volume = 1, octave = 2, detune = 50) {
    this.context = context;
    this.waveform = waveform;
    this.volume = volume;
    this.octave = octave;
    this.detune = detune;
    this.vco = context.createOscillator();
    this.vca = context.createGain();
    this.vca.gain.value = 0;
    this.vco.start(0);
    this.vco.connect(this.vca);
    this.vca.connect(outNode);
  }

  playNote() {

  }
}
