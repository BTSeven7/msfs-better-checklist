function isInIframe() {
    return window !== window.parent;
}

// function setupIframeListner(){
//     window.addEventListener('message', function(event) {
//         console.log('Message received from Parent:', event.data);
//         processParentMessage(event.data);
//         });
// };

function setupIframeListener() {
    return new Promise((resolve, reject) => {
        window.addEventListener('message', function(event) {
            console.log('Message received from Parent:', event.data);
            resolve(event.data); // Resolve the promise with the message data
        }, { once: true });
    });
}

function setupHotKeyListener(modifierKey, keyCode) {
    window.addEventListener('keydown', (event) => {
        let modifierKeyPressed = false;

        switch (modifierKey) {
            case 'alt':
                modifierKeyPressed = event.altKey;
                break;
            case 'ctrl':
                modifierKeyPressed = event.ctrlKey;
                break;
            case 'shift':
                modifierKeyPressed = event.shiftKey;
                break;
            case 'ShiftLeft':
                modifierKeyPressed = event.getModifierState('ShiftLeft');
                break;
            case 'ShiftRight':
                modifierKeyPressed = event.getModifierState('ShiftRight');
                break;
            case 'ControlLeft':
                modifierKeyPressed = event.getModifierState('ControlLeft');
                break;
            case 'ControlRight':
                modifierKeyPressed = event.getModifierState('ControlRight');
                break;
            // Add cases for other specific keys if needed
            default:
                modifierKeyPressed = true; // No specific modifier required
        }

        if (modifierKeyPressed && event.keyCode === keyCode) {
            console.log(`Key with keyCode ${keyCode} and ${modifierKey} was pressed`);
            sendParentMessage(`hotkey,pressed`);
            event.preventDefault(); // Prevent the default action for this key
        }
    });
}

function disableKeysListener(keyCodes) {
    window.addEventListener('keydown', function(event) {
        if (keyCodes.includes(event.keyCode)) {
            console.log(`Key with keyCode ${event.keyCode} was pressed and disabled`);
            event.preventDefault(); // Prevent default action of the key
        }
    });
}

function sendParentMessage(message){
    window.parent.postMessage(message, '*');
    console.log(`iFrame Sent: ${message}`);
}

function processParentMessage(message){
    const parts = message.split(',');

    if (parts.length > 0) {
        const command = parts[0];

    switch(command) {
        case 'ids':
           localStorage.setItem('simBriefIdLocal', parts[1]);
           localStorage.setItem('airportIoApiLocal', parts[2]);
        break;

        case 'aircraft':
            localStorage.setItem('aircraftSelected', parts[1]);
            localStorage.setItem('aircraftSelectedChecklist', parts[2]);
        break;
        
        case 'weather':
            const weatherData = parts.slice(1);
            const weatherEvent = new CustomEvent('weatherDataReceived', {detail: weatherData});
            document.dispatchEvent(weatherEvent);
        break;
    }
    };
}