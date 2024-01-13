document.addEventListener('DOMContentLoaded', () => {
    //Set up Listner's for iFrame should be in MSFS
    if (isInIframe()) {
        setupIframeListner();
        setupShiftZKeyListener();
    }
    
    checkListName = 'PMDG 737 Checklist'; //Change Checklist Name
    const checkListJson = './checklistitems.json'; //Change Checklist Json Name
    
    //Create the header for page load
    createTopOfPageHeaderAndForm(checkListName);

    //Set up Fetch Flight Plan Button
    setupFetchButtonEventListener(checkListJson);
    createChecklistContainer();

    //Load Saved Data
    loadPersistedData();
    restoreChecklistContainer();

    setupTabViewToggle();

});

function createTopOfPageHeaderAndForm(checkListName) {
    //Declare body of the document
    const body = document.body; 

    // Create Tab Container
    const tabContainer = document.createElement('div');
    tabContainer.classList.add('tab-container');
    tabContainer.id = 'top-of-page-tab';
    body.appendChild(tabContainer);

    // Create Tab Number 1
    const firstTab = document.createElement('input');
    firstTab.setAttribute('type', 'radio');
    firstTab.setAttribute('id', 'firstTabToggle');
    firstTab.setAttribute('name', 'tabs');
    firstTab.setAttribute('value', '1');
    firstTab.setAttribute('checked', '');
    tabContainer.appendChild(firstTab);

    //Create Label for Tab 1
    const firstLabel = document.createElement('label');
    firstLabel.setAttribute('for', 'firstTabToggle');
    firstLabel.textContent = 'Checklist';
    tabContainer.appendChild(firstLabel);

    //Create Tab Number 2
    const secondTab = document.createElement('input');
    secondTab.setAttribute('type', 'radio');
    secondTab.setAttribute('id', 'secondTabToggle');
    secondTab.setAttribute('name', 'tabs');
    secondTab.setAttribute('value', '2');
    tabContainer.appendChild(secondTab);

    //Create Label for Tab 2
    const secondLabel = document.createElement('label');
    secondLabel.setAttribute('for', 'secondTabToggle');
    secondLabel.textContent = 'Settings';
    tabContainer.appendChild(secondLabel);

    //Create 1st Tab content
    const firstTabContent = document.createElement('div');
    firstTabContent.classList.add('tab-content');
    tabContainer.appendChild(firstTabContent);

    //Add Initial 1st Tab Content
    const firstTabHeader = document.createElement('div');
    firstTabHeader.textContent = `${checkListName}`;
    firstTabHeader.classList.add('firstTabHeader');
    firstTabContent.appendChild(firstTabHeader);

    // Create and Add Fetch Button below the firstTabHeader
    const fetchButton = document.createElement('button');
    fetchButton.textContent = 'Fetch Flight Plan'; // Replace with your button text
    fetchButton.classList.add('fetch-button'); // Add a class for styling
    fetchButton.id = 'fetchButton';
    firstTabContent.appendChild(fetchButton);

    //Create a Master Reset Button
    const resetALL = document.createElement('button');
    resetALL.textContent = 'Reset All';
    resetALL.classList.add('fetch-button');
    resetALL.id = 'resetAll';
    firstTabContent.appendChild(resetALL);

    attachEventListenerToResetAllButton();

    //Create 2nd Tab Conent
    const secondTabContent = document.createElement('div');
    secondTabContent.classList.add('tab-content')
    tabContainer.appendChild(secondTabContent);

    //Create a User Input Form
    const sbFormHolder = 'Enter Simbrief ID' //Place Holder Text
    const sbFormId = 'simBriefIdLocal'; //ID For Local Storage
    const airportIoApiKeyHolder = 'Enter AirportDB.io API Key' //Place Holder Text
    const airportIoApiID = 'airportIoApiLocal' //ID for Local Storage

    createUserInputForm(secondTabContent, sbFormHolder, sbFormId);
    createUserInputForm(secondTabContent, airportIoApiKeyHolder, airportIoApiID);
}

