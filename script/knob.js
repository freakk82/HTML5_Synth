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
    switch( parseInt($('#'+knobActive).attr('data-knobType')) ){
            case typeContinuous:
                knobActiveValue = knobActiveInitialValue + 100*offsetY/maxOffset;
                if(knobActiveValue > 100) knobActiveValue = 100;
                else if (knobActiveValue < 0) knobActiveValue = 0;
                $('#'+knobActive+' .knobIndicator').css('transform', "rotate("+knobActiveValue*280/100+"deg)");
                break;
            case typeStep:  // It has to be better, smoother, the zero area is too large
                steps = parseInt( $('#'+knobActive).attr("data-steps") );
                /* knobActiveValue += 100* parseInt( (knobActiveInitialValue + offsetY/maxOffset ) / steps); */
                variation = parseInt( (offsetY/(maxOffset/steps) ));
                knobActiveValue += variation;
                console.log( "offY: " + offsetY + "var: " + variation );
                if(knobActiveValue > steps) knobActiveValue = steps;
                else if (knobActiveValue < 0) knobActiveValue = 0;
                $('#'+knobActive+' .knobIndicator').css('transform', "rotate("+parseFloat(280.0*(knobActiveValue/steps))+"deg)");
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
