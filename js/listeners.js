//Settings Inputs
function setupUserInputListeners() {
    const userInputContainer = document.getElementById('settings-user-input-container');
    const userInputs = userInputContainer.querySelectorAll('input[type="text"]');

    userInputs.forEach(input => {
        input.addEventListener('change', function() {
            // Store the input value in localStorage under the key of input's id
            localStorage.setItem(input.id, input.value);
        });
    });
}

//Checkboxes - Aircraft
function setupAircraftCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.aircraft-checkbox');
    const checklistDivs = document.querySelectorAll('.aircraft-checklist-container');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            
            // Uncheck all .aircraft-checklist checkboxes
            const checklistCheckboxes = document.querySelectorAll('.aircraft-checklist');
            checklistCheckboxes.forEach(chk => {
                chk.checked = false;
            });
            
            // Count the number of checked checkboxes
            const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

            // If it's the only checkbox checked, prevent it from being unchecked
            if (checkedCount === 0) {
                this.checked = true;
                return;
            }

            // Uncheck all other checkboxes and hide their corresponding divs
            checkboxes.forEach(cb => {
                if (cb.id !== this.id) {
                    cb.checked = false;
                    const checklistDiv = document.getElementById(cb.id + '-checklist-container');
                    if (checklistDiv) {
                        checklistDiv.style.display = 'none';
                    }
                }
            });

            // Update localStorage with the ID of the checked checkbox
            localStorage.setItem('aircraftSelected', this.id);

            // Show the corresponding checklist div for the checked checkbox
            const checklistDivId = this.id + '-checklist-container';
            const checklistDiv = document.getElementById(checklistDivId);
            if (checklistDiv) {
                checklistDiv.style.display = 'flex'; // Show the checklist div
                const firstCheckbox = checklistDiv.querySelector('.aircraft-checklist');
                 if (firstCheckbox && !firstCheckbox.checked) {
                     firstCheckbox.checked = true;
                     firstCheckbox.dispatchEvent(new Event('change')); // Trigger the change event
                 }
            }

        });
    });
}

//Checkboxes - Checklists
function setupAircraftChecklistCheckboxListeners() {
    const checklistContainers = document.querySelectorAll('.aircraft-checklist-container');

    checklistContainers.forEach(container => {
        const checkboxes = container.querySelectorAll('.aircraft-checklist');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Count the number of checked checkboxes within this container
                const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

                if (checkedCount === 0) {
                    // If it's the only checkbox checked, prevent it from being unchecked
                    this.checked = true;
                    return;
                }

                // Uncheck all other checkboxes within the same container
                checkboxes.forEach(cb => {
                    if (cb !== this) {
                        cb.checked = false;
                    }
                });

                // Update localStorage with the ID of the checked checkbox
                localStorage.setItem('aircraftSelectedChecklist', this.id);
                localStorage.setItem('aircraftSelectedChecklistFileName', this.getAttribute('data-file-name'));
                localStorage.setItem('aircraftSelectedChecklistAuthor', this.getAttribute('author'));

                //Create Header based on change
                updateCheckGuideTitle();
            });
        });
    });
}

//Checkboxes - Reset Function
function setupSecondaryCheckboxListeners() {
    // Select all checkboxes with the specified classes
    const checkboxes = document.querySelectorAll('.aircraft-checkbox, .aircraft-checklist');
    console.log(`Found ${checkboxes.length} checkboxes`);

    // Add a change event listener to each checkbox
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', resetPage);
    });
}

//Radio Buttons - Main Header
function setupRadioButtonListeners() {
    const checkguideRadio = document.getElementById('checkguide-radio')
    const aircraftRadio = document.getElementById('aircraft-radio');
    const settingsRadio = document.getElementById('settings-radio');

    checkguideRadio.addEventListener('change', () => toggleChecklistDisplay(aircraftRadio, settingsRadio));
    aircraftRadio.addEventListener('change', () => toggleChecklistDisplay(aircraftRadio, settingsRadio));
    settingsRadio.addEventListener('change', () => toggleChecklistDisplay(aircraftRadio, settingsRadio));

    function toggleChecklistDisplay(radio1, radio2){
        const checklistContainer = document.getElementById('checklist-sections-container');
        
        if (radio1.checked || radio2.checked) {
            checklistContainer.style.display = 'none';
        } else {
            checklistContainer.style.display = 'block';
        }
    }
}

