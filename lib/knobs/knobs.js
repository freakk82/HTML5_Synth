$(document).ready(function () {

    // Globals
    
    var minAngle = 40;
    var maxAngle = 320;
    var knobEditing = false;
    var knobActive ;
    var offset ;
    var width ;
    var height;

    var centerX ;
    var centerY ;

    // **********************************************************************
    // INIT VALUES & KNOBS
    // **********************************************************************
    
    $.each( $('.knob'), function() {
        $(this).append('<div class="metal radial"></div><div class="marker_container"><div class="knob_img"></div>');
    });
    
    // If default values are set in the HTML, load the knobs accordingly
    $.each( $('.knob'), function() {
        knobActive = $(this);
        val = parseInt($(this).attr('data-value'));
        if(knobActive.attr('data-type')=='continuous'){
            angle = 360 * val/100;
            if(angle>maxAngle) angle = maxAngle;
            else if(angle<minAngle) angle = minAngle;
            console.log($(this).attr('id')+': '+angle);
            knobActive.find(".marker_container").css('transform', "rotate("+angle+"deg)");
        }
        else if( knobActive.attr('data-type') == 'stepped'){
            stepNum = parseInt(knobActive.attr('data-steps'));
            stepLength = (maxAngle-minAngle)/stepNum;
            knobActive.find(".marker_container").css('transform', "rotate("+minAngle+stepLength*val+"deg)");
        }
        else  $('#'+ $(this).attr('id') +' .marker_container').css('transform', "rotate("+minAngle+"deg)");
    });
    
    
    $(".knob").draggable = false;
    // this works for older web layout engines
    $(".knob").onmousedown = function(event) {
                event.preventDefault();
                return false;
              };


    
    var angle=0;
    
    $(".knob").mousedown(function() { 
        knobEditing = true;
        knobActive = $(this);
        setKnob();
    });
    $(document).mouseup(function() { 
        knobEditing = false;
    });
    
    $(document).mousemove(function(event) {
        if(knobEditing){
            setKnob();
        }
    });
    
    var setKnob = function(){
    var offset = knobActive.offset();
        var width = knobActive.width();
        var height = knobActive.height();

        var centerX = offset.left + width / 2;
        var centerY = offset.top + height / 2;

        clickX = event.pageX;
        clickY = event.pageY;
        
        y = (clickY - centerY);
        x = (clickX - centerX);

        if( x>0 && y>0) {
           theta = Math.atan2(x,y);
           tmp = (90 - ((theta * 180) / Math.PI)) % 360;
           angle = 360 -tmp;
        }
        else{
        theta = Math.atan2(x,-y);
        angle = (90 - ((theta * 180) / Math.PI)) % 360;
        }
        angle = (360+270-angle)% 360;

        if(angle<minAngle) angle=minAngle;
        else if (angle>maxAngle) angle = maxAngle;
        
        if(knobActive.attr('data-type')=='continuous'){
            knobActive.find(".marker_container").css('transform', "rotate("+angle+"deg)");
            knobActive.attr('data-value', (angle-minAngle)*100/(maxAngle-minAngle));
        }
        else if( knobActive.attr('data-type') == 'stepped'){
            stepNum = parseInt(knobActive.attr('data-steps'));
            stepLength = (maxAngle-minAngle)/stepNum;
            currentStep = parseInt(angle/stepLength);
            knobActive.find(".marker_container").css('transform', "rotate("+minAngle+stepLength*currentStep+"deg)");
            knobActive.attr('data-value', currentStep);
        }
    }
});