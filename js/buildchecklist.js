async function buildChecklist(){
    
    const simBriefId = document.getElementById('simBriefIdLocal').value;
    const airportIoApiKey = document.getElementById('airportIoApiLocal').value;
    const errorDiv = document.getElementById('error-checkguide-header');
    const noFlightPlanCheckbox = document.getElementById('no-flight-plan');
    const aircrafId = getSelectedAicraft();
    const checklistId = getSelectedChecklist();

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
        sendParentMessage(`ids,${simBriefId},${airportIoApiKey},${aircrafId},${checklistId}`);
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
        //Display Fetching Flight Plan Message
        const errorDiv = document.getElementById('error-checkguide-header')
        errorDiv.textContent = 'Retrieving SimBrief Flight Plan & Weather...'
        errorDiv.style.display = 'block'

        //Get SimBrief Data
        sbData = await getSimBriefData(simBriefId);
    }

    //Get AirportIo Data
    if (airportIoValueCheck(airportIoApiKey)){
        airportDbOriginData = await getAirportIoData(sbData.origin.icao_code, airportIoApiKey);
    }

    //Get Weather Data
    const wxApiKey = document.getElementById('wxApiKeyLocal').value;
    if (isInIframe()){
        originWeather = await getWeatherFromSim(sbData.origin.icao_code);
        destWeather = await getWeatherFromSim(sbData.destination.icao_code);
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
    const selectedChecklist = localStorage.getItem('aircraftSelectedChecklistFileName');
    console.log(`Checklist is: ${selectedChecklist}`);
    const checklistData = await getChecklistData(selectedChecklist);
    //const sortedChecklist = sortChecklistSections(checklistData); //sortChecklist Sections
    
    //Show No Flight Plan Selected Message
    if (noFlightPlanCheckbox.checked) {
        const errorDiv = document.getElementById('error-checkguide-header')
        errorDiv.textContent = 'Selected No Flight Plan Option'
        errorDiv.style.display = 'block'
    }

    //Create Overview Header and API Variables - Skip if no flight plan
    if (!noFlightPlanCheckbox.checked) {
        createOverviewHeader(sbData); //Create Overview Header
        apiVariables = createDynamicVariables(sbData, airportDbOriginData, airportDbDestData, originWeather, destWeather) //Create Dynamic Variables
        console.log('Calculated apiVariables:', apiVariables);
    }
    
    //Append API Data (can be null), Display Checklist Container, Add Items, Update SubText
    let checklistWithApi = null
    console.log('No Fligh Plan Checkbox State:', noFlightPlanCheckbox.checked);
    if (!noFlightPlanCheckbox.checked) {
        checklistWithApi = appendApiDataToChecklistItems(checklistData, apiVariables); //append API Data
    }else{
        checklistWithApi = checklistData;
    }

    console.log('Checklist with Appended API Data:', checklistWithApi);
    
    //Create Checklist Sections
    createChecklistSections(checklistWithApi); 

    //If 'No Flight Plan' Option is NOT selected, update weather containers
    if (!noFlightPlanCheckbox.checked){
        updateWeatherContainers(originWeather, destWeather);
    }
    
    //Set Checklist Container Visible, Add Checklist Items, Update SubText
    const checkContainer = document.getElementById('checklist-sections-container');
    checkContainer.style.display = 'flex'; //Set Checklist Container visible
    addChecklistItemsToSections(checklistWithApi); //Create Checklist Items
    updateSubtextForSection(checklistWithApi, apiVariables);

    //Attach All Eent Listeners
    attachEventListenersToChecklistItems();
    attachEventListenersToSectionResetButtons();
    attachEventListenersToMasterResetButtons();
    attachCheckAllEventListeners();
    preventDoubleClick();

    //If Error Message Displayed Remove Element
    if (errorDiv.style.display !== 'none') {
        errorDiv.style.display = 'none';
    }

    //Save Checklist Header
    savePageData();
    clearCheckListData();
    restoreChecklistDataLocalStorage();

}