function setupFetchButtonEventListener(checkListJson){
    const fetchButton = document.getElementById('fetchButton'); 
    fetchButton.addEventListener('click', async () => {
        const simBriefId = document.getElementById('simBriefIdLocal').value;
        const airportDbApiKey = document.getElementById('airportIoApiLocal').value;
        console.log('Fetch Flight Plan button clicked');
        console.log(`Simbrief ID: ${simBriefId}`);
        console.log(`API: ${airportDbApiKey}`);

        //Check if iFrame is open and send SimbriefID & API Key
        if (isInIframe()) {
            sendParentMessage(`Ids,${simBriefId},${airportDbApiKey}`);
        };

        const fetchedAPIData = await fetchFlightPlan(simBriefId, airportDbApiKey, checkListJson);
        
        if (fetchedAPIData){
            
            let simOriginWeather;
            let simDestWeather;
            
            if (isInIframe()) {
                simOriginWeather = await getWeatherFromSim(fetchedAPIData.sbData.origin.icao_code);
                simDestWeather = await getWeatherFromSim(fetchedAPIData.sbData.destination.icao_code);
            }else{
                simOriginWeather = await fetchWeatherData(fetchedAPIData.sbData.origin.icao_code);
                simDestWeather = await fetchWeatherData(fetchedAPIData.sbData.destination.icao_code);
            }
            createFlightOverviewHeader(fetchedAPIData.sbData);
            buildCheckList(fetchedAPIData.sbData, fetchedAPIData.airportDbOriginData, fetchedAPIData.airportDbDestData, fetchedAPIData.checklistData, simOriginWeather, simDestWeather);
            updateWeatherContainers(simOriginWeather, simDestWeather);
        }

    attachEventListenersToChecklistItems();
    attachEventListenersToMasterResetButtons();
    attachEventListenersToSectionResetButtons();
    attachCheckAllEventListeners();

    saveChecklistContainer();

    });
    
}

async function fetchFlightPlan(simBriefId, airportDBkey, checkListJson) {
    try {
        //Fetch Simbreif Flight Plan
        const simBriefData = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?username=${simBriefId}&json=1`);
        
        if (simBriefData.status === 400) {
            throw new Error('Invalid SimBreif ID. Please check the SimBrief ID and try again.');
        }

        if (!simBriefData.ok) {
            throw new Error(`HTTP error! Status: ${simBriefData.status}`);
        }
        
        const sbData = await simBriefData.json();
        console.log(sbData); // Or handle the data as needed

        //Fetch AirportDB.io Origin Data
        const airportOriginData = await fetch(`https://airportdb.io/api/v1/airport/${sbData.origin.icao_code}?apiToken=${airportDBkey}`);

        if (!airportOriginData.ok) {
            throw new Error(`AirportDB.io error! Status: ${airportOriginData.status}`);
        }

        const airportDbOriginData = await  airportOriginData.json();
        console.log(airportDbOriginData);

        //Fetch AirportDB.io Dest Data
        const airportDestData = await fetch(`https://airportdb.io/api/v1/airport/${sbData.destination.icao_code}?apiToken=${airportDBkey}`);

        if (!airportDestData.ok) {
            throw new Error(`AirportDB.io error! Status: ${airportDestData.status}`);
        }

        const airportDbDestData = await  airportDestData.json();
        console.log(airportDbDestData);

        const checklistDataResponse = await fetch(`${checkListJson}`);

        if (!checklistDataResponse.ok) {
            throw new Error(`Local JSON Error!: ${checklistDataResponse.status}`);
        }

        const checklistData = await checklistDataResponse.json();

        //return API Data
        return { sbData, airportDbOriginData, airportDbDestData, checklistData };

    } catch (error) {
        console.error('Fetch error:', error);
        alert(error.message);
    }
}

function createFlightOverviewHeader(data) {
    
    const firstTabContent = document.querySelector('.tab-content');

    removeExistingOverviewHeader();
    
    //Create Variables from Simbrief Data
    const flightOverviewDiv = document.createElement('div');
    const flightOverviewDiv2 = document.createElement('div');
    const originCode = data.origin.icao_code;
    const destCode = data.destination.icao_code;
    const originName = capitalizeWords(data.origin.name);
    const destname = capitalizeWords(data.destination.name);
    const routeDist = Number(data.general.route_distance).toLocaleString();
    const flightTime = formatFlightTime(data.times.est_time_enroute);
    console.log(`${originCode} ${originName} ${destCode} ${destname} ${routeDist} ${flightTime}`);

    localStorage.removeItem('flightOverviewHeader1');
    localStorage.removeItem('flightOverviewHeader2');

    //Create Origin and Destination Header
    flightOverviewDiv.textContent = `${originCode} (${originName}) to ${destCode} (${destname})`
    flightOverviewDiv.classList.add('overview-header-simbrief');
    flightOverviewDiv.id = 'flight-overview-header1';
    firstTabContent.appendChild(flightOverviewDiv);

    //Create Distance and Flight Time Header
    flightOverviewDiv2.textContent = `Distance: ${routeDist}nm      Flight Time: ${flightTime}`;
    flightOverviewDiv2.classList.add('overview-header-simbrief');
    flightOverviewDiv2.id = 'flight-overview-header2';
    firstTabContent.appendChild(flightOverviewDiv2);

    //Save the content to local storage
    localStorage.setItem('flightOverviewHeader1', flightOverviewDiv.textContent);
    localStorage.setItem('flightOverviewHeader2', flightOverviewDiv2.textContent);

}

