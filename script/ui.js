$(document).ready(function () {
    var visibleWindow = "";
    fadeTime = 150;
    effect = "fade";
    options = {};
    
    $('.windowClose').click( function(){
        $('.windowsContainer').hide();
        visibleWindow.hide();
    });
    
    $('#link-keyboard').click( function(){
        $('.windowsContainer').show()
        if(visibleWindow!="") visibleWindow.hide();
        visibleWindow = $('#keyboardLayout');
        visibleWindow.show();
    });
    $('#link-about').click( function(){
        $('.windowsContainer').show()
        if(visibleWindow!="") visibleWindow.hide();
        visibleWindow = $('#aboutWindow');
        visibleWindow.show();
    });
});