// **********************************************************************
// OS
// **********************************************************************
const OS = Object.freeze({
  UNKNOWN: "UNKNOWN",
  WIN: "WIN",
  MAC: "MAC",
  LINUX: "LINUX",
  UNIX: "UNIX",
  ANDROID: "ANDROID",
});

function detectOS() {
  const appVersion = navigator && navigator.appVersion;
  const userAgent = navigator && navigator.userAgent;

  if(appVersion) {
    if(navigator.appVersion.indexOf("Win") != -1) {
      return OS.WIN;
    } else if(navigator.appVersion.indexOf("Mac") != -1) {
      return OS.MAC;
    } else if(navigator.appVersion.indexOf("X11") != -1) {
      return OS.UNIX;
    } else if(navigator.appVersion.indexOf("Linux") != -1) {
      return OS.LINUX
    } else {
      return OS.UNKNOWN;
    }
  } else if (userAgent) {
    if(navigator.userAgent.toLowerCase().indexOf("android") > -1) {
      return OS.ANDROID;
    } else {
      return OS.UNKNOWN;
    }
  } else {
    return OS.UNKNOWN;
  }
}



// **********************************************************************
// BROWSER
// **********************************************************************
const BROWSER = Object.freeze({
  CHROME: "CHROME",
  FIREFOX: "FIREFOX",
  SAFARI: "SAFARI",
  OPERA: "OPERA",
  IE: "IE",
  UNKNOWN: "UNKNOWN",
});