function buildCheckList(simBrief, originAirport, destAirport, checklistItems, simOriginWeather, simDestWeather){
    //Clear Old Checklist Data First
    const checklistContainer = document.getElementById('checklist-sections-container');
    
    if (checklistContainer){
        clearContainer(checklistContainer);
    }

    //Sort the checklist items into sections and the proper order
    const sortedChecklist = sortChecklistSections(checklistItems); 

    //Create Variables from the API Data based on checklist needs
    const apiVariables = createDynamicVariables(simBrief, originAirport, destAirport, simOriginWeather, simDestWeather); 

    //Append the api variables to the  checklist items where needed
    const sortedSelectionWithAPI = appendApiDataToChecklistItems(sortedChecklist, apiVariables);

    //Create Checklist Sections
    createChecklistSections(sortedSelectionWithAPI);

    //Create Checklist Items
    addChecklistItemsToSections(sortedSelectionWithAPI);

    //Craete Section SubTexts
    updateSubtextForSection(simBrief, simOriginWeather, simDestWeather);

    console.log("Sorted Sections:", sortedSelectionWithAPI);

}

function sortChecklistSections(checklistItems) {
    const sections = {};
    for (const [itemName, details] of Object.entries(checklistItems)) {
        const section = details['section'];
        if (!sections[section]) {
            sections[section] = {
                name: section,
                items: [],
                sectionNumber: details['section number']
            };
        }
        sections[section].items.push(Object.assign({itemName: itemName}, details));
    }

    const sortedSections = Object.values(sections)
                                  .sort((a, b) => Number(a.sectionNumber) - Number(b.sectionNumber));
    
    sortedSections.forEach(section => {
        section.items.sort((a, b) => a['order in section'] - b['order in section']);
    });

    return sortedSections;
}

function createDynamicVariables(simBrief, originAirport, destAirport, simOriginWeather, simDestWeather){
    const dynamicVariables = {
        sbFuel: simBrief.fuel.plan_ramp, // Planned Fuel
        sbZfw: Math.round((simBrief.weights.est_zfw / 1000) * 10) / 10, // Rounded estZFW
        sbRoute: simBrief.origin.icao_code + simBrief.destination.icao_code, // Route
        sbFlightNo: simBrief.atc.callsign, // Flight Number
        sbCi: simBrief.general.costindex, // Cost Index
        sbReserve: ((Number(simBrief.fuel.alternate_burn) + Number(simBrief.fuel.reserve)) / 1000).toFixed(1), // Fuel Reserve
        sbCrzAlt: `FL${Number(simBrief.general.initial_altitude) / 100}`, // Cruise Altitude
        sbCrzWind: `${simBrief.general.avg_wind_dir}/${simBrief.general.avg_wind_spd}`, // Cruise Wind
        sbTransAlt: simBrief.origin.trans_alt, // Transition Altitude
        sbPressAlt: `${simBrief.general.initial_altitude}/${Math.round(simBrief.destination.elevation / 50) * 50}`, // Pressure Altitude
        sbMcpAlt: `set cleared (${simBrief.general.initial_altitude})`, // MCP Altitude
        sbMcpHdg: originAirport.navaids && originAirport.navaids[0] ? convertTrueHeadingToMagnetic(findRunwayHeading(originAirport, simBrief.origin.plan_rwy), originAirport.navaids[0].magnetic_variation_deg) : 
        null, // MCP Heading
        sbLocalBaro: simOriginWeather ? `${parseFloat(simOriginWeather.barometer.hg).toFixed(2)}/${parseFloat(simOriginWeather.barometer.mb).toFixed(0)}` : null, 
        sbOrigin10kAgl: Math.floor((Number(simBrief.origin.elevation) + 10000) / 1000) * 1000, // Origin 10K AGL
        sbTransAltFl: `FL${convertFlightLevel(simBrief.origin.trans_alt)}`, // Transition Altitude Flight Level
        sbDestTransLevel: `FL${convertFlightLevel(simBrief.destination.trans_level)}`, // Destination Transition Level
        sbDestBaro: simDestWeather ? `${parseFloat(simDestWeather.barometer.hg).toFixed(2)}/${parseFloat(simDestWeather.barometer.mb).toFixed(0)}` : null, 
        sbDest10kAgl: Math.floor((Number(simBrief.destination.elevation) + 10000) / 1000) * 1000 // Destination 10K AGL
    };

    for (const key in dynamicVariables) {
        console.log(`${key}: ${dynamicVariables[key]}`);
    }

    return dynamicVariables;

}

