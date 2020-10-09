import SSS from './../../vendor/sss/sss.min';

window.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.image-gallery .gallery-grid').forEach(function(slider, index) {
        const sss = new SSS(slider, {
            slideShow : false, 
            startOn : 0, 
            transition : 0,
            speed : 0, 
            showNav : true
        } );

        //console.log(sss);


        const dotsArray = Array.from({length: slider.getAttribute('data-total-slides')}, (v, i) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.setAttribute('target', i);

            if(i == 0) {
                dot.classList.add('active');
            }

            return dot;
        });

        dotsArray.forEach((dot, index) => {
            dot.onclick = function() {
                jQuery(dotsArray).removeClass('active');
                dot.classList.toggle('active');
                sss.go_to_slide(index);
            }
        });

        const dotsWrapper = document.createElement('div');
        dotsWrapper.classList.add('dots-wrapper');
        dotsArray.forEach(dot => dotsWrapper.appendChild(dot))
        slider.parentNode.appendChild(dotsWrapper);

        slider.querySelector('.sssprev').addEventListener('click', function() {
            jQuery(dotsWrapper.querySelectorAll('.dot')).removeClass('active');
            jQuery(dotsWrapper.querySelectorAll('.dot')).eq(sss.target).toggleClass('active');
        });

        slider.querySelector('.sssnext').addEventListener('click', function() {
            jQuery(dotsWrapper.querySelectorAll('.dot')).removeClass('active');
            jQuery(dotsWrapper.querySelectorAll('.dot')).eq(sss.target).toggleClass('active');
        });


        slider.parentNode.querySelector('button[action="fullsreen"]').onclick = function() {
            slider.parentNode.parentNode.classList.toggle('fullscreen');
            this.querySelector('i').classList.toggle('fa-expand');
            this.querySelector('i').classList.toggle('fa-compress');
        }

        slider.parentNode.querySelector('button[action="display-grid"]').onclick = function() {
            slider.parentNode.parentNode.classList.toggle('grid-display');
            this.querySelector('i').classList.toggle('fa-th');
            this.querySelector('i').classList.toggle('fas');
            this.querySelector('i').classList.toggle('far');
            this.querySelector('i').classList.toggle('fa-square');
        }

        slider.querySelectorAll('.gallery-item-container img').forEach((element, slide_index) => {
            element.onclick = function() {
                if(slider.parentNode.parentNode.classList.contains('grid-display')) {
                    slider.parentNode.parentNode.classList.toggle('grid-display');
                    slider.querySelectorAll('.gallery-item-container').forEach(element => element.style.display = "none");
                    this.parentNode.style.display = "block";
                    jQuery(dotsWrapper.querySelectorAll('.dot')).removeClass('active');
                    jQuery(dotsWrapper.querySelectorAll('.dot')).eq(slide_index).toggleClass('active');

                    sss.go_to_slide(slide_index);

                    slider.parentNode.querySelector('button[action="display-grid"]').querySelector('i').classList.toggle('fa-th');
                    slider.parentNode.querySelector('button[action="display-grid"]').querySelector('i').classList.toggle('fas');
                    slider.parentNode.querySelector('button[action="display-grid"]').querySelector('i').classList.toggle('far');
                    slider.parentNode.querySelector('button[action="display-grid"]').querySelector('i').classList.toggle('fa-square');
                }
            }
        })
    })
})