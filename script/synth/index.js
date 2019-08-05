"use strict";

import {detectOS} from "./lib/os.js";
import {detectBrowser} from "./lib/browser.js";
import {getAudioContext, setPannerPosition} from "./lib/utils.js";
import {WAVEFORMS_LIST, Oscillator} from "./lib/osc.js";
import {Envelope} from "./lib/envelope.js";
import {NotePlayer} from "./lib/notePlayer.js";
import {Oscilloscope} from "./lib/oscilloscope.js";

// **********************************************************************
// GLOBALS
// **********************************************************************
const MAX_OCTAVE = 2;
const TREM_RATE_MULTIPLIER = 12;
const OD_LEVEL_FACTOR = 100;
const ATT_OFFSET = 0.001;
const REL_OFFSET = 0.01;
const PORTAMENTO_FACTOR = 500; // reduces the max speed of portamento parameter

// **********************************************************************
// MAIN
// **********************************************************************
$(document).ready(function () {

  const NUM_OSC = $('.oscillator').length;
  const os = detectOS();
  const browser = detectBrowser();
  console.log("OS: " + os);
  console.log("Browser: " + browser);
  const context = getAudioContext(browser);
  const panner = context.createPanner();
  setPannerPosition(panner, context, 1, 0, 0);
  const oscillators = [];
  for (let i = 0; i < NUM_OSC; ++i) {
    oscillators.push(new Oscillator(context, panner));
  }
  const envelope = new Envelope();
  const player = new NotePlayer(oscillators, envelope);
  const oscilloscope = new Oscilloscope(context, "scope-container", context.destination);
  let keyOctSwitch = 0;

  // TUNA EFFECTS
  // ******************************
  const tuna = new Tuna(context);

  // Filter
  // ******************************
  const filter = new tuna.Filter({
    frequency: 1 + 20 * parseFloat($('#knob-filterFreq').attr('data-value')),       //20 to 2000
    Q: 1 + 49 * parseFloat($('#knob-filterQ').attr('data-value')) / 100,                  //0.001 to 100
    gain: 0,               //-40 to 40
    bypass: 1,             //0 to 1+
    filterType: parseInt($('#knob-filterType').attr('data-value')),         //0 to 7, corresponds to the filter types in the native filter node: lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass in that order
  });

  const filterGain = context.createGain();
  filterGain.gain.value = parseFloat($('#knob-filterGain').attr('data-value')) / 100;

  // TREMOLO
  // ******************************
  const tremolo = new tuna.Tremolo({
    intensity: parseFloat($('#knob-tremoloIntensity').attr('data-value')) / 100,    //0 to 1
    rate: TREM_RATE_MULTIPLIER * parseFloat($('#knob-tremoloRate').attr('data-value')) / 100,         //0.001 to 8
    stereoPhase: 0,    //0 to 180
    bypass: 1
  });


  // OVERDRIVE
  // ******************************
  const overdrive = new tuna.Overdrive({
    //outputGain: parseFloat( $('#knob-odLevel').attr('data-value') ),         //0 to 1+
    outputGain: 0.5,         //0 to 1+
    drive: 0.7,              //0 to 1
    curveAmount: parseFloat($('#knob-drive').attr('data-value')) / 100,          //0 to 1
    algorithmIndex: 0,       //0 to 5, selects one of our drive algorithms
    bypass: 1
  });

  const odLevel = context.createGain();
  odLevel.gain.value = parseFloat($('#knob-odLevel').attr('data-value')) / OD_LEVEL_FACTOR;

  // DELAY
  // ******************************
  const delay = context.createDelay();
  const feedback = context.createGain();
  const wetLevel = context.createGain();

  //set fixed parameters
  const maxDelayFeedback = 1;
  const maxDelayTime = 1; //seconds

  delay.delayTime.value = 0; //150 ms delay
  feedback.gain.value = 0;
  wetLevel.gain.value = 0;

  delay.connect(feedback);
  delay.connect(wetLevel);
  feedback.connect(delay);
  wetLevel.connect(context.destination);


  // **********************************************************************
  // SIGNAL ROUTING
  // **********************************************************************

  panner.connect(overdrive.input);
  overdrive.connect(filter.input);
  odLevel.connect(filter.input);
  filter.connect(tremolo.input);
  filterGain.connect(tremolo.input);
  tremolo.connect(oscilloscope.analyser);
  tremolo.connect(delay);

  envelope.portamento = parseFloat($('#knob-portamento').attr('data-value')) / PORTAMENTO_FACTOR;
  envelope.attack = ATT_OFFSET + parseFloat($('#knob-attack').attr('data-value')) / 100;
  envelope.release = REL_OFFSET + ($('#knob-release').attr('data-value')) / 100;

  // Delay defaults
  delay.delayTime.value = parseFloat($('#knob-delayTime').attr('data-value')) / 100;
  feedback.gain.value = parseFloat($('#knob-delayFeedback').attr('data-value')) / 100;
  wetLevel.gain.value = parseFloat($('#knob-delayVolume').attr('data-value')) / 100;

  let knobEditing = false;

  // **********************************************************************
  // KEYBOARD DRAW
  // **********************************************************************

  // letiables
  const keyboardWidth = $("#keyboardContainer").width(); //retrieve current window width
  const windowHeight = $(window).height(); //retrieve current window height
  const NUM_KEYS = 48;
  const isKeyDown = [];
  const numOctaves = (NUM_KEYS / 12);
  const numWhiteKeys = numOctaves * 7;
  const numBlackKeys = numOctaves * 5;
  const whiteKeyWidth = (keyboardWidth / numWhiteKeys);
  const blackKeyWidth = whiteKeyWidth * 0.6;
  $('#keyboard').css("height", 0.1 * keyboardWidth);

  // White Keys
  let j = 0
  let wk = 0
  let bk = 0
  let keyId = "k";
  let posX = 0;

  for (let i = 0; i < NUM_KEYS; i++) {
    j = i % 12;
    isKeyDown[i] = false;
    if (j == 1 || j == 3 || j == 6 || j == 8 || j == 10) {
      /* keyId = "bk" + bk; */
      keyId = "k" + i;
      posX = (wk) * whiteKeyWidth - blackKeyWidth / 2;
      $('#keyboard').append('<div id="' + keyId + '" data-keyNum="' + (i + 1) + '" class="key blackKey" ></div>');
      $("#" + keyId).css("left", posX);
      bk++;
    } else {
      /* keyId = "wk" + wk; */
      keyId = "k" + i;
      $('#keyboard').append('<div id="' + keyId + '" data-keyNum="' + (i + 1) + '" class="key whiteKey" ></div>');
      $("#" + keyId).css("left", wk * (whiteKeyWidth));
      wk++;
    }
  }
  $('.whiteKey').css("width", (whiteKeyWidth - 2) + "px");
  $('.blackKey').css("width", blackKeyWidth + "px");


  // **********************************************************************
  // DRAW SYNTH FRAME
  // **********************************************************************
  $('.frame_left').css('height', $('.center_section').height() + "px");
  $('.frame_right').css('height', $('.center_section').height() + "px");

  // ******************************************************
  // KEYBOARD EVENTS
  // ******************************************************

  //let keyValues = { 90:"c", 83:"c#", 88:"d", 68:"d#", 67:"e", 86:"f", 71:"f#" , 66:"g", 72:"g#", 78:"a", 74:"a#", 77:"b"};
  const noteNames = new Array("c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b");
  const keyValues = {
    90: 1, 83: 2, 88: 3, 68: 4, 67: 5, 86: 6, 71: 7, 66: 8, 72: 9, 78: 10, 74: 11, 77: 12,
    81: 13, 50: 14, 87: 15, 51: 16, 69: 17, 82: 18, 53: 19, 84: 20, 54: 21, 89: 22, 55: 23, 85: 24,
    73: 25, 57: 26, 79: 27, 48: 28
  };

  keyValues[70] = -1;
  keyValues[75] = -1;
  keyValues[52] = -1;
  keyValues[56] = -1;

  let keyPressed = -1;
  let note = -1;
  $(document).keydown(function (event) {
    keyPressed = event.which;
    note = (keyValues[keyPressed]);
    if (keyPressed == 40) { // Arrow Key down
      /*
      // Move the octave knob
      octave1 = parseInt( $('#knob-octave1').attr("data-value") );
      if( octave1>0 ) $('#knob-octave1').attr('data-value' , --octave1);
      steps = parseInt( $('#knob-octave1').attr("data-steps") );
      $('#knob-octave1  .marker_container').css('transform', "rotate("+parseFloat(280.0*(octave1/steps))+"deg)");
      */
      keyOctSwitch = (keyOctSwitch - 1) % MAX_OCTAVE;
    }
    if (keyPressed == 38) { // Arrow Key Up
      /*
      // Move the octave knob
      octave1 = parseInt( $('#knob-octave1').attr("data-value") );
      if( octave1<5 ) $('#knob-octave1').attr('data-value' , ++octave1);
      steps = parseInt( $('#knob-octave1').attr("data-steps") );
      $('#knob-octave1  .marker_container').css('transform', "rotate("+parseFloat(280.0*(octave1/steps))+"deg)");
      */
      keyOctSwitch = (keyOctSwitch + 1) % MAX_OCTAVE;
    }
    //vco.frequency.value = noteToFrequency(note); // set frequency
    //vco2.frequency.value = noteToFrequency(note); // set frequency
    else {
      if (note > 0 && !isKeyDown[keyValues[event.which]]) {
        // check note validity and avoid bounce
        context.resume().then(() => player.play(note, keyOctSwitch));
      }
      //alert(keyPressed);
      $('#k' + (keyValues[event.which] - 1)).addClass('active');
      isKeyDown[keyValues[event.which]] = true;
    }
  });

  $(document).keyup(function (event) {
    //vca.gain.value = 0;
    //vca2.gain.value = 0;
    $('#k' + (keyValues[event.which] - 1)).removeClass('active');
    keyPressed = event.which;
    note = (keyValues[keyPressed]);
    player.mute(note, keyOctSwitch);
    isKeyDown[keyValues[event.which]] = false;
  });

  // ******************************************************
  // MOUSE EVENTS
  // ******************************************************
  let isMouseDown = false;

  $(document).mouseup(function () {
    isMouseDown = false;
  });

  $(document).mousedown(function () {
    isMouseDown = true;
  });

  // MOUSE NOTE ON
  $('.key').mousedown(function () {
    note = parseInt($(this).attr("data-keyNum"));
    $(this).addClass("active");
    context.resume().then(() => player.play(note, keyOctSwitch));
  });

  $(".key").mouseover(function () {
    if (isMouseDown) {
      $(this).addClass("active");
      context.resume().then(() => player.play(parseInt($(this).attr("data-keyNum")), keyOctSwitch));
    }
  });

  // MOUSE NOTE OFF
  $(".key").mouseup(function () {
    $(this).removeClass("active");
    player.mute(parseInt($(this).attr("data-keyNum")), keyOctSwitch);
  });
  $(".key").mouseleave(function () {
    $(this).removeClass("active");
    player.mute(parseInt($(this).attr("data-keyNum")), keyOctSwitch);
  });


  // ******************************************************
  // KNOB EVENTS
  // ******************************************************

  $('.knob').click(function () {
    parseKnobParam($(this).attr('id'));
  });
  $('.knob').mousemove(function () {
    if (isMouseDown) parseKnobParam($(this).attr('id'));
  });


  const parseKnobParam = function (id) {
    let value = $('#' + id).attr('data-value');

    if (id.includes('knob-volume')) {
      const idx = parseInt(id.substr("knob-volume".length), 10);
      oscillators[idx-1].volume = parseFloat(value) / 100;
    } else if (id.includes('knob-waveform-')) {
      const idx = parseInt(id.substr("knob-waveform-".length), 10);
      oscillators[idx-1].vco.type = WAVEFORMS_LIST[parseInt(value)];
    }

    else if (id == 'knob-delayTime') {
      delay.delayTime.value = maxDelayTime * parseFloat(value) / 100;
    } else if (id == 'knob-delayFeedback') {
      feedback.gain.value = maxDelayFeedback * parseFloat(value) / 100;
    } else if (id == 'knob-delayVolume') {
      wetLevel.gain.value = parseFloat(value) / 100;
    } else if (id == 'knob-attack') {
      envelope.attack = ATT_OFFSET + parseFloat(value) / 100;
    } else if (id == 'knob-decay') {
      envelope.decay = parseFloat(value) / 100;
    } else if (id == 'knob-sustain') {
      envelope.sustain = parseFloat(value) / 100;
    } else if (id == 'knob-release') {
      envelope.release = REL_OFFSET + parseFloat(value) / 100;
    } else if (id == 'knob-portamento') {
      envelope.portamento = parseFloat(value) / PORTAMENTO_FACTOR;
    } else if (id == 'knob-tremoloRate') {
      tremolo.rate = TREM_RATE_MULTIPLIER * parseFloat(value) / 100;
    } else if (id == 'knob-tremoloIntensity') {
      tremolo.intensity = parseFloat(value) / 100;
    } else if (id == 'knob-filterFreq') {
      val = 20 + 20 * parseFloat(value);
      filter.frequency = val;
      console.log(val);
    } else if (id == 'knob-filterQ') {
      val = 1 + 49 * parseFloat(value) / 100;
      filter.Q = val;
      console.log(val);
    } else if (id == 'knob-filterType') {
      filter.filterType = parseFloat(value);
    } else if (id == 'knob-filterGain') {
      //filter.gain = -20 + 20 * parseFloat(value)/100;
      filterGain.gain.value = 1 + 2 * parseFloat(value - 50) / 100;
    } else if (id == 'knob-drive') {
      overdrive.curveAmount = parseFloat(value) / 100;
    } else if (id == 'knob-odLevel') {
      odLevel.gain.value = parseFloat(value) / OD_LEVEL_FACTOR;
      //overdrive.outputGain = parseFloat(value);
    }

  }

  // ******************************************************
  // SWITCH EVENTS
  // ******************************************************
  let id = null;
  let val = null;
  $('.switchContainer').mouseup(function () {
    id = $(this).attr('id');
    val = parseFloat($(this).attr('data-value'));
    if (id == 'sw-tremolo') {
      $(this).attr('data-value', val);
      if (val == 0) tremolo.bypass = 1;
      else tremolo.bypass = 0;
    } else if (id == 'sw-filter') {
      if (val == 0) {
        filter.bypass = 1;
        filter.disconnect();
        filter.connect(tremolo.input);
      } else {
        filter.disconnect();
        filter.connect(filterGain);
        filter.bypass = 0;
      }
    } else if (id == 'sw-overdrive') {
      $(this).attr('data-value', val);
      if (val == 0) {
        overdrive.disconnect();
        overdrive.connect(filter.input);
        overdrive.bypass = 1;
      } else {
        overdrive.disconnect();
        overdrive.connect(odLevel);
        overdrive.bypass = 0;
      }
    }

  });

});
