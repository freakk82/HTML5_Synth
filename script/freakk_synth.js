

$(document).ready(function () {
    // OS Detection
    var isWindows = (navigator.appVersion.indexOf("Win")!=-1);
    var isMac = (navigator.appVersion.indexOf("Mac")!=-1);
    var isUnix = (navigator.appVersion.indexOf("X11")!=-1);
    var isLinux = (navigator.appVersion.indexOf("Linux")!=-1);
    var isAndroid = navigator.userAgent.toLowerCase().indexOf("android") > -1; //&& ua.indexOf("mobile");
    
    var OSName="Unknown OS";
    if (isWindows) OSName="Windows";
    if (isMac) OSName="MacOS";
    if (isUnix) OSName="UNIX";
    if (isLinux) OSName="Linux";
    if (isAndroid) OSName="Android";
    
    console.log("OS: " + OSName);
    
    // Browser DeteCtion
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0; // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0; // At least Safari 3+: "[object HTMLElementConstructor]"
    var isChrome = !!window.chrome && !isOpera;              // Chrome 1+
    var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

    var BrowserName="Unknown Browser";
    if (isChrome) BrowserName="Chrome";
    if (isFirefox) BrowserName="Firefox";
    if (isSafari) BrowserName="Safari";
    //if (isAndroidBrowser) BrowserName="AndroidBrowser";
    if (isIE) BrowserName="IE";
    if (isOpera) BrowserName="Opera";
    
    console.log("Browser: " + BrowserName);
    
    
    
    // **********************************************************************
    // SYNTH CORE
    // **********************************************************************
    var context;
    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        context = new AudioContext();
      }
      catch(e) {
        alert('Web Audio API is not supported in this browser');
      }

    // OSCILLATOR 1
    // *********************************************  
    /* VCO */
    var vco = context.createOscillator();
    vco.type = parseInt($('#knob-osc1Type').attr('data-value'));
    vco.frequency.value = this.frequency;
    vco.start(0);
    
    /* VCA */
    var vca = context.createGain();
    vca.gain.value = 0;
    
    /* Connections */
    vco.connect(vca);
    vca.connect(context.destination);
    
    // OSCILLATOR 2
    // *********************************************  
    /* VCO 2 */
    var vco2 = context.createOscillator();
    vco2.type = parseInt($('#knob-osc2Type').attr('data-value'));
    vco2.frequency.value = this.frequency;
    vco2.start(0);
   
    /* VCA 2*/
    var vca2 = context.createGain();
    vca2.gain.value = 0;
    
    /* Connections */
    vco2.connect(vca2);
    vca2.connect(context.destination);
    
    var volume1 = 1;
    var octave1 = 2;
    var detune1 = 50;
    
    var volume2 = 1;
    var octave2 = 2;
    var detune2 = 50;
   
    var noteToFrequency = function(note) { return  Math.pow(2, (note-58) / 12) * 440.0; }
    
    var playNote = function(keyNum){
        // play osc 1
        vco.noteOn(0);
        vco.type = parseInt($('#knob-osc1Type').attr('data-value'));
        octave1 = parseFloat( $('#knob-octave1').attr('data-value') );
        volume1 = parseFloat( $('#knob-volume1').attr('data-value') )/100;
        detune1 = (parseInt( $('#knob-detune1').attr('data-value') ) - 50 ) * .02;
        vco.frequency.value = noteToFrequency( keyNum  + 12 * octave1 ) * ( 1 + detune1 *  ( Math.pow(2, 1 / 12) -1 ) ); 
        console.log( "freq = " + vco.frequency.value );
       
        vca.gain.value = volume1 ;
        
        // play osc 2
        vco2.noteOn(0);
        vco2.type = parseInt($('#knob-osc2Type').attr('data-value'));
        octave2= parseFloat( $('#knob-octave2').attr('data-value') );
        volume2 = parseFloat( $('#knob-volume2').attr('data-value') )/100;
        detune2 = (parseInt( $('#knob-detune2').attr('data-value') ) - 50 ) * .02;
        vco2.frequency.value = noteToFrequency( keyNum  + 12 * octave2 ) * ( 1 + detune2 *  ( Math.pow(2, 1 / 12) -1 ) ); 
        console.log( "freq = " + vco2.frequency.value );
        vca2.gain.value = volume2 ;
    }
    
    /*
    console.log("sine: "+vco.SINE);
    console.log("square: "+vco.SQUARE);
    console.log("sawtooth: "+vco.SAWTOOTH);
    console.log("triangle: "+vco.TRIANGLE);
    */
    
    octave1 = parseInt($('#knob-octave1').attr('data-value'));
    volume1 = parseFloat($('#knob-volume1').attr('data-value'))/100;
    detune1 = (parseInt( $('#knob-detune1').attr('data-value') ) - 50 ) * .02;
    octave2 = parseInt($('#knob-octave2').attr('data-value'));
    volume2 = parseFloat($('#knob-volume2').attr('data-value'))/100;
    detune2 = (parseInt( $('#knob-detune2').attr('data-value') ) - 50 ) * .02;
    knobEditing = false;
    
    // **********************************************************************
    // KEYBOARD DRAW
    // **********************************************************************
    
    // Variables
    var keyboardWidth = $("#keyboardContainer").width(); //retrieve current window width
    var windowHeight = $(window).height(); //retrieve current window height
    console.log("width" + keyboardWidth);
    var numKeys = 48;
    var numOctaves = (numKeys/12);
    var numWhiteKeys = numOctaves * 7;
    var numBlackKeys = numOctaves * 5;
    var whiteKeyWidth = (keyboardWidth / numWhiteKeys);
    var blackKeyWidth = whiteKeyWidth * 0.6;
    $('#keyboard').css("height", 0.1 *  keyboardWidth);
    
    // White Keys
    var j = 0
    var wk = 0
    var bk = 0
    for( var i=0; i<numKeys; i++){
        j = i%12;
        if( j == 1 || j == 3 || j == 6 || j == 8 || j == 10  ){
            /* keyId = "bk" + bk; */
            keyId = "k" + i;
            posX = (wk)*whiteKeyWidth - blackKeyWidth/2;
            $('#keyboard').append('<div id="'+keyId+'" data-keyNum="'+(i+1)+'" class="key blackKey" ></div>');
            $("#"+keyId).css("left" , posX);
            bk++;
        }
        else{
            /* keyId = "wk" + wk; */
            keyId = "k" + i;
            $('#keyboard').append('<div id="'+keyId+'" data-keyNum="'+(i+1)+'" class="key whiteKey" ></div>');
            $("#"+keyId).css("left" , wk * (whiteKeyWidth));
            wk++;
        }
    }
    $('.whiteKey').css("width", (whiteKeyWidth-2)+"px"   );
    $('.blackKey').css("width", blackKeyWidth+"px");

        
    // **********************************************************************
    // DRAW SYNTH FRAME
    // **********************************************************************
    $('.frame_left').css('height', $('.center_section').height()+"px" );
    $('.frame_right').css('height', $('.center_section').height()+"px" );    
    
    // ******************************************************
    // KEYBOARD EVENTS
    // ******************************************************
    
    //var keyValues = { 90:"c", 83:"c#", 88:"d", 68:"d#", 67:"e", 86:"f", 71:"f#" , 66:"g", 72:"g#", 78:"a", 74:"a#", 77:"b"};
    var noteNames = new Array("c",   "c#",  "d",  "d#",   "e",   "f",   "f#",  "g",   "g#",  "a",   "a#",  "b");  
    var keyValues =         { 90:1,  83:2,  88:3,  68:4,  67:5,  86:6,  71:7 , 66:8,  72:9,  78:10, 74:11, 77:12,
                              81:13, 50:14, 87:15, 51:16, 69:17, 82:18, 53:19, 84:20, 54:21, 89:22, 55:23, 85:24,
                              73:25, 57:26, 79:27, 48:28 };

    keyValues[70] = -1;
    keyValues[75] = -1;
    keyValues[52] = -1;
    keyValues[56] = -1;

    var keyPressed = -1;
    $(document).keydown(function(event){
        keyPressed = event.which;
        note = (keyValues[keyPressed]);
        if(keyPressed == 40 ) {
            octave1 = parseInt( $('#knob-octave1').attr("data-value") );
            if( octave1>0 ) $('#knob-octave1').attr('data-value' , --octave1);
            steps = parseInt( $('#knob-octave1').attr("data-steps") );
            $('#knob-octave1  .marker_container').css('transform', "rotate("+parseFloat(280.0*(octave1/steps))+"deg)");            
            }
        if(keyPressed == 38 ) {
            octave1 = parseInt( $('#knob-octave1').attr("data-value") );
            if( octave1<5 ) $('#knob-octave1').attr('data-value' , ++octave1);
            steps = parseInt( $('#knob-octave1').attr("data-steps") );
            $('#knob-octave1  .marker_container').css('transform', "rotate("+parseFloat(280.0*(octave1/steps))+"deg)");            
        }
        vco.frequency.value = noteToFrequency(note); // set frequency
        vco2.frequency.value = noteToFrequency(note); // set frequency
        value = keyValues[keyPressed];
        if(value>0) playNote(note);
        //alert(keyPressed);
        $('#k'+ (keyValues[event.which] - 1)).addClass('active');
    });
    
    $(document).keyup(function(event){ 
        vca.gain.value = 0;
        vca2.gain.value = 0;
        $('#k'+ (keyValues[event.which] -1)).removeClass('active');
    });
    var isMouseDown = false;

    
    $( ".key" ).mouseover( function() { 
        if(isMouseDown) {
            $(this).addClass("active");
            playNote( parseInt($(this).attr("data-keyNum")) );
        }
    });

    $('.key').mousedown(function() {
        isMouseDown = true;
        $(this).addClass("active"); 
        playNote( parseInt($(this).attr("data-keyNum"))  );
        })
        .mouseup(function() {
        isMouseDown = false;
        vca.gain.value = 0;
        vca2.gain.value = 0;
        
    });
    
    $( ".key" ).mouseleave(function() { 
        $(this).removeClass("active");
        vca.gain.value = 0;
        vca2.gain.value = 0;
    });
    $( ".key" ).mouseup(function() {
        isMouseDown = false ;
        $(this).removeClass("active");
        vca.gain.value = 0;
        vca2.gain.value = 0;
    });
    
    // ******************************************************
    // KNOB EVENTS
    // ******************************************************
    
    $('.knob').mousemove( function(){
        var id = $(this).attr('id');
        if( id == 'knob-volume1' ){
            volume1 = parseFloat( $('#knob-volume1').attr('data-value') )/100;
        }
        else if( id == 'knob-volume2' ){
            volume2 = parseFloat( $('#knob-volume2').attr('data-value') )/100;
        }
        else if( id == 'knob-octave1' ){
            octave1 = parseInt( $(this).attr('data-value') );
        }
        else if( id == 'knob-octave2' ){
            octave2 = parseInt( $(this).attr('data-value') );
        }
        else if( id == 'knob-osc1Type' ){
            vco.type = parseInt( $(this).attr('data-value') );
        }
        else if( id == 'knob-osc2Type' ){
            vco2.type = parseInt( $(this).attr('data-value') );
        }
        else if( id == 'knob-detune1' ){
           detune1 = (parseInt( $(this).attr('data-value') ) - 50 ) * .02;
        }
        else if( id == 'knob-detune2' ){
           detune2 = (parseInt( $(this).attr('data-value') ) - 50 ) * .02;
        }
    });
    
    });