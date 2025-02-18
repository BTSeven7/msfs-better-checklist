document.addEventListener('DOMContentLoaded', async () => {

    if(isInIframe()) {
        setupIframeListner();
        setupHotKeyListener(85); //85 for U - Panel Visibility
        disableKeysListener([35, 36]); //disable 35 'End' & 36 'Home'

        //Check if there are already stored settings
        if(!areLocalStorageKeysSet()){
        const settingsData = await getStoredSettingsFromSim();
        setSimStoredSettings(settingsData);
        };
    }

    const body = document.querySelector('body');

    //Create a Container for the Header
    const headerContainer = createDOMElement('div', 'header-container', body, undefined,'container');
    
    //Create Radio Buttons for Tabs
    createRadioButton(headerContainer,'checkguide-radio','tabs','1','Check Guide','header-radio',true);
    createRadioButton(headerContainer, 'aircraft-radio','tabs','2','Aircraft','header-radio');
    createRadioButton(headerContainer,'settings-radio','tabs','3','Settings','header-radio');

    //Create Containers for each Tab
    const containerCheckguide = createDOMElement('div', 'header-checkguide-container',headerContainer,undefined,'header-tab-container');
    const containerAircraft = createDOMElement('div', 'header-aircraft-container', headerContainer, undefined, 'header-tab-container');
    const containerSettings = createDOMElement('div', 'header-settings-container', headerContainer, undefined, 'header-tab-container');

    //Settings  Tab
    //User Input Container
    const userInputSettingsContainer = createDOMElement('div', 'settings-user-input-container', containerSettings,undefined,'settings-container');
    createUserInput(userInputSettingsContainer,'simBriefIdLocal','Enter SimBrief ID:','settings-text-input');
    setupUserInputListeners();

    const noFlightPlanContainer = createDOMElement('div', 'no-flight-plan-option-container', containerSettings,undefined,'settings-container');
    createSliderCheckbox(noFlightPlanContainer,'no-flight-plan', 'No Flight Plan');
    createSliderCheckbox(noFlightPlanContainer,'vr-scale', 'VR Scale');

    const colorSettingsContainer = createDOMElement('div', 'color-settings-container', containerSettings, undefined,'settings-container');
    createSliderCheckbox(colorSettingsContainer,'color1','Light/Dark');
    createSliderCheckbox(colorSettingsContainer,'font2', 'Alt Font');
    createSliderCheckbox(colorSettingsContainer,'background', 'Background');

    const informationContainer = createDOMElement('div', 'information-settings-container', containerSettings, undefined, 'settings-container');
    informationContainer.innerHTML = `
    <ul>
        <li>Shortcut Keys: 'J' to mark off items and 'U' to toggle the panel's visibility in the simulator.</li>
        
        <li>If you haven't filed a flight plan on SimBrief, select the 'No Flight Plan' option.</li>
        
        <li>When using this as an in-game panel, the weather data is pulled directly from the simulator!</li>

        <li>VR Scale should happen automatically use slider if it does not </li>
    </ul>`;

    //Aicraft Tab
    //Build List of Aircraft
    createDOMElement('div', 'aircraft-list-container',containerAircraft,undefined,'aircraft-container');
    // createDOMElement('div', 'aircraft-checklist-container',containerAircraft,undefined,'checklist-contaier');

    //Create Check Guide Header
    const cgHeader = createDOMElement('div', 'checkguide-title-container',containerCheckguide,undefined,'main-title-header');
    const flightOverviewContent = localStorage.getItem('flightOverviewContent');
    const initialTitle = flightOverviewContent ? localStorage.getItem('aircraftSelected') : 'Welcome to Checkguide';
    createDOMElement('span', 'default-checkguide-header', cgHeader, initialTitle);
    
    //Create DIV for Errors
    const errorDiv = createDOMElement('div','error-checkguide-header',containerCheckguide,'');
    errorDiv.style.display = 'none';

    //Create Main Buttons Container
    const mainButtonContainer  = createDOMElement('div', 'main-button-container',containerCheckguide,undefined,'cg-container');
    createDOMElement('button', 'wx-update-button',mainButtonContainer,'WX Update','main-container-button');
    const flightPlanButton = createDOMElement('button', 'flight-plan-button',mainButtonContainer,'Fetch Flight Plan','main-container-button');
    const resetAllButton = createDOMElement('button','reset-all-button',mainButtonContainer,'Reset All','main-container-button');

    //Create Flight Plan Overview Container
    const flightOverviewContainer = createDOMElement('div', 'flight-overview-container',containerCheckguide,undefined,'cg-container');
    flightOverviewContainer.style.display = 'none';

    //Create Checklist Container
    const checklistContainer = createDOMElement('div', 'checklist-sections-container', body, '','container');
    checklistContainer.style.display = 'none';

    //Fetch aircraft file
    fetchLocalJson('checklists/checklist_directory_new.json')
        .then(data => {
            console.log(data);
            // createAircraftList(data);
            // createAircraftChecklistsList(data);
            createSimplifiedAircraftList(data);
            setupChecklistSelectionListeners();
            // setupAircraftCheckboxListeners();
            // setupAircraftChecklistCheckboxListeners();

            //Restore Data after aircraft list is built
            restoreUserDataLocalStorage();
            restoreChecklistDataLocalStorage();
            setupSecondaryCheckboxListeners();

            //Restore Color and Font Settings
            const colorPaletteSwitch = document.getElementById('color1');
            toggleColorPalette(colorPaletteSwitch.checked);
            const fontSwitch = document.getElementById('font2');
            toggleFontStyle(fontSwitch.checked);
            const backgroundSwitch = document.getElementById('background');
            toggleBackground(backgroundSwitch.checked);

        })
        .catch(error => {
            console.error('Fetching API data failed:', error);
        });

    //Main Button Listeners
    setupRadioButtonListeners();
    attachEventListenterToWxButton();
    flightPlanButton.addEventListener('click',buildChecklist);
    resetAllButton.addEventListener('click',resetPage);

    //Other Listeners
    noFlightPlanButtonListener();
    vrScaleSwitchListener();
    setupChecklistKeyListener(); //Checklist Hot Key, searches for element
    colorPalletteSwitchListener();
    fontSwitchListener();
    backgroundSwitchListener();

})