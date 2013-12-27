// PARAMETERS

var maxOffset = 100;
var knobEditing = false;
var knobActive = "";
var knobActiveInitialValue = 0;
var knobActiveValue = 0;
var clickX;
var clickY;


$(".knob").mousedown(function(e) {
    clickX = event.pageX;
    clickY = event.pageY;
    var offsetY = 0;
    knobEditing = true;
    knobActiveInitialValue = parseFloat($(this).attr('data-value'));
    knobActive = $(this).attr('id');
    //console.log(clickX + " ; " + clickY);
});

$(document).mousemove( function(){
    if(knobEditing){
        offsetY = -(event.pageY - clickY);
        knobActiveValue = knobActiveInitialValue + 100*offsetY/maxOffset;
        if(knobActiveValue > 100) knobActiveValue = 100;
        else if (knobActiveValue < 0) knobActiveValue = 0;
        if (offsetY > maxOffset) offsetY = maxOffset;
        else if(offsetY < -maxOffset) offsetY = -maxOffset;
        
        $('#'+knobActive).attr('data-value', knobActiveValue );
        $('#'+knobActive).css('transform', "rotate("+knobActiveValue*280/100+"deg)");
    }
});

$(document).mouseup( function(){
    knobEditing = false;
});

$.fn.animateRotate = function(angle, duration, easing, complete) {
    return this.each(function() {
        var $elem = $(this);

        $({deg: 0}).animate({deg: angle}, {
            duration: duration,
            easing: easing,
            step: function(now) {
                $elem.css({
                    transform: 'rotate(' + now + 'deg)'
                });
            },
            complete: complete || $.noop
        });
    });
};
