document.addEventListener('DOMContentLoaded', () => {

    const newParagraph = document.createElement('p');
    newParagraph.textContent = 'The panel is now inactive.';

                // Append the new paragraph below the existing message
    const iframeMessage = document.querySelector('p'); // Assuming the existing message is in a <p> tag
    iframeMessage.insertAdjacentElement('afterend', newParagraph);
    
    setTimeout(() => {
        window.parent.postMessage({ message: 'Panel is active' }, '*');
    }, 2000); // 2-second delay
});
