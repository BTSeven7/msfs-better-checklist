async function buildChecklist(){
    
    const simBriefId = document.getElementById('simBriefIdLocal').value;
    const airportIoApiKey = document.getElementById('airportIoApiLocal').value;
    const errorDiv = document.getElementById('error-checkguide-header');
    const noFlightPlanCheckbox = document.getElementById('no-flight-plan');

    //Clear the Checklist Container
    resetPage();

    //If Error Message Displayed Remove Element
    if (errorDiv.style.display !== 'none') {
        errorDiv.style.display = 'none';
    }

    //Check if there is an aircraft or Checklist Selected
    if (!aircraftChecklistValueCheck()){
        return;
    }

    //If in Simulator send ID/API to update data storage
    if (isInIframe()){
        sendParentMessage(`ids,${simBriefId},${airportIoApiKey}`);
        sendParentMessage(`checklist,`)
    }

    //Delcare Data Holder Variables
    let sbData = null;
    let airportDbOriginData = null;
    let airportDbDestData = null;
    let originWeather = null;
    let destWeather = null;
    let apiVariables = null;

    //If No Flight Plan Skip Data Collection
    if (!noFlightPlanCheckbox.checked) {

    //Get SimBrief Data
    if (!simBriefValueCheck(simBriefId)){
        return;
    }else{
        sbData = await getSimBriefData(simBriefId);
    }

    //Get AirportIo Data
    if (airportIoValueCheck(airportIoApiKey)){
        airportDbOriginData = await getAirportIoData(sbData.origin.icao_code, airportIoApiKey);
    }

    //Get Weather Data
    const wxApiKey = document.getElementById('wxApiKeyLocal').value;
    if (isInIframe()){
        // originWeather = await getWeatherFromSim(sbData.origin.icao_code);
        // destWeatherestWeather = await getWeatherFromSim(sbData.destination.icao_code);
    }else if(airportIoValueCheck(wxApiKey)){
        originWeather = await getApiWeatherData(sbData.origin.icao_code, wxApiKey);
        destWeather = await getApiWeatherData(sbData.destination.icao_code, wxApiKey);
    }

    //Add ICAOs to Local Storage
    localStorage.setItem('originIcao',sbData.origin.icao_code);
    localStorage.setItem('destIcao', sbData.destination.icao_code);
    }  //End Data Collection

    //***ADD ERROR CHECK */
    
    //Get Checklist JSON & Sort The Checklist
    const selectedChecklist = getSelectedChecklist();
    console.log(`Checklist is: ${selectedChecklist}`);
    const checklistData = await getChecklistData(selectedChecklist);
    const sortedChecklist = sortChecklistSections(checklistData); //sortChecklist Sections
    
    //Create Overview Header and API Variables - Skip if no flight plan
    if (!noFlightPlanCheckbox.checked) {
        createOverviewHeader(sbData); //Create Overview Header
        apiVariables = createDynamicVariables(sbData, airportDbOriginData, airportDbDestData, originWeather, destWeather) //Create Dynamic Variables
        console.log(apiVariables);
    }
    
    //Append API Data (can be null), Display Checklist Container, Add Items, Update SubText
    let checklistWithApi = null
    console.log('Checkbox State:', noFlightPlanCheckbox.checked);
    if (!noFlightPlanCheckbox.checked) {
        checklistWithApi = appendApiDataToChecklistItems(sortedChecklist, apiVariables); //append API Data
    }else{
        checklistWithApi = sortedChecklist;
    }
    
    //Create Checklist Sections
    createChecklistSections(checklistWithApi); 

    if (!noFlightPlanCheckbox.checked){
        updateWeatherContainers(originWeather, destWeather);
    }
        
    const checkContainer = document.getElementById('checklist-sections-container');
    checkContainer.style.display = 'flex'; //Set Checklist Container visible
    addChecklistItemsToSections(checklistWithApi); //Create Checklist Items
    updateSubtextForSection(sbData, buildUniqueSectionsWithSubtext(checklistData));

    //Attach Event Listeners
    attachEventListenersToChecklistItems();
    attachEventListenersToSectionResetButtons();
    attachEventListenersToMasterResetButtons();
    attachCheckAllEventListeners();
    setupChecklistKeyListener();
    preventDoubleClick();

    //Save Checklist Header
    savePageData();
}

