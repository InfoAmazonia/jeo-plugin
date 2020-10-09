setTimeout(function(){
    (function($){
        if(typeof ajaxurl !== 'undefined') {
            $(function(){
                if(document.querySelector('.single')) {
                    $.post(ajaxurl, {action: 'ajaxpv', ajaxpv: ajaxpv, ajaxpt: ajaxpt});
                }
            });
        }
    })(jQuery);
},2000)