window.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll('.single-project .main-content a.project-link');
    
    if(buttons.length) {
        const target = document.querySelector('.entry-content');
        target.insertBefore(buttons[0], target.querySelector('.team-members'));
    }
})