//Data Collection Functions
async function getSimBriefData(simBriefId){
    

    try{
        const simBriefData = await fetchApiData(`https://www.simbrief.com/api/xml.fetcher.php?username=${simBriefId}&json=1`);
        console.log(simBriefData);
        return simBriefData;
        
    } catch (error) {
        const errorDivd = document.getElementById('error-checkguide-header');
        errorDiv.textContent = 'No Flight Plan or Invalid SimBrief ID'
        errorDiv.style.display = 'block'
        console.error('Error fetching SimBrief Data:',error);
    }
}

async function getAirportIoData(originICAO, airportIoApiKey){

    try{
        const airportIoData = await fetchApiData(`https://airportdb.io/api/v1/airport/${originICAO}?apiToken=${airportIoApiKey}`);
        console.log(airportIoData);
        return airportIoData;

    } catch (error) {
        const errorDiv = document.getElementById('error-checkguide-header');
        errorDiv.textContent = 'Invalid AirporIO API Key or Server Error'
        errorDiv.style.display = 'block'
        console.error('Error fetching airportIO Data:',error);
        return null;
    }
}

async function getChecklistData(checklistName){
    try{
        const checklistData = await fetchLocalJson(`./checklists/${checklistName}.json`);
        console.log(checklistData);
        return checklistData;
    
    } catch (error) {
        const errorDiv = document.getElementById('error-checkguide-header');
        errorDiv.textContent = 'No Checklist Found'
        errorDiv.style.display = 'block'
        console.error('Error fetching airportIO Data:',error);
        return null;
    }

}

function getSelectedAicraft(){

}

function getSelectedChecklist(){
    const checkboxes = document.querySelectorAll('.aircraft-checklist');
    let selectedValue = null;

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedValue = checkbox.id; // or checkbox.id or any other attribute you need
            return;
        }
    });

    return selectedValue;
}

