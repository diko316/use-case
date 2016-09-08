'use strict';

var ACTIVITY = require('apptivity'),
    CONVENTION = require('./convention.js'),
    SYSTEM = require('./system.js'),
    SYSTEMS = SYSTEM.list;

function run() {
    
}

function info(url) {
    var convention = CONVENTION,
        systems = SYSTEMS;
        
    var urlInfo, systemExist, systemId;
    
    if (!url || typeof url !== 'string') {
        throw new Error("Invalid [url] parameter");
    }
    
    urlInfo = convention.getUrlInfo(url);
    if (!urlInfo) {
        throw new Error("Invalid [url] parameter: " + url);
    }
    
    systemId = ':' + urlInfo.system;
    
    urlInfo.systemExist = systemExist = systemId in systems;
    
    urlInfo.activityExist = systemExist ?
                                systems[systemId].
                                    hasActivity(urlInfo.subject,
                                                urlInfo.usecase) :
                                false;
    return urlInfo;
}

function hasActivity(system, subject, usecase) {
    var convention = CONVENTION;
    
    if (!convention.validString(system)) {
        throw new Error("Invalid [system] parameter");
    }
    
    system = convention.normalizeName(system);
    
    if (!convention.validString(subject)) {
        throw new Error("Invalid use-case [subject] parameter");
    }
    subject = convention.normalizeName(subject);
    
    if (!convention.validString(usecase)) {
        throw new Error("Invalid subject [usecase] parameter");
    }
    
    usecase = convention.normalizeName(usecase);
    
    return ACTIVITY.exist(
                convention.createActivityId(system,
                                            subject,
                                            usecase));
    
}


module.exports = {
    run: run
};