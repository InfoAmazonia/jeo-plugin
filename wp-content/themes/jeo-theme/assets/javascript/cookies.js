window.addEventListener("DOMContentLoaded", function () {
    const parent = document.querySelector('.cc-window');
    const hasChild = document.querySelector('.cc-window .jeo');
    const acceptAllBtn = document.querySelector('.cc-accept-all');
    console.log("acceptall");
    console.log(acceptAllBtn);
    if (parent && !hasChild) {
        const content = parent.innerHTML;
        const additionalElement = document.createElement('div');
        additionalElement.classList.add('jeo');
        additionalElement.innerHTML = content;
        parent.innerHTML = "";
        parent.appendChild(additionalElement);
    }
})