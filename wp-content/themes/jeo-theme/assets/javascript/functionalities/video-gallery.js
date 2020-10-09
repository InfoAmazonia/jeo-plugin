window.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.video-gallery-wrapper').forEach( videoGallery => {
        let videoItens = videoGallery.querySelectorAll('.embed-template-block');
        
        if(videoItens.length > 0) {
            videoCopyPolicyFix = videoItens[0].cloneNode(true);

            if(document.querySelector('body').classList.contains('cmplz-status-allow')){
                // plugin cmplz postprocessing fix.
                videoCopyPolicyFix.querySelector('figure > div').classList.remove('cmplz-blocked-content-container', 'cmplz-placeholder-1');
                videoCopyPolicyFix.querySelector('figure .wp-block-embed__wrapper iframe').classList.remove('cmplz-video', 'cmplz-hidden');
            }

            videoGallery.insertBefore(videoCopyPolicyFix, videoItens[1]);
        }

        videoItens = videoGallery.querySelectorAll('.embed-template-block');
        //console.log(videoItens);

        if(videoItens.length > 1) {
            const groupedItens = [...videoItens];
            groupedItens.splice(0, 1);
            //console.log(groupedItens);

            const groupedItensWrapper = document.createElement('div');
            groupedItensWrapper.classList.add('sidebar-itens');

            const gridScrollLimiter = document.createElement('div');
            gridScrollLimiter.classList.add('scroll-ratio');
            
            let lastClicked = "";

            groupedItens.forEach(video => {
                const clickableVideoArea = document.createElement('button');
                clickableVideoArea.setAttribute('action', 'expand-main-area');
                clickableVideoArea.appendChild(video);

                clickableVideoArea.onclick = function(e) {
                    if(lastClicked != this) {
                        this.closest('.video-gallery-wrapper').querySelector('.embed-template-block').remove();
                        this.closest('.video-gallery-wrapper').insertBefore(this.querySelector('.embed-template-block').cloneNode(true), gridScrollLimiter);
                    }

                    lastClicked = this;
                }


                groupedItensWrapper.appendChild(clickableVideoArea);
            })

            gridScrollLimiter.appendChild(groupedItensWrapper);
            videoGallery.appendChild(gridScrollLimiter);
        }
    })
})