function detectBrowser() {
  const isOpera = window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
  if(isOpera) {
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    return BROWSER.OPERA;
  } else if(typeof InstallTrigger !== 'undefined') {
    // Firefox 1.0+
    return BROWSER.FIREFOX;
  } else if( Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {;
    // At least Safari 3+: "[object HTMLElementConstructor]"
    return BROWSER.SAFARI
  } else if(!!window.chrome && !isOpera) {
    return BROWSER.CHROME;
  } else if(!!document.documentMode) {
    return BROWSER.IE;
  } else {
    return BROWSER.UNKNOWN;
  }
}

// **********************************************************************
// UTILS
// **********************************************************************

function noteToFrequency (note) {
  return Math.pow(2, (note - 58) / 12) * 440.0;
}

// **********************************************************************
// MAIN
// **********************************************************************
$(document).ready(function () {
  const os = detectOS(navigator);
  console.log("OS: " + os);
  const browser = detectBrowser();
  console.log("Browser: " + browser);

  // **********************************************************************
  // GLOBALS
  // **********************************************************************
  const MAX_OCTAVE = 2;
  const TREM_RATE_MULTIPLIER = 12;
  const PHASER_RATE_MULTIPLIER = 10;
  const OD_LEVEL_FACTOR = 100;
  const ATT_OFFSET = 0.001;
  const REL_OFFSET = 0.01;
  const PORTAMENTO_FACTOR = 500; // reduces the max spped of portamento parameter
  const OSC_TYPES = ['sine', 'square', 'triangle', 'sawtooth'];

  // **********************************************************************
  // SYNTH CORE
  // **********************************************************************
  let context;
  try {
    // Fix up for prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    if(browser === BROWSER.CHROME) {
      context.resume();
    }
  } catch (e) {
    alert('Web Audio API is not supported in this browser');
  }

  // OSCILLATOR 1
  // *********************************************
  /* VCO */
  const vco = context.createOscillator();
  vco.type = OSC_TYPES[parseInt($('#knob-osc1Type').attr('data-value'))];
  //vco.frequency.value = this.frequency;
  vco.start(0);

  /* VCA */
  const vca = context.createGain();
  vca.gain.value = 0;

  // OSCILLATOR 2
  // *********************************************
  /* VCO 2 */
  const vco2 = context.createOscillator();
  vco2.type = OSC_TYPES[parseInt($('#knob-osc2Type').attr('data-value'))];
  //vco2.frequency.value = this.frequency;
  vco2.start(0);

  /* VCA 2*/
  const vca2 = context.createGain();
  vca2.gain.value = 0;


  let volume1 = 1;
  let octave1 = 2;
  let detune1 = 50;


  let volume2 = 1;
  let octave2 = 2;
  let detune2 = 50;


  let attack = 0.01;      // attack speed
  let release = 0.01;   // release speed
  let portamento = 0;  // portamento/glide speed
  let decay = 0; // TO DO
  let sustain = 0; // TO DO
  let activeNotes = []; // the stack of actively-pressed keys

  let keyOctSwitch = 0;

  // TUNA
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
  delay = context.createDelay();
  feedback = context.createGain();
  wetLevel = context.createGain();

  //set fixed parameters
  maxDelayFeedback = 1;
  maxDelayTime = 1; //seconds

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

  const panner = context.createPanner();
  // default to straight ahead
  panner.setPosition(0.0, 1.0, 0.0);

  vco.connect(vca);
  vca.connect(panner);
  vco2.connect(vca2);
  vca2.connect(panner);

  panner.connect(overdrive.input);
  overdrive.connect(filter.input);
  odLevel.connect(filter.input);
  filter.connect(tremolo.input);
  filterGain.connect(tremolo.input);
  tremolo.connect(context.destination); // delay direct out
  tremolo.connect(delay);

  const playNote = function (keyNum) {
    activeNotes.push(keyNum);
    // play osc 1
    //vco.noteOn(0);
    vco.type = OSC_TYPES[parseInt($('#knob-osc1Type').attr('data-value'))];
    octave1 = 1 + parseInt($('#knob-octave1').attr('data-value'));
    volume1 = parseFloat($('#knob-volume1').attr('data-value')) / 100;
    detune1 = (parseFloat($('#knob-detune1').attr('data-value')) - 50) * .02;
    vco.frequency.cancelScheduledValues(0);
    vco.frequency.setTargetAtTime(noteToFrequency(keyNum + 12 * octave1 + 12 * keyOctSwitch) * (1 + (Math.pow(2, detune1 * 7 / 12) - 1)), 0, portamento);
    //vco.frequency.value = noteToFrequency( keyNum  + 12 * octave1 ) * ( 1 + detune1 *  ( Math.pow(2, 1 / 12) -1 ) );
    //console.log( "freq = " + vco.frequency.value );

    //vca.gain.value = volume1 ;
    vca.gain.cancelScheduledValues(0);
    vca.gain.setTargetAtTime(volume1, 0, attack);
    // play osc 1
    //vco2.noteOn(0);
    vco2.type = OSC_TYPES[parseInt($('#knob-osc2Type').attr('data-value'))];
    octave2 = 1 + parseInt($('#knob-octave2').attr('data-value'));
    volume2 = parseFloat($('#knob-volume2').attr('data-value')) / 100;
    detune2 = (parseFloat($('#knob-detune2').attr('data-value')) - 50) * .02;
    vco2.frequency.cancelScheduledValues(0);
    vco2.frequency.setTargetAtTime(noteToFrequency(keyNum + 12 * octave2 + 12 * keyOctSwitch) * (1 + (Math.pow(2, detune2 * 7 / 12) - 1)), 0, portamento);
    //vco2.frequency.value = noteToFrequency( keyNum  + 12 * octave1 ) * ( 1 + detune1 *  ( Math.pow(2, 1 / 12) -1 ) );
    //console.log( "freq = " + vco2.frequency.value );

    //vca.gain.value = volume1 ;
    vca2.gain.cancelScheduledValues(0);
    vca2.gain.setTargetAtTime(volume2, 0, attack);
  }

  const muteNote = function (keyNum) {
    const position = activeNotes.indexOf(keyNum);
    if (position != -1) {
      activeNotes.splice(position, 1);
    }
    if (activeNotes.length == 0) {  // shut off the envelope
      vca.gain.cancelScheduledValues(0);
      vca.gain.setTargetAtTime(0.0, 0, release);
      vca2.gain.cancelScheduledValues(0);
      vca2.gain.setTargetAtTime(0.0, 0, release);

    } else {
      vco.frequency.cancelScheduledValues(0);
      vco.frequency.setTargetAtTime(noteToFrequency(activeNotes[activeNotes.length - 1] + 12 * octave1 + 12 * keyOctSwitch), 0, portamento);
      vco2.frequency.cancelScheduledValues(0);
      vco2.frequency.setTargetAtTime(noteToFrequency(activeNotes[activeNotes.length - 1] + 12 * octave2 + 12 * keyOctSwitch), 0, portamento);
    }
  }
  /*
  console.log("sine: "+vco.SINE);
  console.log("square: "+vco.SQUARE);
  console.log("sawtooth: "+vco.SAWTOOTH);
  console.log("triangle: "+vco.TRIANGLE);
  */

  // **********************************************************************
  // LOAD DEFAULTS FROM HTML
  // **********************************************************************

  octave1 = 1 + parseInt($('#knob-octave1').attr('data-value'));
  volume1 = parseFloat($('#knob-volume1').attr('data-value')) / 100;
  detune1 = (parseInt($('#knob-detune1').attr('data-value')) - 50) * .02;
  octave2 = 1 + parseInt($('#knob-octave2').attr('data-value'));
  volume2 = parseFloat($('#knob-volume2').attr('data-value')) / 100;
  detune2 = (parseInt($('#knob-detune2').attr('data-value')) - 50) * .02;
  portamento = parseFloat($('#knob-portamento').attr('data-value')) / PORTAMENTO_FACTOR;
  attack = ATT_OFFSET + parseFloat($('#knob-attack').attr('data-value')) / 100;
  release = REL_OFFSET + ($('#knob-release').attr('data-value')) / 100;

  // Delay defaults
  delay.delayTime.value = parseFloat($('#knob-delayTime').attr('data-value')) / 100;
  feedback.gain.value = parseFloat($('#knob-delayFeedback').attr('data-value')) / 100;
  wetLevel.gain.value = parseFloat($('#knob-delayVolume').attr('data-value')) / 100;

  knobEditing = false;

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
      if (note > 0 && !isKeyDown[keyValues[event.which]]){
        // check note validity and avoid bounce
        context.resume().then(() => playNote(note));
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
    muteNote(note);
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
    //isMouseDown = true;
    note = parseInt($(this).attr("data-keyNum"));
    $(this).addClass("active");
    context.resume().then(() => playNote(note));
  });

  $(".key").mouseover(function () {
    if (isMouseDown) {
      $(this).addClass("active");
      context.resume().then(() => playNote(parseInt($(this).attr("data-keyNum"))));
    }
  });

  // MOUSE NOTE OFF
  $(".key").mouseup(function () {
    //isMouseDown = false ;
    /* $(this).removeClass("active");
    vca.gain.value = 0;
    vca2.gain.value = 0; */
    $(this).removeClass("active");
    muteNote(parseInt($(this).attr("data-keyNum")));
  });
  $(".key").mouseleave(function () {
    $(this).removeClass("active");
    /*vca.gain.value = 0;
    vca2.gain.value = 0;
    */
    muteNote(parseInt($(this).attr("data-keyNum")));
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
    value = $('#' + id).attr('data-value');

    if (id == 'knob-volume1') {
      volume1 = parseFloat(value) / 100;
    } else if (id == 'knob-volume2') {
      volume2 = parseFloat(value) / 100;
    } else if (id == 'knob-osc1Type') {
      vco.type = OSC_TYPES[parseInt(value)];
    } else if (id == 'knob-osc2Type') {
      vco2.type = OSC_TYPES[parseInt(value)];
    }
    /*
    // Comment out octave and detune cause we want to handle them live inside the playNote() function
   else if( id == 'knob-octave1' ){
        octave1 = 1+parseInt(value);
    }
    else if( id == 'knob-octave2' ){
        octave2 = 1+    parseInt(value );
    }
    else if( id == 'knob-detune1' ){
       detune1 = (parseFloat(value ) - 50 ) * .02;
    }
    else if( id == 'knob-detune2' ){
       detune2 = (parseFloat(value ) - 50 ) * .02;
    }
    */
    else if (id == 'knob-delayTime') {
      delay.delayTime.value = maxDelayTime * parseFloat(value) / 100;
    } else if (id == 'knob-delayFeedback') {
      feedback.gain.value = maxDelayFeedback * parseFloat(value) / 100;
    } else if (id == 'knob-delayVolume') {
      wetLevel.gain.value = parseFloat(value) / 100;
    } else if (id == 'knob-attack') {
      attack = ATT_OFFSET + parseFloat(value) / 100;
    } else if (id == 'knob-decay') {
      decay = parseFloat(value) / 100;
    } else if (id == 'knob-sustain') {
      sustain = parseFloat(value) / 100;
    } else if (id == 'knob-release') {
      release = REL_OFFSET + parseFloat(value) / 100;
    } else if (id == 'knob-portamento') {
      portamento = parseFloat(value) / PORTAMENTO_FACTOR;
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