function appendApiDataToChecklistItems(sortedSections, apiVariables) {
    sortedSections.forEach(section => {
        section.items.forEach(item => {
            if (item.hasAPIData === 'TRUE' && item['api variable'] && apiVariables[item['api variable']]) {
                item.apiData = apiVariables[item['api variable']];
            }
        });
    });
    return sortedSections; // Return the updated array
}

function createChecklistSections(sortedSections) {

    const sectionsContainer = document.getElementById('checklist-sections-container');

    // Create the hidden div for reset buttons
    const resetButtonsDiv = document.createElement('div');
    resetButtonsDiv.className = 'reset-buttons';
    resetButtonsDiv.id = 'reset-buttons-section';
    resetButtonsDiv.style.display = 'none'; // Initially hidden
    sectionsContainer.appendChild(resetButtonsDiv);

    // Create a reset button for each section
    sortedSections.forEach(section => {
        const resetButton = document.createElement('button');
        resetButton.className = 'section-master-reset-button';
        resetButton.id = `${section.name.replace(/\s+/g, '-')}-master-reset-button`; // Dynamic ID based on section name
        resetButton.textContent = `${section.name}`; // Text can be adjusted as needed
        resetButton.style.display = 'none'; // Initially invisible

        resetButtonsDiv.appendChild(resetButton);
    });

    // Append the hidden div to the checklist container
    sectionsContainer.appendChild(resetButtonsDiv);

     // Create the weather container
     const weatherContainer = document.createElement('div');
     weatherContainer.id = 'weather-container';
     weatherContainer.className = 'weather-container';
 
     // Create origin weather section
     const originWeatherSection = document.createElement('div');
     originWeatherSection.id = 'origin-weather-section';
     originWeatherSection.className = 'weather-section';
     weatherContainer.appendChild(originWeatherSection);
 
     // Create destination weather section
     const destinationWeatherSection = document.createElement('div');
     destinationWeatherSection.id = 'destination-weather-section';
     destinationWeatherSection.className = 'weather-section';
     weatherContainer.appendChild(destinationWeatherSection);
 
     // Append the weather container to the sections container
     sectionsContainer.appendChild(weatherContainer);

    // Iterate over each section and create its corresponding DOM elements
    sortedSections.forEach(section => {
        // Create a section div
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('checklist-section');
        sectionDiv.id = `${section.name.replace(/\s+/g, '-')}-section`;

        // Create a section header
        const sectionHeaderDiv = document.createElement('div');
        sectionHeaderDiv.classList.add('section-header');

        // Create a span for the title
        const titleSpan = document.createElement('span');
        titleSpan.textContent = section.name;
        sectionHeaderDiv.appendChild(titleSpan);

        //Creat a reset button div
        const sectionDivResetButton = document.createElement('div');
        sectionDivResetButton.classList.add('section-header-reset-buttons');

        // Create a reset button
        const resetButton = document.createElement('button');
        resetButton.classList.add('section-reset-button');
        resetButton.id = `${section.name.replace(/\s+/g, '-')}-reset-button`;
        resetButton.textContent = 'Reset';
        sectionDivResetButton.appendChild(resetButton);

        //Creat a reset button div
        const sectionDivCheckAllButton = document.createElement('div');
        sectionDivCheckAllButton.classList.add('section-header-checkall-button');

        // Create a check all button
        const checkAllButton = document.createElement('button');
        checkAllButton.classList.add('section-checkall-button');
        checkAllButton.id = `${section.name.replace(/\s+/g, '-')}-checkall-button`;
        checkAllButton.textContent = `✔  ✔  ✔`;
        sectionDivCheckAllButton.appendChild(checkAllButton);

        // Create an initially invisible div for subtext
        const subtextDiv = document.createElement('div');
        subtextDiv.classList.add('section-header-subtext');
        subtextDiv.id = `${section.name.replace(/\s+/g, '-')}-header-subtext`;
        subtextDiv.style.display = 'none';

        // Append the header and subtext div to the section div
        sectionDiv.appendChild(sectionHeaderDiv);
        sectionDiv.appendChild(sectionDivResetButton);
        sectionDiv.appendChild(sectionDivCheckAllButton);
        sectionDiv.appendChild(subtextDiv);

        // Append the section div to the sections container
        sectionsContainer.appendChild(sectionDiv);
    });
}

