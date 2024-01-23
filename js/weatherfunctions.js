async function getApiWeatherData(icao, weatherApiKey) {
    const token = weatherApiKey;
    const url = `https://avwx.rest/api/metar/${icao}?token=${weatherApiKey}`;

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
        const errorDiv = document.getElementById('error-checkguide-header');
        errorDiv.textContent = 'Invalid AVWX API Key or Server Error'
        errorDiv.style.display = 'block'
        console.error('Error fetching airportIO Data:',error);
        return null;
    }
}

//If 'wx update' true match to variables in this function
async function updateWeatherChecklistItems(simOriginWeather, simDestWeather){
    
    const wxVariables = {
        wxOriginWind: simOriginWeather ? `${simOriginWeather.wind.degrees}°/${simOriginWeather.wind.speed_kts}` : null,
        wxOriginBaro: simOriginWeather ? `${parseFloat(simOriginWeather.barometer.hg).toFixed(2)}/${parseFloat(simOriginWeather.barometer.mb).toFixed(0)}`: null,
        wxDestBaro: simDestWeather ? `${parseFloat(simDestWeather.barometer.hg).toFixed(2)}/${parseFloat(simDestWeather.barometer.mb).toFixed(0)}` : null
        }
    
    // Find the checked .aircraft-checklist checkbox
    const checkedCheckbox = document.querySelector('.aircraft-checklist:checked');
    if (!checkedCheckbox) {
        console.error('No aircraft checklist selected');
        return;
    }
    const checklistId = checkedCheckbox.id;
    const filePath = `./checklists/${checklistId}.json`;


    // Load the JSON file (replace 'path/to/your.json' with the actual file path)
    const response = await fetch(filePath);
    const checklistItems = await response.json();
    
    // Iterate through checklist items
    Object.values(checklistItems).forEach((item, index) => {
        if (item.wxUpdate) {
            const element = document.getElementById(`checklist-item-${index}`);
            if (element) {
                const textBeforeDot = element.textContent.split('.')[0];
                const newWeatherVar = wxVariables[item.apiVar];
                if (newWeatherVar) {
                    const newContent = createDottedLine(textBeforeDot, newWeatherVar);
                    element.innerHTML = newContent;
                    console.log(`NewText for ${index} is ${newContent}`);
                }
            }
        }
    });

}

/******WEATHER CONTAINER FUNCTIONS ********/
function updateWeatherContainers(originWeather, destWeather) {
    const originWeatherSection = document.getElementById('origin-weather-section');
    const destinationWeatherSection = document.getElementById('destination-weather-section');

    originWeatherSection.innerHTML = '';
    destinationWeatherSection.innerHTML = '';

    appendWeatherData(originWeatherSection, originWeather, 0);
    appendWeatherData(destinationWeatherSection, destWeather, 1);
}

function createWeatherDiv(text, className) {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    return div;
}

function appendWeatherData(section, weatherData, index) {
    if (!weatherData) {
        section.appendChild(createWeatherDiv('Weather data not available or invalid API Key', `weather-data${index}`));
        return;
    }

    // Append each piece of weather data as a div
    section.appendChild(createWeatherDiv(`At ${safeText(weatherData.icao)}`, `icao${index}`));
    
    // Weather Check for  Gusts
    let windDataText = `Wind: ${safeText(weatherData.wind.degrees, '°')}/${safeText(weatherData.wind.speed_kts, 'kts')}`;
    if (weatherData.wind.gust_kts && weatherData.wind.gust_kts > weatherData.wind.speed_kts) {
    windDataText += ` (GST ${safeText(weatherData.wind.gust_kts)}kts)`;
    }
    section.appendChild(createWeatherDiv(windDataText, `wind-data${index}`));

    //Append Remaining Weather Data
    let visibilityText;
    if (parseInt(weatherData.visibility.miles, 10) === 0) {
        visibilityText = `${safeText(parseFloat(weatherData.visibility.meters_float).toFixed(0))}m`;
    } else {
        visibilityText = `${safeText(weatherData.visibility.miles, 'SM')}`;
    }
    section.appendChild(createWeatherDiv(`Temp: ${safeText(weatherData.temperature.celsius)}°C Vis: ${visibilityText}`, `temp-data${index}`));
    
    //Append Altimeter Data
    section.appendChild(createWeatherDiv(`Baro: ${safeText(parseFloat(weatherData.barometer.hg).toFixed(2))} / 
                                                    ${Math.round(safeText(parseFloat(weatherData.barometer.mb)))}`, `altimeter-data${index}`));
    
    const conditionsData = processConditionsData(weatherData);
    const conditionsDiv = document.createElement('div');
    
    // Append Clouds Data
    const cloudsDiv = document.createElement('div');
    cloudsDiv.className = `clouds${index}`;
    conditionsDiv.className = `conditions${index}`;
    conditionsDiv.textContent = `Conditions: ${conditionsData}`;
    section.appendChild(conditionsDiv);

    // Append 'Clouds' title div except when index is 1
    if (index !== 1 && index !== 0) {
        cloudsDiv.appendChild(createWeatherDiv('Clouds', `titleclouds${index}`));
    }

    const cloudsDataDivs = processCloudsData(weatherData.clouds, index);
    cloudsDataDivs.forEach(cloudDiv => {
        cloudsDiv.appendChild(cloudDiv);
    });

    section.appendChild(cloudsDiv);

}

/**
 * Processes the conditions data from the weather API response.
 * Returns a string with the condition codes joined by spaces.
 * Handles mapping some special condition codes to words.
 */
function processConditionsData(weatherData) {
  if (
    !weatherData ||
    !Array.isArray(weatherData.conditions) ||
    weatherData.conditions.length === 0
  ) {
    return "None";
  }

  const conditionCodes = weatherData.conditions.map((conditionObj) => {
    if (conditionObj.code === "-") {
      return "LT";
    } else if (conditionObj.code === "+") {
      return "HVY";
    } else {
      return conditionObj.code;
    }
  });

  return conditionCodes.join(" ");
}

function processCloudsData(cloudsArray, sectionIndex) {
    if (!Array.isArray(cloudsArray) || cloudsArray.length === 0) {
        const div = createWeatherDiv('', `cloud-data-${sectionIndex}-0`);
        div.appendChild(createSpan('Unreported', 'cloud-info'));
        return [div];
    }

    return cloudsArray.map((cloud, cloudIndex) => {
        const code = cloud.code || '-';
        // Use convertFlightLevel to format cloud.base_feet_agl, if it exists
        // Ensure that cloud.base_feet_agl is a number before passing it to convertFlightLevel
        const baseFeetAgl = cloud.base_feet_agl ? convertFlightLevel(parseInt(cloud.base_feet_agl, 10)) : '-';

        const cloudInfo = `${code}${baseFeetAgl}`; // Combine code and baseFeetAgl into one string

        // Create a single span with the combined text
        const span = createSpan(cloudInfo, 'cloud-info');
        
        return span; // Return the span instead of a div
    });
}

function createSpan(text, className) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
}

