export class Envelope {
  constructor(attack = .01, decay = 0, sustain = 0, release = .01, portamento = 0) {
    this.attack = attack;
    this.decay = decay;
    this.sustain = sustain;
    this.release = release;
    this.portamento = portamento;
  }
}
