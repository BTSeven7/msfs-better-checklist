function createDOMElement(type, id, parentElement, textContent = '', className = '') {
    const element = document.createElement(type);
    if (id) element.id = id;
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    parentElement.appendChild(element);
    return element;
}

function createRadioButton(parentElement, id, name, value, labelText, className = '', isChecked = false) {
    // Create the radio input
    const radioInput = document.createElement('input');
    radioInput.type = 'radio';
    radioInput.id = id;
    radioInput.name = name;
    radioInput.value = value;
    if (className) radioInput.className = className;
    if (isChecked) radioInput.checked = true;

    // Create the label
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;

    // Append the radio input and label to the parent element
    parentElement.appendChild(radioInput);
    parentElement.appendChild(label);
}

function createUserInput(parentElement, id, placeholder = '', className = '', attributes = {}) {
    // Create the input element as a text input
    const userInput = document.createElement('input');
    userInput.type = 'text'; // Type set to 'text' implicitly
    userInput.id = id;
    userInput.placeholder = placeholder; // Placeholder set based on parameter
    if (className) userInput.className = className;

    // Set additional attributes
    for (const [attr, value] of Object.entries(attributes)) {
        userInput.setAttribute(attr, value);
    }

    // Append the input element to the parent element
    parentElement.appendChild(userInput);
}

function createSliderCheckbox(parentElement, checkboxId, labelText, checkboxClass = 'default-checkbox-class') {
    // Create the main label with class 'sliderSwitch'
    const mainLabel = document.createElement('label');
    mainLabel.className = 'sliderSwitch';

    // Create the checkbox input
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = checkboxId;
    checkbox.className = checkboxClass; // Use the class passed as a parameter

    // Create the span with class 'slider-round'
    const sliderSpan = document.createElement('span');
    sliderSpan.className = 'slider-round';

    // Append checkbox and sliderSpan to the main label
    mainLabel.appendChild(checkbox);
    mainLabel.appendChild(sliderSpan);

    // Create the second span for display text
    const textSpan = document.createElement('span');
    textSpan.textContent = labelText;

    // Append the main label and textSpan to the parent element
    parentElement.appendChild(mainLabel);
    parentElement.appendChild(textSpan);
}

function createAircraftList(jsonData) {
    const listContainer = document.getElementById('aircraft-list-container');
    const aircraftData = jsonData.aircraft;

    Object.keys(aircraftData).forEach(aircraftKey => {

        // Create a div for each aircraft using createDOMElement
        const aircraftDiv = createDOMElement('div', `${aircraftKey}-container`, listContainer, '', 'aircraft-container');

        // Create a checkbox for each aircraft using createSliderCheckbox
        createSliderCheckbox(aircraftDiv, aircraftKey, aircraftKey, 'aircraft-checkbox');
    });
}

function createAircraftChecklistsList(jsonData) {
    const listContainer = document.getElementById('aircraft-checklist-container');
    const aircraftData = jsonData.aircraft;

    Object.keys(aircraftData).forEach(aircraftKey => {
        const checklists = aircraftData[aircraftKey]; // This now refers to an array of checklists for the aircraft

        // Create a div for each aircraft using createDOMElement
        const aircraftDiv = createDOMElement('div', `${aircraftKey}-checklist-container`, listContainer, '', 'aircraft-checklist-container');
        aircraftDiv.style.display = 'none';

        // Check if aircraft has checklists
        if (checklists.length > 0) {
            checklists.forEach((checklist, index) => {
                // Create a div for each checklist using createDOMElement
                const checklistDiv = createDOMElement('div', `${aircraftKey}-checklist-${index}-container`, aircraftDiv, '', 'checklist-item-container');    
                
                // ID for the checkbox, replacing spaces with dashes to ensure valid IDs
                const checkboxId = `${aircraftKey}-checklist-${index}-checkbox`.replace(/\s/g, '-');
                
                // Label text for the checkbox, using the author's name and last updated time
                const labelText = `${checklist.author}`;
                createSliderCheckbox(checklistDiv, checkboxId, labelText, 'aircraft-checklist');

                // Select the checkbox element
                const checkbox = document.getElementById(checkboxId);

                // Remove the .json extension from the file name
                const fileNameWithoutExtension = checklist.fileName.replace('.json', '');

                // Append the file name as a new data attribute
                checkbox.setAttribute('data-file-name', fileNameWithoutExtension);
                checkbox.setAttribute('author', checklist.author);
            });
        }
    });
}

function updateCheckGuideTitle() {
    // Retrieve the selected aircraft and checklist from localStorage
    const selectedAircraftId = localStorage.getItem('aircraftSelected');
    const selectedChecklistId = localStorage.getItem('aircraftSelectedChecklist');
    const selectedChecklistAuthor = localStorage.getItem('aircraftSelectedChecklistAuthor');

    // Clear the current contents of the title container
    const titleContainer = document.getElementById('checkguide-title-container');
    titleContainer.innerHTML = '';

    // Append the first span with the aircraft name
    if (selectedAircraftId) {
        const aircraftLabelSpan = selectedAircraftId;
        const aircraftTitleSpan = document.createElement('span');
        aircraftTitleSpan.textContent = aircraftLabelSpan ? aircraftLabelSpan + ' Check Guide' : '';
        titleContainer.appendChild(aircraftTitleSpan);
    }

    // Append the second span with the checklist title
    if (selectedChecklistId) {
        const checklistLabelSpan = selectedChecklistAuthor;
        const checklistTitleSpan = document.createElement('span');
        checklistTitleSpan.textContent = checklistLabelSpan ? 'by ' + checklistLabelSpan : '';
        titleContainer.appendChild(checklistTitleSpan);
    }
}

async function loadAicraft() {
    try {
        const data = await fetchLocalJson('checklists/aircraft.json');
        console.log(data);
        createAircraftList(data);
        createAircraftChecklistsList(data);
        setupAircraftCheckboxListeners();
        setupAircraftChecklistCheckboxListeners();
    } catch (error) {
        console.error('Fetching API data failed:', error);
    }
}

async function fetchApiData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching JSON: ", error);
        throw error;
    }
}

async function fetchLocalJson(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load file: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching local JSON: ", error);
        throw error;
    }
}
