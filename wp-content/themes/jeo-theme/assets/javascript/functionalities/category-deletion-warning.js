window.addEventListener("DOMContentLoaded", function () {
    const deleteTags = document.getElementsByClassName('delete-tag');
    const nativeTags = ['type', 'audio', 'image-gallery', 'long-form', 'news', 'opinion', 'video'];

    for(let deleteTag of deleteTags) {
        let slug = deleteTag.offsetParent.parentElement.parentElement.querySelector('.column-slug').textContent;
        
        if(nativeTags.includes(slug)) {
            deleteTag.onclick = () => {
                alert('Deleting this category may create bugs in JEO Theme.');
            }
        }
    }
})