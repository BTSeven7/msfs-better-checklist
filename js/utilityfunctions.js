function restoreUserDataLocalStorage() {
    // Array of localStorage keys for input elements
    const inputKeys = ['simBriefIdLocal', 'wxApiKeyLocal', 'airportIoApiLocal'];

    // Restore values for input elements
    inputKeys.forEach(key => {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            const inputElement = document.getElementById(key);
            if (inputElement && inputElement.tagName === 'INPUT') {
                inputElement.value = storedValue;
            }
        }
    });

    // Array of localStorage keys for checkbox elements
    const checkboxKeys = ['aircraftSelected','aircraftSelectedChecklist'];

    // Restore checked state for checkboxes
    checkboxKeys.forEach(key => {
        const checkboxId = localStorage.getItem(key);
        if (checkboxId) {
            const checkboxElement = document.getElementById(checkboxId);
            if (checkboxElement && checkboxElement.type === 'checkbox') {
                checkboxElement.checked = true;

                // Make the container of the checkbox visible
                // Navigate two levels up to reach the 'aircraft-checklist-container'
                let container = checkboxElement.parentElement;
                while (container && !container.classList.contains('aircraft-checklist-container')) {
                    container = container.parentElement;
                }

                if (container) {
                    container.style.display = 'block'; // Make the container visible
                }
            }
        }
    });

    const aircraftSelectedChecklistId = localStorage.getItem('aircraftSelectedChecklist');
    if (aircraftSelectedChecklistId) {
        // Call the specific function here
        updateCheckGuideTitle(); // Replace with the actual function you want to call
    }
}

function restoreChecklistDataLocalStorage(){
    const overviewContainer = document.getElementById('flight-overview-container');
    if (overviewContainer) {
        const storedOverviewContent = localStorage.getItem('flightOverviewContent');
        if (storedOverviewContent) {
            overviewContainer.innerHTML = storedOverviewContent;
            overviewContainer.style.display = 'block';
        }
    }

    const checklstContainer = document.getElementById('checklist-sections-container');
    if (checklstContainer) {
        const storedChecklistContent = localStorage.getItem('checklistContent');
        if (storedChecklistContent) {
            checklstContainer.innerHTML = storedChecklistContent;
            checklstContainer.style.display = 'block';
        }
    }

    attachEventListenersToChecklistItems();
    attachEventListenersToSectionResetButtons();
    attachEventListenersToMasterResetButtons();
    attachCheckAllEventListeners();
    setupChecklistKeyListener();
    preventDoubleClick();
}

function resetPage(){
    // Clear specific items from local storage
    localStorage.removeItem('checklistContent');
    localStorage.removeItem('flightOverviewContent');
    localStorage.removeItem('savedChecklistContent');
    localStorage.removeItem('originIcao');
    localStorage.removeItem('destIcao');

    //Clear Error Box
    document.getElementById('error-checkguide-header').innerHTML = '';
    document.getElementById('error-checkguide-header').style.display = 'none';

    clearCheckListData();

}

function clearCheckListData(){
    
    const flightOverviewContainer = document.getElementById('flight-overview-container');
    const checklistContainer = document.getElementById('checklist-sections-container');

    if (flightOverviewContainer){
        flightOverviewContainer.innerHTML = '';
        flightOverviewContainer.style.display = 'none';
    }

    if (checklistContainer) {
        checklistContainer.innerHTML = '';
        checklistContainer.style.display = 'none';
    }
        
}

function savePageData(){
    
    removeDoubleClickPrevention();
    
    const overviewContainer = document.getElementById('flight-overview-container');
    if (overviewContainer) {
        const overviewContent = overviewContainer.innerHTML;
        localStorage.setItem('flightOverviewContent', overviewContent);
    }

    const checklistContainer = document.getElementById('checklist-sections-container');
    if (checklistContainer) {
        const checklistContent = checklistContainer.innerHTML;
        localStorage.setItem('checklistContent', checklistContent);
    }

}

function capitalizeWords(str) {
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

function formatFlightTime(flightTime) {
    let hours = Math.floor(flightTime / 3600);
    let minutes = Math.floor((flightTime % 3600) / 60);

    // Format the hours and minutes with leading zeros if needed
    hours = hours.toString().padStart(2, '0');
    minutes = minutes.toString().padStart(2, '0');

    return `${hours}:${minutes}`;
}

function convertFlightLevel(number) {
    if (number < 100) {
        return '000';
    }
    let flightLevel = Math.floor(number / 100);
    return flightLevel.toString().padStart(3, '0');
}

function convertTrueHeadingToMagnetic(TH, magneticDeclination) {
    let MH = TH - magneticDeclination;
    MH = (MH + 360) % 360; // Normalize the heading to be within 0-360 degrees

    return Math.round(MH); // Round to nearest whole number
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

function createDottedLine(item, itemExpect, totalLength = 40) {
    const itemText = item.toString();
    const expectText = itemExpect.toString();

    const numDots = totalLength - itemText.length - expectText.length;
    const dots = '.'.repeat(Math.max(numDots, 0)); // Ensure numDots is not negative

    return `<span>${itemText}</span><span>${dots}</span><span>${expectText}</span>`;
}

function preventDoubleClick() {
    var elements = document.querySelectorAll('*'); // Selects all elements on the page

    elements.forEach(function(element) {
        // Check if the event listener has already been added
        if (element.dataset.preventDoubleClickAdded) {
            return; // Skip if the listener is already added
        }

        element.addEventListener('mousedown', function(event) {
            if (event.detail > 1) {
                event.preventDefault();
            }
        }, false);

        // Set a flag to indicate that the listener has been added
        element.dataset.preventDoubleClickAdded = 'true';
    });
}

function removeDoubleClickPrevention() {
    var elements = document.querySelectorAll('*'); // Selects all elements on the page

    elements.forEach(function(element) {
        // Remove the data attribute if it exists
        if (element.dataset.preventDoubleClickAdded) {
            delete element.dataset.preventDoubleClickAdded;
        }
    });
}

function safeText(value, suffix = '') {
    return value != null ? value + suffix : '-';
}

function triggerNextChecklistItem() {
    const items = document.querySelectorAll('.checklist-item');

    const nextItem = Array.from(items).find(
        item => item.style.display !== 'none'
    );

    if (nextItem) {
        // Add hover-effect class
        nextItem.classList.add('hover-effect');
        
        // Remove hover-effect class after a delay and then trigger the click event
        setTimeout(() => {
            nextItem.classList.remove('hover-effect');
            
            // Trigger the click event after removing the hover-effect
            setTimeout(() => {
                nextItem.click();
            }, 25); // Slight delay to visually separate hover effect from the click action
        }, 50);
    }
}