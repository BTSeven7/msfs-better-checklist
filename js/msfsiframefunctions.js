function isInIframe() {
    return window !== window.parent;
}

function setupIframeListner(){
    window.addEventListener('message', function(event) {
        console.log('Message received from Parent:', event.data);
        processParentMessage(event.data);
        });
};

function setupHotKeyListener(keyCode, modifierKey = null) {
    window.addEventListener('keydown', (event) => {
        let modifierKeyPressed = modifierKey ? false : true; // Default to true if no modifier is required

        if (modifierKey) {
            switch (modifierKey.toLowerCase()) {
                case 'alt':
                    modifierKeyPressed = event.altKey;
                    break;
                case 'ctrl':
                    modifierKeyPressed = event.ctrlKey;
                    break;
                case 'shift':
                    modifierKeyPressed = event.shiftKey;
                    break;
                case 'shiftleft':
                    modifierKeyPressed = event.getModifierState('ShiftLeft');
                    break;
                case 'shiftright':
                    modifierKeyPressed = event.getModifierState('ShiftRight');
                    break;
                case 'controlleft':
                    modifierKeyPressed = event.getModifierState('ControlLeft');
                    break;
                case 'controlright':
                    modifierKeyPressed = event.getModifierState('ControlRight');
                    break;
                // Add cases for other specific keys if needed
            }
        }

        if (modifierKeyPressed && event.keyCode === keyCode) {
            console.log(`Key with keyCode ${keyCode}${modifierKey ? ' and ' + modifierKey : ''} was pressed`);
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
            const aircraft = parts[2];
            const checklist = parts[3];
            const color = parts[4];
            const font = parts[5];
            const nfpStatus = parts[6];
            const background = parts[7];
            const VRStatus = parts[8];
           
           const settingsData = new CustomEvent('settingsDataReceived', {detail: [sbId, aircraft, checklist, color, font, nfpStatus, background, VRStatus]});
           document.dispatchEvent(settingsData);
        break;
        
        case 'weather':
            const weatherData = parts.slice(1);
            const weatherEvent = new CustomEvent('weatherDataReceived', {detail: weatherData});
            document.dispatchEvent(weatherEvent);
        break;

        case 'checkShortCut':
            triggerNextChecklistItem(); //Utilityfunctions
        break;
    }
    };
}

function getWeatherFromSim(icao) {
    return new Promise((resolve, reject) => {
        sendParentMessage(`weather,${icao}`);

        document.addEventListener('weatherDataReceived', function(event) {
            console.log(`iFrame Received: ${event}`);
            const weatherArray = event.detail;

            // Check if we received valid weather data
            if (!weatherArray[0] || weatherArray[0] === "") {
                resolve(null);
                return;
            }

            try {
                const weatherData = metarParser(weatherArray[0]);
                resolve(weatherData);
            } catch (error) {
                console.log(`Weather parsing failed for ${icao}:`, error);
                resolve(null);
            }
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
    localStorage.setItem('aircraftSelected', settingsData[1]);
    localStorage.setItem('aircraftSelectedChecklist', settingsData[2]);
    localStorage.setItem('font2', settingsData[3]);
    localStorage.setItem('color1', settingsData[4]);
    localStorage.setItem('no-flight-plan', settingsData[5]);
    localStorage.setItem('background', settingsData[6]);
    if (settingsData[7] === '1') {
        document.body.classList.add('vr-scale');
    }
}

function areLocalStorageKeysSet() {
    const keysToCheck = [
        'aircraftSelected', 
        'aircraftSelectedChecklist', 
        'simBriefIdLocal',
        'font2',
        'color1',
        'noFlightPlan'
    ];

    return keysToCheck.every(key => {
        const value = localStorage.getItem(key);
        return value !== null && value !== '';
    });
}