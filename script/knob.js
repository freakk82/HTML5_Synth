// PARAMETERS

var maxOffset = 100; // higher offset  ==> more sensitivity
var knobEditing = false;
var knobActive = "";
var knobActiveInitialValue = 0;
var knobActiveValue = 0;
var clickX;
var clickY;
var typeContinuous = 0;
var typeStep = 1;
var typeSwitched = 2;

var params = new Array(); // parameters array

$(".knobHolder").mousedown(function(e) {
    clickX = event.pageX;
    clickY = event.pageY;
    var offsetY = 0;
    knobEditing = true;
    knobActiveInitialValue = parseFloat($(this).attr('data-value'));
    knobActive = $(this).attr('id');
    //console.log(clickX + " ; " + clickY);
});

var setKnob = function( offsetY ){
    knobActiveInitialValue = parseInt($('#'+knobActive).attr('data-value'));
    switch( parseInt($('#'+knobActive).attr('data-knobType')) ){
            case typeContinuous:
                knobActiveValue = knobActiveInitialValue + 100*offsetY/maxOffset;
                if(knobActiveValue > 100) knobActiveValue = 100;
                else if (knobActiveValue < 0) knobActiveValue = 0;
                $('#'+knobActive+' .marker_container').css('transform', "rotate("+knobActiveValue*280/100+"deg)");
                break;
            case typeStep:  // It has to be better, smoother, the zero area is too large
                steps = parseInt( $('#'+knobActive).attr("data-steps") );
                stepLenght = maxOffset/ steps;
                variation =  100*offsetY/maxOffset;
                if(variation > 100) variation = 100;
                else if (variation < -100) variation = -100;
                step = parseInt(variation /(stepLenght));
                
                knobActiveValue = step;
                if(knobActiveValue > steps) knobActiveValue = steps;
                if(knobActiveValue < 0) knobActiveValue = 0;
                console.log("step: "+step+" ; value: "+ knobActiveValue);
                $('#'+knobActive+' .marker_container').css('transform', "rotate("+280*(knobActiveValue/steps)+"deg)");
                break;
        }
    $('#'+knobActive).attr('data-value', knobActiveValue );
}

$(document).mousemove( function(){
    if(knobEditing){
        offsetY = -(event.pageY - clickY);
        if (offsetY > maxOffset) offsetY = maxOffset;
        else if(offsetY < -maxOffset) offsetY = -maxOffset;
        setKnob( offsetY );
    }
});

$(document).mouseup( function(){
    knobEditing = false;
});