//Display Information Functions
function createOverviewHeader(data){
    
    const variables = {
        originIcao: data.origin.icao_code,
        destIcao: data.destination.icao_code,
        originName: capitalizeWords(data.origin.name),
        destName: capitalizeWords(data.destination.name),
        routeDist: Number(data.general.route_distance).toLocaleString(),
        flightTime: formatFlightTime(data.times.est_time_enroute)
    }

    console.log(`${variables.originIcao} ${variables.originName} ${variables.destIcao} ${variables.destName} ${variables.routeDist} ${variables.flightTime}`);
    
    const overview = document.getElementById('flight-overview-container');
    createDOMElement('div', 'overview-header-1', overview, 
                        `${variables.originIcao} (${variables.originName}) to ${variables.destIcao} (${variables.destName})`,'overview-text');
    createDOMElement('div', 'overview-header-2', overview,
                        `Distance: ${variables.routeDist}nm      Flight Time: ${variables.flightTime}`, 'overview-text');
    
    overview.style.display = 'block'
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

                // Generate a unique ID using the item name
                const itemId = 'checklist-item-' + item.itemName.replace(/\s+/g, '-').toLowerCase();
                itemDiv.id = itemId;

                // Determine the text to use for 'expect' based on whether apiData is available
                const expectText = item.apiData != null ? item.apiData : item.expect;

                // Set the content of the item
                itemDiv.innerHTML = createDottedLine(item.item, expectText);

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

function updateSubtextForSection(simBrief, uniqueSectionsWithSubtext) {
    const subTextHeadings = {
        flightPlan: simBrief ? `${simBrief.origin.icao_code}/${simBrief.origin.plan_rwy} `
                            + `${simBrief.general.route} ${simBrief.destination.icao_code}/`
                            + `${simBrief.destination.plan_rwy}` : `No Flight Plan`,
        expectedRwy: simBrief ? `Expected Runway is ${simBrief.destination.plan_rwy}` : null,
        clearance: simBrief ? `Request Clearance to ${simBrief.destination.icao_code}` : `Request Clearance`,
        pushAndStart: `Request Push & Start Clearance`,
        taxiClearance: `Request Taxi`,
        takeOffClearance: `Obtain Takeoff Clearance`
    };

    // Iterate over unique sections and update subtext
    for (const [section, subTextKey] of Object.entries(uniqueSectionsWithSubtext)) {
        const subtext = subTextHeadings[subTextKey];
        if (subtext === null || subtext === undefined) {
            continue; // Skip to the next iteration if subtext is null or undefined
        }

        const subtextElementId = `#${section.replace(/\s+/g, '-')}-header-subtext`; // Replace spaces with hyphens for the ID
        const subtextElement = document.querySelector(subtextElementId);

        if (subtextElement) {
            subtextElement.textContent = subtext;
            subtextElement.style.display = 'block'; // Make the div visible
        }
    }
}

//Prepare Checklist Functions
function sortChecklistSections(checklistItems) {
    const sections = {};
    for (const [itemName, details] of Object.entries(checklistItems)) {
        const section = details['section'];
        if (!sections[section]) {
            sections[section] = {
                name: section,
                items: [],
                sectionNumber: details.sectionNumber
            };
        }
        sections[section].items.push(Object.assign({itemName: itemName}, details));
    }

    const sortedSections = Object.values(sections)
                                  .sort((a, b) => Number(a.sectionNumber) - Number(b.sectionNumber));
    
    sortedSections.forEach(section => {
        section.items.sort((a, b) => a.sectionOrder - b.sectionOrder);
    });

    return sortedSections;
}

function createDynamicVariables(simBrief, originAirport, destAirport, simOriginWeather, simDestWeather){
    const dynamicVariables = {
        //***SimBrief Variables***
        //Fuel
        sbFuel: simBrief.fuel.plan_ramp, 
        //ZFW as 000.0
        sbZfw: Math.round((simBrief.weights.est_zfw / 1000) * 10) / 10,
        //Route as Origin + Dest: ICAOICAO
        sbRoute: simBrief.origin.icao_code + simBrief.destination.icao_code, 
        //FLT Number as AAA000
        sbFlightNo: simBrief.atc.callsign,
        //Cost Index
        sbCi: simBrief.general.costindex,
        // ALT + RES in 0.0 format
        sbReserve: ((Number(simBrief.fuel.alternate_burn) + Number(simBrief.fuel.reserve)) / 1000).toFixed(1), 
        // Cruise ALT FL000
        sbCrzAlt: `FL${Number(simBrief.general.initial_altitude) / 100}`, 
        // Cruise Wind in format 000/00
        sbCrzWind: `${simBrief.general.avg_wind_dir}/${simBrief.general.avg_wind_spd}`, 
        // Transition Altitude of origin airport
        sbTransAlt: simBrief.origin.trans_alt,
        // Pressurization ALT equal Cruise ALT and Destination Altitue
        sbPressAlt: `${simBrief.general.initial_altitude}/${Math.round(simBrief.destination.elevation / 50) * 50}`, 
        // MCP Altitude for no clearned (SET CLEARD (FL000))
        sbMcpAlt: `set cleared (${simBrief.general.initial_altitude})`, 
        // 10ks AGL from Origin for Landing Lights
        sbOrigin10kAgl: Math.floor((Number(simBrief.origin.elevation) + 10000) / 1000) * 1000,
        // Transition ALT for Origin Airport - Set STD @
        sbTransAltFl: `FL${convertFlightLevel(simBrief.origin.trans_alt)}`,
        // Destination Trans Level, set barometer Local
        sbDestTransLevel: `FL${convertFlightLevel(simBrief.destination.trans_level)}`,
        // Destination 10k AGL for Landing Lights on
        sbDest10kAgl: Math.floor((Number(simBrief.destination.elevation) + 10000) / 1000) * 1000, // Destination 10K AGL
        //***AirportDB.io Variables***
        //Calculate RWY Heading by using nearest NAVaid for Magnetic Variation with RWY True Heading
        airportIoMcpHdg: originAirport && originAirport.navaids && originAirport.navaids[0]
            ? convertTrueHeadingToMagnetic(findRunwayHeading(originAirport, simBrief.origin.plan_rwy), originAirport.navaids[0].magnetic_variation_deg) 
            : null,
        //***Weather Variables -- Only if Weather Data Exists will these populate***
        //Wind at Origin Airport as 000/00
        wxOriginWind: simOriginWeather ? `${simOriginWeather.wind.degrees}°/${simOriginWeather.wind.speed_kts}` : null,
        //Baro Presure at Origin airport 00.00/0000 (HG/QNH)
        wxOriginBaro: simOriginWeather ? `${parseFloat(simOriginWeather.barometer.hg).toFixed(2)}/${parseFloat(simOriginWeather.barometer.mb).toFixed(0)}`: null,
        //Baro Pressure at Dest Airport 00.00/0000 (HG/QNG)
        wxDestBaro: simDestWeather ? `${parseFloat(simDestWeather.barometer.hg).toFixed(2)}/${parseFloat(simDestWeather.barometer.mb).toFixed(0)}` : null
    };

    return dynamicVariables;

}

function appendApiDataToChecklistItems(sortedSections, apiVariables) {
    sortedSections.forEach(section => {
        section.items.forEach(item => {
            if (item.hasApiData === 'TRUE' && item.apiVar && apiVariables[item.apiVar]) {
                item.apiData = apiVariables[item.apiVar];
            }
        });
    });
    return sortedSections; // Return the updated array
}

function createChecklistSections(sortedSections) {
    const sectionsContainer = document.getElementById('checklist-sections-container');

    // Create the hidden div for reset buttons
    const resetButtonsDiv = createDOMElement('div', 'reset-buttons-section', sectionsContainer, '', 'reset-buttons');
    resetButtonsDiv.style.display = 'none'; // Initially hidden

    // Create a reset button for each section
    sortedSections.forEach(section => {
        createDOMElement('button', `${section.name.replace(/\s+/g, '-')}-master-reset-button`, resetButtonsDiv, section.name, 'section-master-reset-button').style.display = 'none';
    });

    // Create the weather container
    const weatherContainer = createDOMElement('div', 'weather-container', sectionsContainer, '', 'weather-container');

    // Create origin weather section
    createDOMElement('div', 'origin-weather-section', weatherContainer, '', 'weather-section');

    // Create destination weather section
    createDOMElement('div', 'destination-weather-section', weatherContainer, '', 'weather-section');

    // Iterate over each section and create its corresponding DOM elements
    sortedSections.forEach(section => {
        // Create a section div
        const sectionDiv = createDOMElement('div', `${section.name.replace(/\s+/g, '-')}-section`, sectionsContainer, '', 'checklist-section');

        // Create a section header
        const sectionHeaderDiv = createDOMElement('div', '', sectionDiv, '', 'section-header');

        // Create a span for the title
        createDOMElement('span', '', sectionHeaderDiv, section.name);

        // Create a reset button div
        const sectionDivResetButton = createDOMElement('div', '', sectionDiv, '', 'section-header-reset-buttons');

        // Create a reset button
        createDOMElement('button', `${section.name.replace(/\s+/g, '-')}-reset-button`, sectionDivResetButton, 'Reset', 'section-reset-button');

        // Create a check all button div
        const sectionDivCheckAllButton = createDOMElement('div', '', sectionDiv, '', 'section-header-checkall-button');

        // Create a check all button
        createDOMElement('button', `${section.name.replace(/\s+/g, '-')}-checkall-button`, sectionDivCheckAllButton, 'Check All', 'section-checkall-button');

        // Create an initially invisible div for subtext
        createDOMElement('div', `${section.name.replace(/\s+/g, '-')}-header-subtext`, sectionDiv, '', 'section-header-subtext').style.display = 'none';
    });
}

function buildUniqueSectionsWithSubtext(jsonData) {
    let uniqueSectionsWithSubtext = {};

    // Iterate through the JSON data
    Object.values(jsonData).forEach(item => {
        let section = item.section;
        let sectionSubText = item.sectionSubText;

        // Check if sectionSubText is not 'FALSE' and section is not already in the object
        if (sectionSubText !== 'FALSE' && !(section in uniqueSectionsWithSubtext)) {
            uniqueSectionsWithSubtext[section] = sectionSubText;
        }
    });

    return uniqueSectionsWithSubtext;
}

//Check if Simbrief ID entered
function simBriefValueCheck(simBriefId) {

    if (!simBriefId.trim()) {
        const errorDiv = document.getElementById('error-checkguide-header')
        errorDiv.textContent = 'Please Enter SimBriefID or Select No Flight Plan in Settings'
        errorDiv.style.display = 'block'
        return false;
    }

    return true;

}

function airportIoValueCheck(airportIoApiKey){
    if (!airportIoApiKey.trim()){
        return false;
    }

    return true;

}

function aircraftChecklistValueCheck() {
    const checkboxes = document.querySelectorAll('.aircraft-checklist');
    for (let checkbox of checkboxes) {
        if (checkbox.checked) {
            return true; // At least one checkbox is checked
        }
    }
    const errorDiv = document.getElementById('error-checkguide-header')
        errorDiv.textContent = 'Please Select an Aircraft and Checklist'
        errorDiv.style.display = 'block'
    return false; // No checkboxes are checked
}

