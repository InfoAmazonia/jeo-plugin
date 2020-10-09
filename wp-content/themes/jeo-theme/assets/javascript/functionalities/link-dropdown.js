window.addEventListener("DOMContentLoaded", function () {
    const isMobile = () => {
        const deviceWidth = document.documentElement.clientWidth;

        if (deviceWidth >= 830) return false;
        
        return true;
    }
    

    if(document.querySelector('.link-dropdown') && isMobile()) {
        document.querySelector('.link-dropdown .controls.saved-block').onclick = () => {
            const sections = document.querySelector('.link-dropdown .sections');
            const arrowIcon = document.querySelector('.link-dropdown .arrow-icon');
         
            sections.style.transition = 'all 0.2s ease-in';
    
            if(sections.style.opacity == 1) {
                arrowIcon.className = 'arrow-icon fas fa-angle-down';
                sections.style.opacity = 0;
                sections.style.height = 0;
    
            } else {
                arrowIcon.className = 'arrow-icon fas fa-angle-up';
                sections.style.opacity = 1;
                sections.style.height = 'auto';
    
            }
    
        }
    }
});