function addChecklistItemsToSections(sortedSelectionWithAPI) {
    sortedSelectionWithAPI.forEach(section => {
        // Find the corresponding section container in the DOM
        const sectionDiv = document.getElementById(`${section.name.replace(/\s+/g, '-')}-section`);

        // Check if the section container exists
        if (sectionDiv) {

            sectionDiv.setAttribute('data-checked-count', '0');

            section.items.forEach(item => {
                // Create a div or any other element for the checklist item
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('checklist-item');

                // Determine the text to use for 'expect' based on whether apiData is available
                const expectText = item.apiData != null ? item.apiData : item.expect;

                // Set the content of the item
                itemDiv.textContent = createDottedLine(item.item, expectText);

                // Append the item to the section container
                sectionDiv.appendChild(itemDiv);
            });

            const sectionDivCheckAllButton = sectionDiv.querySelector('.section-header-checkall-button');
            
            if (sectionDivCheckAllButton) {
                sectionDiv.appendChild(sectionDivCheckAllButton);
            }
        } else {
            console.error(`Section container not found for ${section.name}`);
        }
    }) 
};

function loadPersistedData() {
    const firstTabContent = document.querySelector('.tab-content');
    const originDestOverview = localStorage.getItem('flightOverviewHeader1');
    const fltDistAndTime = localStorage.getItem('flightOverviewHeader2');

    if (originDestOverview && fltDistAndTime) {
        const flightOverviewDiv1 = document.createElement('div');
        flightOverviewDiv1.textContent = originDestOverview;
        flightOverviewDiv1.id = 'flight-overview-header1';
        flightOverviewDiv1.classList.add('overview-header-simbrief');
        firstTabContent.appendChild(flightOverviewDiv1);

        const flightOverviewDiv2 = document.createElement('div');
        flightOverviewDiv2.textContent = fltDistAndTime;
        flightOverviewDiv2.id = 'flight-overview-header2';
        flightOverviewDiv2.classList.add('overview-header-simbrief');
        firstTabContent.appendChild(flightOverviewDiv2);
    }
}

function findRunwayHeading(data, originRwy) {
    const runway = data.runways.find(r => r.le_ident === originRwy || r.he_ident === originRwy);

    if (runway) {
        let heading;
        if (runway.le_ident === originRwy) {
            heading = parseFloat(runway.le_heading_degT); // Convert to a number in case it's a string
        } else if (runway.he_ident === originRwy) {
            heading = parseFloat(runway.he_heading_degT); // Convert to a number in case it's a string
        }

        if (heading !== undefined) {
            return Math.round(heading); // Round to nearest whole number
        }
    }

    console.log('Runway not found');
    return null; // or handle this case as you see fit
}

function convertTrueHeadingToMagnetic(TH, magneticDeclination) {
    let MH = TH - magneticDeclination;
    MH = (MH + 360) % 360; // Normalize the heading to be within 0-360 degrees

    return Math.round(MH); // Round to nearest whole number
}

function convertFlightLevel(number) {
    // Convert the number to a string
    const numberString = number.toString();

    // Extract the first three digits
    let formattedNumber = numberString.length > 3 ? numberString.substring(0, 3) : numberString.padStart(3, '0');

    return formattedNumber;
}

function createUserInputForm(secondTabContent, placeholder, localId) {

    const inputField = document.createElement('input');
    inputField.setAttribute('type', 'text');
    inputField.setAttribute('name', 'userInput');
    inputField.id = localId;
    inputField.classList.add('user-input');
    inputField.setAttribute('placeholder', `${placeholder}`);

    inputSavedIds(inputField, localId);

    inputField.addEventListener('input', () => {
        localStorage.setItem(localId, inputField.value);
    });

    secondTabContent.appendChild(inputField);
}

