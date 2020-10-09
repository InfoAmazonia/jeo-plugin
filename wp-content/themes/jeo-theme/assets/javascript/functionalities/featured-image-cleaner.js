window.addEventListener("DOMContentLoaded", function () {
    const removedItensLabel = ['Small', 'Beside article title']
    try {
        document.querySelector('.components-base-control.components-radio-control').querySelectorAll('.components-radio-control__option').forEach(element => {
            const label = element.querySelector('label');
            if (removedItensLabel.includes(label.innerHTML)) {
                element.remove();
            };

        })
    } catch {
        //console.log('not found');
    }
    
    try {
        document.querySelector('#customize-control-featured_image_default').querySelectorAll('.customize-inside-control-row').forEach(element => {
            const label = element.querySelector('label');
            if (removedItensLabel.includes(label.innerHTML)) {
                element.remove();
            };

        })

    } catch {
        //console.log('not found');
    }
})