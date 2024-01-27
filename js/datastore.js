let simBriefData = null;

const setSbData = (data) => {
    localStorage.setItem('simbriefData', JSON.stringify(data));
    simBriefData = data;
};

const getSbData = () => {
    simBriefData = JSON.parse(localStorage.getItem('simbriefData'));;
    return simBriefData;
}

const deleteSbData = () => {
    localStorage.removeItem('simbriefData');
    simBriefData = null;
}