function formatFlightTime(flightTime) {
    let hours = Math.floor(flightTime / 3600);
    let minutes = Math.floor((flightTime % 3600) / 60);

    // Format the hours and minutes with leading zeros if needed
    hours = hours.toString().padStart(2, '0');
    minutes = minutes.toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

function capitalizeWords(str) {
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

function clearContainer(container) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function createDottedLine(item, itemExpect, totalLength = 40) {
    const itemText = item.toString();
    const expectText = itemExpect.toString();

    const numDots = totalLength - itemText.length - expectText.length;
    const dots = '.'.repeat(Math.max(numDots, 0)); // Ensure numDots is not negative

    return `${itemText}${dots}${expectText}`;
}

function updateSubtextForSection(simBrief, simOriginWeather, simDestWeather) {
    
    //For each specialized header sub text
    //const subtextElement = document.querySelector('#preflight-header-subtext');
    //subtextElement.textContent = `At ${simOriginWeather.icao}: Wind ${simOriginWeather.wind.degrees}°/${simOriginWeather.wind.speed_kts}kts - Temp ${simOriginWeather.temperature.celsius} - Visibilty ${simOriginWeather.visibility.miles}SM - Altimeter ${parseFloat(simOriginWeather.barometer.hg).toFixed(2)}/${parseFloat(simOriginWeather.barometer.mb).toFixed(0)}`;
    //subtextElement.style.display = 'block';
    
    const subtextElement2 = document.querySelector(`#fmc-set-up-header-subtext`);
    subtextElement2.textContent = `${simBrief.origin.icao_code}/${simBrief.origin.plan_rwy} ${simBrief.general.route} ${simBrief.destination.icao_code}/${simBrief.destination.plan_rwy}`;
    subtextElement2.style.display = 'block'; // Make the div visible

    const subtextElement3 = document.querySelector('#before-descent-header-subtext');
    subtextElement3.textContent = `Expected Runway is ${simBrief.destination.plan_rwy}`;
    subtextElement3.style.display = 'block'; //Make the div visible

    //const subtextElement4 = document.querySelector('#descent-header-subtext');
    //subtextElement4.textContent = `At ${safeText(simDestWeather.icao)}: Wind ${safeText(simDestWeather.wind.degrees, '°')}/${safeText(simDestWeather.wind.speed_kts, 'kts')} - Temp ${safeText(simDestWeather.temperature.celsius)} - Visibility ${safeText(simDestWeather.visibility.miles, 'SM')} - Altimeter ${safeText(parseFloat(simDestWeather.barometer.hg).toFixed(2))}/${safeText(parseFloat(simOriginWeather.barometer.mb).toFixed(0))}`;
    //subtextElement4.style.display = 'block';
    
}

function inputSavedIds(inputField, localId){
    const storedValue = localStorage.getItem(localId); //Pull localID reference
    if (storedValue) {
        inputField.value = storedValue; //Enter pulled data into value field
    }
}

function setupIframeListner(){

    //If message received parase it.
    window.addEventListener('message', function(event) {
        console.log('Message received from Parent:', event.data);
        processParentMessage(event.data);
        });

};

function processParentMessage(message){
    const parts = message.split(',');

    if (parts.length > 0) {
        const command = parts[0];

    switch(command) {
        case 'Ids':
            addToLocalStorage('simBriefIdLocal', parts[1]);
            inputSavedIds(document.getElementById('simBriefIdLocal'), 'simBriefIdLocal');
            addToLocalStorage('airportIoApiLocal', parts[2]);
            inputSavedIds(document.getElementById('airportIoApiLocal'), 'airportIoApiLocal');
        break;

        case 'weather':
            const weatherData = parts.slice(1);
            const weatherEvent = new CustomEvent('weatherDataReceived', {detail: weatherData});
            document.dispatchEvent(weatherEvent);
        break;
    }
    };
}

function sendParentMessage(message){
    
        window.parent.postMessage(message, '*');
        console.log(`iFrame Sent: ${message}`);
    
}    

function addToLocalStorage(key, item){
    localStorage.setItem(key, item);
}

function setupShiftZKeyListener() {
    window.addEventListener('keydown', (event) => {
        if (event.shiftKey && event.keyCode === 90) { // 90 is the keyCode for 'Z'
            console.log("Shift + Z was pressed");
            sendParentMessage('hotkey,shiftZ');
            event.preventDefault(); // Optional: Prevent the default action for this key
        }
    });
}

function getWeatherFromSim(icao){
    return new Promise((resolve, reject) => {

        sendParentMessage(`weather,${icao}`);

        document.addEventListener('weatherDataReceived', function(event) {
            const weatherArray = event.detail;
            const weatherData = metarParser(weatherArray[0]);
            resolve(weatherData);
        }, {once: true});

    });
}

async function fetchWeatherData(icao) {
    const token = 'tNdLMdEjODhzLl6IubYnF5ekdPtFV_QwhFtBaXEn-vE';
    const url = `https://avwx.rest/api/metar/${icao}?token=${token}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                Authorization: `BEARER ${token}` }
        });

        if (response.status !== 200) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const metarData = await response.json();
        console.log(metarData.raw);
        
        const metar = metarParser(metarData.raw);
        console.log(metar);
        return metar;

    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function isInIframe() {
    return window !== window.parent;
}

function saveChecklistContainer() {
    const checklistContainer = document.getElementById('checklist-sections-container');
    if (checklistContainer) {
        const checklistContent = checklistContainer.innerHTML;
        localStorage.setItem('savedChecklistContent', checklistContent);
    }
}

function restoreChecklistContainer() {
    const checklistContainer = document.getElementById('checklist-sections-container');
    if (!checklistContainer) {
        console.error('checklist-sections-container not found');
        return;
    }

    const savedChecklistContent = localStorage.getItem('savedChecklistContent');
    if (savedChecklistContent) {
        checklistContainer.innerHTML = savedChecklistContent;
    attachEventListenersToChecklistItems();
    attachEventListenersToMasterResetButtons();
    attachEventListenersToSectionResetButtons();
    attachCheckAllEventListeners();
    }
}

function createChecklistContainer(){
    // Identify the element after which the checklist sections will be appended
    const referenceElement = document.getElementById('top-of-page-tab'); // Ensure this exists in your HTML

    // Create a container for all sections
    const sectionsContainer = document.createElement('div');
    sectionsContainer.id = 'checklist-sections-container';

    referenceElement.parentNode.insertBefore(sectionsContainer, referenceElement.nextSibling);
}

function attachEventListenersToChecklistItems() {
    const checklistItems = document.querySelectorAll('.checklist-item');
    checklistItems.forEach(item => {
        item.addEventListener('click', function() {
            this.style.display = 'none'; // Hides the clicked item

            // Get the parent section of the clicked item
            const sectionDiv = this.closest('.checklist-section');

            let checkedItemCount = parseInt(sectionDiv.getAttribute('data-checked-count')) || 0;
            checkedItemCount++;
            sectionDiv.setAttribute('data-checked-count', checkedItemCount.toString());

            if (checkedItemCount === sectionDiv.querySelectorAll('.checklist-item').length) {
                // All items in the section are checked off
                sectionDiv.style.display = 'none'; // Hide the section div

                // Make the reset-buttons-section and corresponding reset button visible
                const resetButtonsSection = document.getElementById('reset-buttons-section');
                resetButtonsSection.style.display = 'grid'; // Show reset-buttons-section

                const baseId = sectionDiv.id.replace('-section', '');
                const resetButtonId = `${baseId}-master-reset-button`;
                const resetButton = document.getElementById(resetButtonId);
                if (resetButton) {
                    resetButton.style.display = 'block'; // Show the corresponding reset button
                }
            }

saveChecklistContainer();

        });
    });
}

function attachEventListenersToSectionResetButtons() {
    const resetButtons = document.querySelectorAll('.section-reset-button');
    resetButtons.forEach(resetButton => {
        resetButton.addEventListener('click', function() {
            // Get the parent section of the reset button
            const sectionDiv = this.closest('.checklist-section');

            // Reset the display style of all checklist items in the section
            const items = sectionDiv.querySelectorAll('.checklist-item');
            items.forEach(item => {
                item.style.display = ''; // Resets the display style, making items visible
            });

// Reset the checked item count attribute
sectionDiv.setAttribute('data-checked-count', '0');

saveChecklistContainer();

        });
    });
}

function attachEventListenersToMasterResetButtons() {
    const masterResetButtons = document.querySelectorAll('.section-master-reset-button');
    masterResetButtons.forEach(resetButton => {
        resetButton.addEventListener('click', function() {
            // Derive sectionDivId from the reset button's ID
            const sectionDivId = this.id.replace('-master-reset-button', '-section');
            const sectionDiv = document.getElementById(sectionDivId);
            
            if (!sectionDiv) {
                console.error('Section div not found for:', sectionDivId);
                return;
            }

            // Show all items in the section
            const items = sectionDiv.querySelectorAll('.checklist-item');
            items.forEach(item => item.style.display = '');

            // Unhide the section div and hide the reset button itself
            sectionDiv.style.display = '';
            this.style.display = 'none';

            // Hide the reset buttons container if no other master reset buttons are visible
            const resetButtonsDiv = document.querySelector('.reset-buttons');
            if (resetButtonsDiv && !document.querySelector('.section-master-reset-button:not([style*="display: none"])')) {
                resetButtonsDiv.style.display = 'none';
            }

            sectionDiv.setAttribute('data-checked-count', '0');

            saveChecklistContainer();
        });
    });
}

function attachEventListenerToResetAllButton(){
    const resetAllButton = document.getElementById('resetAll');
    resetAllButton.addEventListener('click', function() {
        // Clear specific items from local storage
        localStorage.removeItem('flightOverviewHeader1');
        localStorage.removeItem('flightOverviewHeader2');
        localStorage.removeItem('savedChecklistContent');
        
    removeExistingOverviewHeader();

    const checklistContainer = document.getElementById('checklist-sections-container');
    
    if (checklistContainer){
        clearContainer(checklistContainer);
    }

        
    });
}

function removeExistingOverviewHeader(){
    // Assuming 'firstTabContent' is already defined in your scope. If not, you need to define it.
    const firstTabContent = document.querySelector('.tab-content'); // Adjust the selector as necessary

    // Remove existing elements if they exist
    const existingHeader1 = document.getElementById('flight-overview-header1');
    const existingHeader2 = document.getElementById('flight-overview-header2');
    
    if (existingHeader1) {
        firstTabContent.removeChild(existingHeader1);
    }
    if (existingHeader2) {
        firstTabContent.removeChild(existingHeader2);
    }
}

function setupTabViewToggle(){
    const firstTabToggle = document.getElementById('firstTabToggle');
    const secondTabToggle = document.getElementById('secondTabToggle');
    const checklistContainer = document.getElementById('checklist-sections-container'); // Adjust the ID to match your checklist container

    firstTabToggle.addEventListener('change', function() {
        if (this.checked) {
            checklistContainer.style.display = ''; // Show the checklist container
        }
    });

    secondTabToggle.addEventListener('change', function() {
        if (this.checked) {
            checklistContainer.style.display = 'none'; // Hide the checklist container
        }
    });
}

function attachCheckAllEventListeners() {
    const checkAllButtons = document.querySelectorAll('.section-checkall-button');

    checkAllButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get the parent section of the button
            const sectionDiv = this.closest('.checklist-section');

            if (sectionDiv) {
                // Get all checklist items in the section
                const items = sectionDiv.querySelectorAll('.checklist-item');
                
                // Hide each item
                items.forEach(item => {
                    item.style.display = 'none';
                });

                // Set the data-checked-count attribute to the number of items
                sectionDiv.setAttribute('data-checked-count', items.length.toString());

                // Hide the section div
                sectionDiv.style.display = 'none'; 

                // Make the reset-buttons-section and corresponding reset button visible
                const resetButtonsSection = document.getElementById('reset-buttons-section');
                resetButtonsSection.style.display = 'grid'; // Show reset-buttons-section

                const baseId = sectionDiv.id.replace('-section', '');
                const resetButtonId = `${baseId}-master-reset-button`;
                const resetButton = document.getElementById(resetButtonId);
                if (resetButton) {
                    resetButton.style.display = 'block'; // Show the corresponding reset button
                }

                saveChecklistContainer();
            } else {
                console.error('Checklist section not found for button:', this.id);
            }
        });
    });
}

function safeText(value, suffix = '') {
    return value != null ? value + suffix : '-';
}

function updateWeatherContainers(originWeather, destWeather){
    const originWeatherSection = document.getElementById('origin-weather-section');
    const destinationWeatherSection = document.getElementById('destination-weather-section');

    function createWeatherSpan(text, className) {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        return span;
    }

    originWeatherSection.innerHTML = '';
    destinationWeatherSection.innerHTML = '';

    function appendWeatherData(section, weatherData) {
        if (!weatherData) {
            section.appendChild(createWeatherSpan('Weather data not available', 'weather-data'));
            return;
        }

        // Append each piece of weather data as a span
        section.appendChild(createWeatherSpan(`At ${safeText(weatherData.icao)}`, 'icao'));
        section.appendChild(createWeatherSpan(`Wind: ${safeText(weatherData.wind.degrees, '°')}/${safeText(weatherData.wind.speed_kts, 'kts')}`, 'wind-data'));
        section.appendChild(createWeatherSpan(`Temp: ${safeText(weatherData.temperature.celsius)}°C`, 'temp-data'));
        section.appendChild(createWeatherSpan(`Vis: ${safeText(weatherData.visibility.miles, ' miles')}`, 'visibility-data'));
        section.appendChild(createWeatherSpan(`Baro: ${safeText(parseFloat(weatherData.barometer.hg).toFixed(2))}`, 'altimeter-data'));
    }

    appendWeatherData(originWeatherSection, originWeather);
    appendWeatherData(destinationWeatherSection, destWeather);
}