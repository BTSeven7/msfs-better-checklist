function isInIframe() {
    return window !== window.parent;
}

function setupIframeListner(){
    window.addEventListener('message', function(event) {
        console.log('Message received from Parent:', event.data);
        processParentMessage(event.data);
        });
};

// function setupIframeListener() {
//     return new Promise((resolve, reject) => {
//         window.addEventListener('message', function(event) {
//             console.log('Message received from Parent:', event.data);
//             resolve(event.data); // Resolve the promise with the message data
//         }, { once: true });
//     });
// }

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
           const sbId = parts[1];
           const airportKey = parts[2];
           const aircraft = parts[3];
           const checklist = parts[4];
           
           const settingsData = new CustomEvent('settingsDataReceived', {detail: [sbId, airportKey, aircraft, checklist]});
           document.dispatchEvent(settingsData);
        break;
        
        case 'weather':
            const weatherData = parts.slice(1);
            const weatherEvent = new CustomEvent('weatherDataReceived', {detail: weatherData});
            document.dispatchEvent(weatherEvent);
        break;
    }
    };
}

function getWeatherFromSim(icao){
    return new Promise((resolve, reject) => {

        sendParentMessage(`weather,${icao}`);

        document.addEventListener('weatherDataReceived', function(event) {
            console.log(`iFrame Received: ${event}`);
            const weatherArray = event.detail;
            const weatherData = metarParser(weatherArray[0]);
            resolve(weatherData);
        }, {once: true});

    });
}

function getStoredSettingsFromSim(){
    return new Promise((resolve, reject) => {

        sendParentMessage(`idRequest,`);

        document.addEventListener('settingsDataReceived', function(event) {
            const settingsData = event.detail;
            resolve(settingsData);
        }, {once: true});

    });
}

function setSimStoredSettings(settingsData){
    localStorage.setItem('simBriefIdLocal', settingsData[0]);
    localStorage.setItem('airportIoApiLocal', settingsData[1]);
    localStorage.setItem('aircraftSelected', settingsData[2]);
    localStorage.setItem('aircraftSelectedChecklist', settingsData[3]);
}