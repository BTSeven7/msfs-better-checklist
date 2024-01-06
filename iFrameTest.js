document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.parent.postMessage({ message: 'Panel is active' }, '*');
    }, 2000); // 2-second delay
});