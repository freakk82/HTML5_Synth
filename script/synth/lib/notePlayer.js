import {WAVEFORMS_LIST} from "./osc.js";
import {noteToFrequency} from "./utils.js";

export class NotePlayer {

  constructor(oscillators, envelope) {
    this.activeNotes = [];
    this.oscArray = oscillators;
    this.envelope = envelope;
  }

  play(keyNum, octaveShift) {
    this.activeNotes.push(keyNum);
    for (let idx = 1; idx <= this.oscArray.length; ++idx) {
      const osc = this.oscArray[idx - 1];
      osc.vco.type = WAVEFORMS_LIST[parseInt($(`#knob-waveform-${idx}`).attr('data-value'))];
      osc.octave = 1 + parseInt($(`#knob-octave${idx}`).attr('data-value'));
      osc.volume = parseFloat($(`#knob-volume${idx}`).attr('data-value')) / 100;
      osc.detune = (parseFloat($(`#knob-detune${idx}`).attr('data-value')) - 50) * .02;
      osc.vco.frequency.cancelScheduledValues(0);
      const noteFreq = noteToFrequency(keyNum + 12 * osc.octave + 12 * octaveShift)
      const targetFreq = noteFreq * (1 + (Math.pow(2, osc.detune * 7 / 12) - 1));
      osc.vco.frequency.setTargetAtTime(targetFreq, 0, this.envelope.portamento);
      osc.vca.gain.cancelScheduledValues(0);
      osc.vca.gain.setTargetAtTime(osc.volume, 0, this.envelope.attack);
    }
  }

  mute(keyNum, octaveShift) {
    const NUM_OSC = this.oscArray.length;
    const position = this.activeNotes.indexOf(keyNum);
    if (position != -1) {
      this.activeNotes.splice(position, 1);
    }
    if (this.activeNotes.length == 0) {  // shut off the envelope
      for (let idx = 1; idx <= NUM_OSC; ++idx) {
        const osc = this.oscArray[idx - 1];
        osc.vca.gain.cancelScheduledValues(0);
        osc.vca.gain.setTargetAtTime(0.0, 0, this.envelope.release);
      }
    } else {
      for (let idx = 1; idx <= NUM_OSC; ++idx) {
        const osc = this.oscArray[idx - 1];
        osc.vco.frequency.cancelScheduledValues(0);
        const targetFreq = noteToFrequency(this.activeNotes[this.activeNotes.length - 1] + 12 * osc.octave + 12 * octaveShift);
        osc.vco.frequency.setTargetAtTime(targetFreq, 0, this.envelope.portamento);
      }
    }
  }
}
