function createDynamicVariables2(simBrief, simOriginWeather, simDestWeather){
    const dynamicVariables = {
        //***SimBrief Variables***
        flightPlan: simBrief ? `${simBrief.origin.icao_code}/${simBrief.origin.plan_rwy} `
                            + `${simBrief.general.route} ${simBrief.destination.icao_code}/`
                            + `${simBrief.destination.plan_rwy}` : `No Flight Plan`,
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
        //ZFW Raw
        sbZfwRaw: simBrief.weights.est_zfw,
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
        airportIoMcpHdg: simBrief.origin.plan_rwy && simBrief.tlr.takeoff.runway 
            ? simBrief.tlr.takeoff.runway.find(rwy => rwy.identifier === simBrief.origin.plan_rwy)?.magnetic_course 
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

        //****Special Variables Per Plane ******/
        maddogEfbPerfOrigin: simOriginWeather ? `${simBrief.origin?.icao_code ?? 'Error'}/${simBrief.origin?.plan_rwy ?? 'Error'}/(${simOriginWeather.wind?.degrees ?? 'Error'}/${simOriginWeather.wind?.speed_kts ?? 'Error'})/${isNaN(simOriginWeather.barometer?.mb) ? 'Error' : parseFloat(simOriginWeather.barometer.mb).toFixed(0)}/${simOriginWeather.temperature?.celsius ?? 'Error'}/${simBrief.weights.est_tow != null ? Math.round((simBrief.weights.est_tow / 1000) * 10) / 10 : 'Error'}` : 'Error',
        maddogEfbPerfDest: simDestWeather ? `${simBrief.destination?.icao_code ?? 'Error'}/${simBrief.destination?.plan_rwy ?? 'Error'}/(${simDestWeather.wind?.degrees ?? 'Error'}/${simDestWeather.wind?.speed_kts ?? 'Error'})/${isNaN(simDestWeather.barometer?.mb) ? 'Error' : parseFloat(simDestWeather.barometer.mb).toFixed(0)}/${simDestWeather.temperature?.celsius ?? 'Error'}/${simBrief.weights.est_ldw != null ? Math.round((simBrief.weights.est_ldw / 1000) * 10) / 10 : 'Error'}` : 'Error',

    };
    return dynamicVariables;
}