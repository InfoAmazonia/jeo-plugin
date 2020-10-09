// this is supposed to fix gallery-image block inside cover block
window.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.wp-block-cover').forEach(function(element) {
        if(element.querySelector('.wp-block-jeo-theme-custom-image-gallery-block')) {
            element.classList.add('has-image-gallery');
        }
    })
})