//Data Collection Functions
async function getSimBriefData(simBriefId){
    

    try{
        const simBriefData = await fetchApiData(`https://www.simbrief.com/api/xml.fetcher.php?username=${simBriefId}&json=1`);
        console.log('Fetched Simbrief Data:', simBriefData);
        setSbData(simBriefData);
        return simBriefData;
        
    } catch (error) {
        const errorDiv = document.getElementById('error-checkguide-header');
        errorDiv.textContent = 'No Flight Plan or Invalid SimBrief ID'
        errorDiv.style.display = 'block'
        console.error('Error fetching SimBrief Data:',error);
    }
}

async function getAirportIoData(originICAO, airportIoApiKey){

    try{
        const airportIoData = await fetchApiData(`https://airportdb.io/api/v1/airport/${originICAO}?apiToken=${airportIoApiKey}`);
        console.log('Origin Airport Data:', airportIoData);
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
        console.log('Checklist Data is:', checklistData);
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
    const checkboxes = document.querySelectorAll('.aircraft-checkbox');
    let selectedValue = null;

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedValue = checkbox.id; // or checkbox.id or any other attribute you need
            return;
        }
    });

    return selectedValue;
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

    console.log(`Header Info: ${variables.originIcao} ${variables.originName} ${variables.destIcao} ${variables.destName} ${variables.routeDist} ${variables.flightTime}`);
    
    const overview = document.getElementById('flight-overview-container');
    createDOMElement('div', 'overview-header-1', overview, 
                        `${variables.originIcao} (${variables.originName}) to ${variables.destIcao} (${variables.destName})`,'overview-text');
    createDOMElement('div', 'overview-header-2', overview,
                        `Distance: ${variables.routeDist}nm      Flight Time: ${variables.flightTime}`, 'overview-text');
    
    overview.style.display = 'block'
}

