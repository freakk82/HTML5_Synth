

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
    if(isAndroid) alert(BrowserName+" on "+OSName);
    
    
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

    /* VCO */
    var vco = context.createOscillator();
    /* vco.type = vco.SINE; */
    vco.type = parseInt($('#knob-osc1Type').attr('data-value'));;
    vco.frequency.value = this.frequency;
    vco.start(0);
    
    var volume = 1;
    var octave = 2;
    
    var noteOn = 0;
    
    /* VCA */
    var vca = context.createGain();
    vca.gain.value = 0;
    
    /* Connections */
    vco.connect(vca);
    vca.connect(context.destination);
    
    //vco.noteOn(0); // Play instantly
    //var octave = 2;
    var noteToFrequency = function(note) { return  Math.pow(2, (note-58) / 12) * 440.0; }
    
    var playNote = function(keyNum){
        vco.noteOn(0);
        //octave = parseInt( $('#knob-octave').attr('data-value') );
        vco.frequency.value = noteToFrequency( keyNum  + 12 * octave );
        console.log( "freq = " + vco.frequency.value );
        //vca.gain.value = volume * parseFloat( $('#knob-volume').attr('data-value') )/100;
        vca.gain.value = volume ;
    }
    
    // **********************************************************************
    // INIT VALUES & KNOBS
    // **********************************************************************

    // Set knobs rotation
    $.each( $('.knobHolder'), function() {
        val = $(this).attr('data-value');
        switch( parseInt($(this).attr('data-knobType')) ){
            case 0:
                $('#'+ $(this).attr('id') +' .knobIndicator').css('transform', "rotate("+val*280/100+"deg)");
                break;
            case 1:
                steps = parseInt( $('#'+ $(this).attr('id') ).attr("data-steps") );
                $('#'+ $(this).attr('id') +' .knobIndicator').css('transform', "rotate("+parseFloat(280.0*(val/steps))+"deg)");
                break;
        }
    });
    
    octave = parseInt($('#knob-octave').attr('data-value'));
    volume = parseFloat($('#knob-volume').attr('data-value'))/100;
    console.log("vol: "+ volume);
    console.log("oct: "+ octave);
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
            octave = parseInt( $('#knob-octave').attr("data-value") );
            if( octave>0 ) $('#knob-octave').attr('data-value' , --octave);
            steps = parseInt( $('#knob-octave').attr("data-steps") );
            $('#knob-octave  .knobIndicator').css('transform', "rotate("+parseFloat(280.0*(octave/steps))+"deg)");            
            }
        if(keyPressed == 38 ) {
            octave = parseInt( $('#knob-octave').attr("data-value") );
            if( octave<5 ) $('#knob-octave').attr('data-value' , ++octave);
            steps = parseInt( $('#knob-octave').attr("data-steps") );
            $('#knob-octave  .knobIndicator').css('transform', "rotate("+parseFloat(280.0*(octave/steps))+"deg)");            
        }
        //console.log( note + " ; " + noteNames[ keyValues[keyPressed] ] +octave.toString() );
        vco.frequency.value = noteToFrequency(note); // set frequency
        console.log( "freq = " + vco.frequency.value );
        value = keyValues[keyPressed];
        if(value>0) playNote(note);
        //alert(keyPressed);
        console.log(noteOn);
        $('#k'+ (keyValues[event.which] - 1)).addClass('active');
    });
    
    $(document).keyup(function(event){ 
        vca.gain.value = 0;
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
    });
    
    $( ".key" ).mouseleave(function() { 
        $(this).removeClass("active");
        vca.gain.value = 0;
    });
    
    // ******************************************************
    // KNOB EVENTS
    // ******************************************************
    
    $('.knobHolder').mousemove( function(){
        var role = $(this).attr('data-role');
        if( role == 'volume' ){
            //volume = parseInt( $(this).attr('data-value')/100 );
            volume = parseFloat( $('#knob-volume').attr('data-value') )/100;
        }
        else if( role == 'octave' ){
            octave = parseInt( $(this).attr('data-value') );
        }
        else if( role == 'osc1Type' ){
            vco.type = parseInt( $(this).attr('data-value') );
        }
    });
    
    });