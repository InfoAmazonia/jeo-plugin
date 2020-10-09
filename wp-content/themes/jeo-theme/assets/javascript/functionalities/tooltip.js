window.addEventListener("DOMContentLoaded", function () {
    // This fixes inner tooltip ": " to prevent recursive strategy
    const stringAcumulator = (finalString, item) => {
        return finalString + ': ' + item;
    };

    document.addEventListener('click', function(event) {
        var isClickInsideElement = event.target.classList.contains('tooltip-block');
        if (!isClickInsideElement) {
            document.querySelectorAll('.tooltip-block').forEach(tooltip => tooltip.classList.remove('active'));
        }
    });

    document.querySelectorAll('.tooltip-block').forEach(tooltip => {
        const splitResult = tooltip.innerText.split(': ');

        if(splitResult.length == 1 || !splitResult.length ) {
            tooltip.classList.remove('tooltip-block');
            return;
        }

        const referenceWord = splitResult[0];
        const contentTooltip = splitResult.length >= 1? splitResult.splice(1).reduce(stringAcumulator): '';

        const tooltipElement = document.createElement('div');
        tooltipElement.classList.add('tooltip-block--content');
        tooltipElement.innerText = contentTooltip;


        tooltip.innerText = referenceWord;
        tooltip.appendChild(tooltipElement);

        tooltip.onclick = function() {
            this.classList.toggle('active');
            document.querySelectorAll('.tooltip-block.active').forEach(item => { if(item != this) item.classList.remove('active')})
        }
    })
})