function addChecklistItemsToSections(checklistWithApi) {
    checklistWithApi.Sections.forEach(section => {
        // Find the corresponding section container in the DOM
        const sectionDiv = document.getElementById(`${section.title.replace(/\s+/g, '-')}-section`);

        // Check if the section container exists
        if (sectionDiv) {

            sectionDiv.setAttribute('data-checked-count', '0');

            section.checkItems.forEach(item => {
                // Create a div or any other element for the checklist item
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('checklist-item');

                // Generate a unique ID using the item name
                const itemId = 'checklist-item-' + item.item.replace(/\s+/g, '-').toLowerCase();
                itemDiv.id = itemId;

                // Add the data-wx-updates attribute
                itemDiv.setAttribute('data-wx-updates', item.wxUpdates);

                // If data-wx-updates is true, add the data-wx-apivar attribute
                if (item.wxUpdates) {
                    itemDiv.setAttribute('data-wx-apivar', item.apiVar);
                }

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

function updateSubtextForSection(data, apiVariables) {
    // Iterate over each section
    data.Sections.forEach(section => {
        // Check if subtext is null or undefined
        if (section.subtext === null || section.subtext === undefined) {
            return; // Skip to the next iteration if subtext is null or undefined
        }

        // Initialize subtext with the value of section.subtext
        let subtext = section.subtext;

        // Use a regular expression to find all ${variable} patterns
        const regex = /\$\{(.*?)\}/g;
        let match;
        let allVariablesFound = true;

        while ((match = regex.exec(subtext)) !== null) {
            const variableName = match[1];
            if (apiVariables[variableName]) {
                // Replace the ${variable} with the corresponding value from apiVariables
                subtext = subtext.replace(`\$\{${variableName}\}`, apiVariables[variableName]);
            } else {
                // If any variable is not found, set flag to false
                allVariablesFound = false;
                break;
            }
        }

        // Update section.subtext if all variables were found
        if (allVariablesFound) {
            section.subtext = subtext;
        }

        const subtextElementId = `#${section.title.replace(/\s+/g, '-')}-header-subtext`; // Replace spaces with hyphens for the ID
        const subtextElement = document.querySelector(subtextElementId);

        if (subtextElement) {
            subtextElement.textContent = subtext;
            subtextElement.style.display = 'block'; // Make the div visible
        }
    });
}

//Prepare Checklist Functions
/* function sortChecklistSections(checklistItems) {
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
} */

/*function createDynamicVariables(simBrief, originAirport, destAirport, simOriginWeather, simDestWeather){
    const dynamicVariables = {
        //***SimBrief Variables***
        //Origin ICAO
        sbOriginIcao: simBrief.origin.icao_code,
        //Dest ICAO
        sbDestIcao: simBrief.destination.icao_code,
        //Fuel
        sbFuel: simBrief.fuel.plan_ramp,
        //Fuel Round
        sbFuelRound: Math.round((simBrief.fuel.plan_ramp / 1000) * 10) / 10,
        //ZFW as 000.0
        sbZfw: Math.round((simBrief.weights.est_zfw / 1000) * 10) / 10,
        //Route as Origin + Dest: ICAOICAO
        sbRoute: simBrief.origin.icao_code + simBrief.destination.icao_code, 
        //FLT Number as AAA000
        sbFlightNo: simBrief.atc.callsign,
        //Cost Index
        sbCi: simBrief.general.costindex,
        //Avg Isa
        sbAvgIsa: Number(simBrief.general.avg_temp_dev) >= 0 ? `+${simBrief.general.avg_temp_dev}` : simBrief.general.avg_temp_dev,
        //TOW
        sbTOW: Math.round((simBrief.weights.est_tow / 1000) * 10) / 10,
        //Origin RWY
        sbOriginRwy: simBrief.origin.plan_rwy,
        // ALT + RES in 0.0 format
        sbReserve: ((Number(simBrief.fuel.alternate_burn) + Number(simBrief.fuel.reserve)) / 1000).toFixed(1), 
        // Cruise ALT FL000
        sbCrzAlt: `FL${Number(simBrief.general.initial_altitude) / 100}`, 
        // Cruise Wind in format 000/00
        sbCrzWind: `${simBrief.general.avg_wind_dir}/${simBrief.general.avg_wind_spd}`, 
        // Transition Altitude of origin airport
        sbTransAlt: simBrief.origin.trans_alt,
        // Destination Eleveation
        sbDestElev: `${Math.round(simBrief.destination.elevation / 50) * 50}`,
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
        // Estimated LW
        sbLandWeight: Math.round((simBrief.weights.est_ldw / 1000) * 10) / 10,
        // ALTN Fuel
        sbAltnFuel: (Number(simBrief.fuel.alternate_burn) / 1000).toFixed(1),
        // Reserve Fuel
        sbReserveFuel: (Number(simBrief.fuel.reserve) / 1000).toFixed(1),
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
        wxDestBaro: simDestWeather ? `${parseFloat(simDestWeather.barometer.hg).toFixed(2)}/${parseFloat(simDestWeather.barometer.mb).toFixed(0)}` : null,
        //QNG mb Orign Airport
        wxOriginMbBaro: simOriginWeather ? `${parseFloat(simOriginWeather.barometer.mb).toFixed(0)}`: null,
        //Destination Airport Temperature
        wxDestTemp: simDestWeather ? `${simDestWeather.temperature.celsius}°`: null,
        //Destination Wind
        wxDestWind: simDestWeather ? `${simDestWeather.wind?.degrees ?? 'Error'}°/${simDestWeather.wind?.speed_kts ?? 'Error'}` : null,

        //Special Variables Per Plane 
        maddogEfbPerfOrigin: simOriginWeather ? `${simBrief.origin?.icao_code ?? 'Error'}/${simBrief.origin?.plan_rwy ?? 'Error'}/(${simOriginWeather.wind?.degrees ?? 'Error'}/${simOriginWeather.wind?.speed_kts ?? 'Error'})/${isNaN(simOriginWeather.barometer?.mb) ? 'Error' : parseFloat(simOriginWeather.barometer.mb).toFixed(0)}/${simOriginWeather.temperature?.celsius ?? 'Error'}/${simBrief.weights.est_tow != null ? Math.round((simBrief.weights.est_tow / 1000) * 10) / 10 : 'Error'}` : 'Error',
        maddogEfbPerfDest: simDestWeather ? `${simBrief.destination?.icao_code ?? 'Error'}/${simBrief.destination?.plan_rwy ?? 'Error'}/(${simDestWeather.wind?.degrees ?? 'Error'}/${simDestWeather.wind?.speed_kts ?? 'Error'})/${isNaN(simDestWeather.barometer?.mb) ? 'Error' : parseFloat(simDestWeather.barometer.mb).toFixed(0)}/${simDestWeather.temperature?.celsius ?? 'Error'}/${simBrief.weights.est_ldw != null ? Math.round((simBrief.weights.est_ldw / 1000) * 10) / 10 : 'Error'}` : 'Error',

    };

    //console.log(dynamicVariables);

    return dynamicVariables;

} */

function appendApiDataToChecklistItems(data, apiVariables) {
    // Ensure the Sections property is an array
    if (!Array.isArray(data.Sections)) {
        console.error('Error: Sections is not an array');
        return data;
    }

    data.Sections.forEach(section => {
        // Ensure checkItems is an array before proceeding
        if (!Array.isArray(section.checkItems)) {
            console.error(`Error: checkItems is not an array for section id: ${section.id}`);
            return;
        }

        section.checkItems.forEach(item => {
            if (item.apiVar) {
                // Initialize apiData with the value of apiVar
                let apiData = item.apiVar;
                let allVariablesFound = true;

                // Use a regular expression to find all ${variable} patterns
                const regex = /\$\{(.*?)\}/g;
                let match;
                while ((match = regex.exec(item.apiVar)) !== null) {
                    const variableName = match[1];
                    if (apiVariables[variableName]) {
                        // Replace the ${variable} with the corresponding value from apiVariables
                        apiData = apiData.replace(`\$\{${variableName}\}`, apiVariables[variableName]);
                    } else {
                        // If any variable is not found, set flag to false
                        allVariablesFound = false;
                        break;
                    }
                }

                // If all variables are found, assign the transformed string to apiData
                item.apiData = allVariablesFound ? apiData : null;
            }
        });
    });

    return data; // Return the updated data
}

function createChecklistSections(checklistWithApi) {
    const sectionsContainer = document.getElementById('checklist-sections-container');

    // Create the hidden div for reset buttons
    const resetButtonsDiv = createDOMElement('div', 'reset-buttons-section', sectionsContainer, '', 'reset-buttons');
    resetButtonsDiv.style.display = 'none'; // Initially hidden

    // Create a reset button for each section
    checklistWithApi.Sections.forEach(section => {
        createDOMElement('button', `${section.title.replace(/\s+/g, '-')}-master-reset-button`, resetButtonsDiv, section.title, 'section-master-reset-button').style.display = 'none';
    });

    // Create the weather container
    const weatherContainer = createDOMElement('div', 'weather-container', sectionsContainer, '', 'weather-container');

    // Create origin weather section
    createDOMElement('div', 'origin-weather-section', weatherContainer, '', 'weather-section');

    // Create destination weather section
    createDOMElement('div', 'destination-weather-section', weatherContainer, '', 'weather-section');

    // Iterate over each section and create its corresponding DOM elements
    checklistWithApi.Sections.forEach(section => {
        // Create a section div
        const sectionDiv = createDOMElement('div', `${section.title.replace(/\s+/g, '-')}-section`, sectionsContainer, '', 'checklist-section');

        // Create a section header
        const sectionHeaderDiv = createDOMElement('div', '', sectionDiv, '', 'section-header');

        // Create a span for the title
        createDOMElement('span', '', sectionHeaderDiv, section.title);

        // Create a reset button div
        const sectionDivResetButton = createDOMElement('div', '', sectionDiv, '', 'section-header-reset-buttons');

        // Create a reset button
        createDOMElement('button', `${section.title.replace(/\s+/g, '-')}-reset-button`, sectionDivResetButton, 'Reset', 'section-reset-button');

        // Create a check all button div
        const sectionDivCheckAllButton = createDOMElement('div', '', sectionDiv, '', 'section-header-checkall-button');

        // Create a check all button
        createDOMElement('button', `${section.title.replace(/\s+/g, '-')}-checkall-button`, sectionDivCheckAllButton, 'Check All', 'section-checkall-button');

        // Create an initially invisible div for subtext
        createDOMElement('div', `${section.title.replace(/\s+/g, '-')}-header-subtext`, sectionDiv, '', 'section-header-subtext').style.display = 'none';
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

