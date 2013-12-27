

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
    var volume = 1;
    
    var vco = context.createOscillator();
    vco.type = vco.SINE;
    vco.frequency.value = this.frequency;
    vco.start(0);
 
    /* VCA */
    var vca = context.createGain();
    vca.gain.value = 0;
    
    /* Connections */
    vco.connect(vca);
    vca.connect(context.destination);
    
    //vco.noteOn(0); // Play instantly
    var octave = 0;
    var noteToFrequency = function(note) { return  Math.pow(2, (note-58) / 12) * 440.0; }
    
    var playNote = function(keyNum){
        vco.noteOn(0);
        vco.frequency.value = noteToFrequency( keyNum );
        console.log( "freq = " + vco.frequency.value );
        vca.gain.value = volume * parseFloat( $('#kn-volume').attr('data-value') )/100;
    }
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
            keyId = "bk" + bk;
            posX = (wk)*whiteKeyWidth - blackKeyWidth/2;
            $('#keyboard').append('<div id="bk'+bk+'" data-keyNum="'+(i+1)+'" class="key blackKey" ></div>');
            $("#"+keyId).css("left" , posX);
            bk++;
        }
        else{
            keyId = "wk" + wk;
            $('#keyboard').append('<div id="wk'+wk+'" data-keyNum="'+(i+1)+'" class="key whiteKey" ></div>');
            $("#"+keyId).css("left" , wk * (whiteKeyWidth));
            wk++;
        }
    }
    $('.whiteKey').css("width", (whiteKeyWidth-2)+"px"   );
    $('.blackKey').css("width", blackKeyWidth+"px");


    
    // Keyboard press
 
    //var keyValues = { 90:"c", 83:"c#", 88:"d", 68:"d#", 67:"e", 86:"f", 71:"f#" , 66:"g", 72:"g#", 78:"a", 74:"a#", 77:"b"};
    var keyValues = { 90:1, 83:2, 88:3, 68:4, 67:5, 86:6, 71:7 , 66:8, 72:9, 78:10, 74:11, 77:12};
    var noteNames = new Array("c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b");
    keyValues[70] = -1;
    keyValues[75] = -1;

    var keyPressed = -1;
    $(document).keydown(function(event){
        keyPressed = event.which;
        note = (keyValues[keyPressed]);
        if(keyPressed == 40 && octave>0) octave--;
        if(keyPressed == 38 && octave<5) octave++;
        console.log( note + " ; " + noteNames[ keyValues[keyPressed] ] +octave.toString() );
        vco.frequency.value = noteToFrequency(note); // set frequency
        console.log( "freq = " + vco.frequency.value );
        value = keyValues[keyPressed];
        if(value>0) playNote(note + 12 * octave);
        //alert(keyPressed);
    });
    
    $(document).keyup(function(event){ vca.gain.value = 0; });
    var isMouseDown = false;

    
    $( ".key" ).mouseover( function() { 
        if(isMouseDown) {
            $(this).addClass("active");
            playNote( parseInt($(this).attr("data-keyNum")) + 12 * octave );
        }
    });

    $('.key').mousedown(function() {
        isMouseDown = true;
        $(this).addClass("active"); 
        playNote( parseInt($(this).attr("data-keyNum")) + 12 * octave );
        })
        .mouseup(function() {
        isMouseDown = false;
        vca.gain.value = 0;
    });
    
    $( ".key" ).mouseleave(function() { 
        $(this).removeClass("active");
        vca.gain.value = 0;
    });
    
    
    
    
    
    });