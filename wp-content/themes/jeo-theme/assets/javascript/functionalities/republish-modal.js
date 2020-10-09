window.addEventListener("DOMContentLoaded", function () {
    const isRepublishablePost = document.querySelector('.republish-post');

    if(isRepublishablePost) {
        // Open and close modal
        const modal = document.querySelector('.republish-post-modal');
        const modalContainer = document.querySelector('.modal-container')
        modal.classList.add("hideModal");

        document.querySelector('.republish-post-label').onclick = () => {
            modal.classList.add("showModal");
            modalContainer.style.display = 'block';
        }

        document.querySelector('.close-button').onclick = () => {
            modal.classList.remove("showModal");
        }

        // Modal tabs (HTML/TEXT)
        htmlButton = document.querySelector('.controls .html-button');
        textButton = document.querySelector('.controls .text-button');

        htmlText = document.querySelector('.wrapper-html-text');
        rawText = document.querySelector('.wrapper-raw-text');

        htmlButton.onclick = () => {
            rawText.style.display = 'none';
            htmlText.style.display = 'block';

            htmlButton.style.backgroundColor = '#cccccc';
            htmlButton.style.color = '#555D66';

            textButton.style.backgroundColor = '#555D66';
            textButton.style.color = 'white';
        }

        textButton.onclick = () => {
            rawText.style.display = 'block';
            htmlText.style.display = 'none';

            htmlButton.style.backgroundColor = '#555D66';
            htmlButton.style.color = 'white';
            textButton.style.backgroundColor = '#cccccc'
            textButton.style.color = '#555D66';
        }

        // Copy button
        copyButton = document.querySelector('.copy-button');
        
        copyButton.onclick = () => {
            if(rawText.style.display != 'none') {
                let text = document.querySelector('.wrapper-raw-text p').innerText;
                let elem = document.createElement("textarea");
                document.body.appendChild(elem);
                elem.value = text;
                elem.select();
                document.execCommand("copy");
                document.body.removeChild(elem);
            } else {
                let text = document.querySelector('.wrapper-html-text p').innerText;
                let elem = document.createElement("textarea");
                document.body.appendChild(elem);
                elem.value = text;
                elem.select();
                document.execCommand("copy");
                document.body.removeChild(elem);
            }
        }

        // Hide bullets introductions if there is no bullet
        if(!document.querySelector('.bullet-description')) {
            document.querySelector('.bullets-introduction').style.display = 'none';
        }
    }
});