//Checklist Items
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

    savePageData();

        });
    });
}

//Reset - Checklist Section
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

savePageData();

        });
    });
}

//Reset ALL
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

            savePageData();
        });
    });
}

//Check  All
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

                savePageData();
            } else {
                console.error('Checklist section not found for button:', this.id);
            }
        });
    });
}

//Update Wx Button
function attachEventListenterToWxButton() {
    const weatherUpdateButton = document.getElementById('wx-update-button');
    if (!weatherUpdateButton) return; // Check if the button exists
  
    weatherUpdateButton.addEventListener('click', async function() {
        const originIcao = localStorage.getItem('originIcao');
        const destIcao = localStorage.getItem('destIcao');
        const weatherAPI = localStorage.getItem('wxApiKeyLocal');
        
        if (!originIcao || !destIcao) {
            const errorDiv = document.getElementById('error-checkguide-header')
                errorDiv.textContent = 'No Airports for Weather Update'
                errorDiv.style.display = 'block'
            return; // Exit the function if either value is missing
        }

        if(!isInIframe()){
            if (!weatherAPI) {
                const errorDiv = document.getElementById('error-checkguide-header')
                    errorDiv.textContent = 'No WxAPI Key to Update Weather'
                    errorDiv.style.display = 'block'
                return; // Exit the function
            }
        }

        let OriginWeather;
        let DestWeather;
        let weatherSource;

        const errorDiv = document.getElementById('error-checkguide-header')
        errorDiv.textContent = `Retrieving Weather...`;
        errorDiv.style.display = 'block'
        
        if (isInIframe()) {
            weatherSource = 'Sim';
            OriginWeather = await getWeatherFromSim(originIcao);
            DestWeather = await getWeatherFromSim(destIcao);
        }else{
            weatherSource = 'API';
            OriginWeather = await getApiWeatherData(originIcao, weatherAPI);
            DestWeather = await getApiWeatherData(destIcao, weatherAPI);
        }

        updateWeatherContainers(OriginWeather, DestWeather);
        updateWeatherChecklistItems(OriginWeather, DestWeather);

        //Display Updated Weather Message
        if (weatherSource === 'Sim') {
            const errorDiv = document.getElementById('error-checkguide-header')
            const dateTime = getCurrentDateTime();
            errorDiv.textContent = `Weather Updated from MSFS ${dateTime}`;
            errorDiv.style.display = 'block'
        }else{
            const errorDiv = document.getElementById('error-checkguide-header')
            const dateTime = getCurrentDateTime();
            errorDiv.textContent = `Weather Updated from AVWXI ${dateTime}`
            errorDiv.style.display = 'block'
        }
    });
  }

//No Flight Plan Button
function noFlightPlanButtonListener() {
    const nfpButton = document.getElementById('no-flight-plan');
    if (!nfpButton) return;

    // Update localStorage based on the current state of the button
    //localStorage.setItem('no-flight-plan', nfpButton.checked.toString());

    nfpButton.addEventListener('change', function() {
        // Update localStorage whenever the button state changes
        localStorage.setItem('no-flight-plan', this.checked.toString());
        sendParentMessage(`nfpStatus,${this.checked.toString()}`);
        resetPage();
    });
}


//J Key For Checklist Check Item
function setupChecklistKeyListener() {
    document.addEventListener('keydown', (event) => {
        const shortcutKeyCode = 74; // keyCode for 'J'

        if (event.keyCode === shortcutKeyCode) {
            event.preventDefault();
            triggerNextChecklistItem();
        }
    });
}

//Color Pallette Switch
function colorPalletteSwitchListener() {
    const colorPaletteSwitch = document.getElementById('color1');
    colorPaletteSwitch.addEventListener('change', function() {
        toggleColorPalette(this.checked);
        sendParentMessage(`color,${this.checked.toString()}`);
    });
}

//Font Switch
function fontSwitchListener() {
    const fontSwitch = document.getElementById('font2');
    fontSwitch.addEventListener('change', function() {
        toggleFontStyle(this.checked);
        sendParentMessage(`font,${this.checked.toString()}`);
    });
}

//Background Switch
function backgroundSwitchListener(){
    const backgroundSwitch = document.getElementById('background');
    backgroundSwitch.addEventListener('change', function() {
        toggleBackground(this.checked);
        sendParentMessage(`background,${this.checked.toString()}`);
    });
}