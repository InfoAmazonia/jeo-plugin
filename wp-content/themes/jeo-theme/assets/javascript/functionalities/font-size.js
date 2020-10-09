window.addEventListener("DOMContentLoaded", function () {
    jQuery('button[action="increase-size"]').click(function() {
        const fontSize = jQuery('html').css('font-size');
        const newFontSize = parseInt(fontSize) + 1;
    
        if (checkSize(newFontSize)) {
            jQuery('html').css('font-size', newFontSize);
            localStorage.setItem('fontSizeAccessibility', newFontSize);
        }
    });
    
    jQuery('button[action="decrease-size"]').click(function() {
        const fontSize = jQuery('html').css('font-size');
        const newFontSize = parseInt(fontSize) - 1;
    
        if (checkSize(newFontSize)) {
            jQuery('html').css('font-size', newFontSize);
            localStorage.setItem('fontSizeAccessibility', newFontSize);
        }
    });
    
    if(localStorage.getItem('fontSizeAccessibility')) {
        jQuery('html').css('font-size', localStorage.getItem('fontSizeAccessibility') + 'px');
    }
    
    function checkSize(newFontSize) {
        return newFontSize <= 10 || newFontSize >= 26? false : true;
    }
});