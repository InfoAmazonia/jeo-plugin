window.addEventListener("DOMContentLoaded", function () {
    const zeroPad = (num, places) => String(num).padStart(places, '0');

    function reskinTime(secs) {
        var hr = Math.floor(secs / 3600);
        var min = Math.floor((secs - (hr * 3600)) / 60);
        var sec = Math.floor(secs - (hr * 3600) - (min * 60));
        if (sec < 10) {
                sec = "0" + sec;
        }
        return min + ':' + sec;
    }

    function numberMap(n, start1, stop1, start2, stop2) {
        return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
    };


    document
        .querySelectorAll(".category-audio .wp-block-audio")
        .forEach(function (audio_wrapper, index) {
            // Build fake player structure
            audio_wrapper.insertAdjacentHTML(
                "afterbegin",
                '<div class="audio-fake-player"> <div class="player-meta"> <span class="current-time">0:00</span> <div class="audio-bar"><div class="fill-bar"></div></div> <span class="total-time">1:15</span> </div> <button class="play-button"> <i class="fas fa-play"></i> </button> </div>'
            );

            if(!index){
                audio_wrapper.querySelector('.audio-fake-player').classList.add('first-fake-audio-element');
            }

            const player = audio_wrapper.querySelector("audio");
            player.classList.add('hide');
            
            player.addEventListener('loadedmetadata', function() {
                audio_wrapper.querySelector('.total-time').innerHTML = reskinTime(player.duration);   
                audio_wrapper.querySelector('button.play-button').onclick = function() {
                    player[player.paused ? 'play' : 'pause']();
                    if (this.querySelector('i').classList.contains('fa-undo')) {
                        this.querySelector('i').classList.remove("fa-undo");
                        this.querySelector('i').classList.toggle("fa-pause");
                        return;
                    }
                    this.querySelector('i').classList.toggle("fa-pause");
                    this.querySelector('i').classList.toggle("fa-play");
                }

                audio_wrapper.querySelector('.audio-bar').onclick = function(e) {
                    player.currentTime = numberMap(e.offsetX, 0, this.offsetWidth, 0, player.duration).toString();
                }

                //https://www.w3schools.com/howto/howto_js_draggable.asp
            });

            player.addEventListener('ended', function() {
                audio_wrapper.querySelector('i').classList.toggle("fa-undo");
                audio_wrapper.querySelector('i').classList.toggle("fa-pause")
            });
            
            player.addEventListener("timeupdate", function(e) {
                audio_wrapper.querySelector('.fill-bar').style.width = (player.currentTime / player.duration)*100 + '%';
                audio_wrapper.querySelector('.current-time').innerHTML = reskinTime(player.currentTime.toString());
            }, false);
        });
});

