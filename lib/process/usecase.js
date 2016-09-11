'use strict';

var APPTIVITY = require("apptivity"),
    INFO = require('./info.js'),
    CONVENTION = INFO.convention,
    FINALIZED = {},
    INQUEUE = {},
    PENDING = [],
    FINALIZING = false,
    EXPORTS = finalize;


function finalize(url) {
    var getInfo = INFO,
        info = getInfo(url),
        list = FINALIZED,
        inqueue = INQUEUE,
        pending = PENDING,
        paramUrl = url;
        
    var system, subject, usecase;
    
    if (info) {
        system = info.systemInstance;
        subject = info.subject;
        usecase = info.usecase;
        
        if (system && subject && usecase) {
            
            // recreate url to only system, subject, usecase
            url = getInfo.convention.createUrl(info.system, subject, usecase);
            
            if (!getInfo.exist(url)) {
                throw new Error("Use-case do not exist " + paramUrl);
            }
            
            // try finalize
            if (!(url in list)) {
                inqueue[url] = true;
                pending[pending.length] = url;
                
                bulkfinalize();
                
            }
            //console.log(list[url]);
            return url in list && list[url];
        
        }
        
        throw new Error("Invalid [url] parameter: " + paramUrl);
        
    }
    
    throw new Error("Invalid [url] parameter.");
}


function bulkfinalize() {
    var convention = CONVENTION,
        getInfo = INFO,
        list = PENDING,
        finalized = FINALIZED,
        inqueue = INQUEUE;
    var url, l, len, info, usecase, names, relations,
        itemUrl, item, il, ic, hasPending, system;
    
    if (!FINALIZING) {
        FINALIZING = true;
        inqueue = {};
        len = list.length;
        
        for (l = len; l--;) {
            url = list[l];
            
            if (url in finalized) {
                list.splice(l, 1);
                len--;
                continue;
            }
            
            // try finalize relationships first list
            info = getInfo(url);
            system = info.system;
            usecase = info.definition.usecase;
            names = usecase.relateNames;
            relations = usecase.relate;
            hasPending = false;
            
            for (ic = -1, il = names.length; il--;) {
                item = relations[names[++ic]];
                
                itemUrl = convention.createUrl(
                                system,
                                item.subject,
                                item.usecase);
                
                if (!(itemUrl in finalized)) {
                    hasPending = true;
                    if (!(itemUrl in inqueue)) {
                        inqueue[itemUrl] = true;
                        list[len++] = itemUrl;
                        l = len;
                    }
                }

            }
            
            // can finalize
            if (!hasPending) {
                createFinalizedObject(url, info);
                l = len;
            }

        }
        
        FINALIZING = false;
    }
}


function createFinalizedObject(url, info) {
    var finalizedList = FINALIZED,
        definition = info.definition,
        usecase = definition.usecase,
        subject = info.subject,
        usecaseName = usecase.name,
        finalized = finalizedList[url] = {
            url: url,
            id: INFO.convention.createUrl(null, subject, usecaseName),
            system: info.system,
            subject: subject,
            usecase: usecaseName,
            extensionNames: [],
            extensions: {},
            includeNames: [],
            includes: {}
        },
        convention = CONVENTION,
        apptivity = APPTIVITY,
        
        relationships = usecase.relate,
        generalizedUsecase = null,
        activity = apptivity.exist(url) && url;
        
    var list, l, relationship, usecaseUrl, finalizedUsecase;
    
    // resolve extensions
    applyFinalizedRelation('extend', usecase, finalized);
    
    // resolve includes
    applyFinalizedRelation('include', usecase, finalized);

    // resolve activity
    list = usecase.generalize;
    for (l = list.length; l--;) {
        relationship = relationships[list[l]];
        usecaseUrl = convention.createUrl(
                                    relationship.system,
                                    relationship.subject,
                                    relationship.usecase);
        
        finalizedUsecase = finalizedList[usecaseUrl];
        
        // resolve activity if not yet defined
        if (!activity) {
            activity = finalizedUsecase.activity;
            generalizedUsecase = finalizedUsecase.url;
        }
        
        // apply inherited extensions
        applyInheritedRelation('extend', finalized, finalizedUsecase);
        
        // apply inherited includes
        applyInheritedRelation('include', finalized, finalizedUsecase);

    }

    finalized.generalized = generalizedUsecase;
    finalized.activity = activity || null;

}


function applyFinalizedRelation(type, usecase, finalized) {
    var finalizedList = FINALIZED,
        convention = CONVENTION,
        relationships = usecase.relate,
        isExtend = type === 'extend',
        
        names = usecase[isExtend ? 'extend' : 'include'],
        finalNames = finalized[isExtend ? 'extensionNames' : 'includeNames'],
        indexes = finalized[isExtend ? 'extensions' : 'includes'],
        errorLabel = isExtend ? 'extend' : 'include',
        nl = finalNames.length;
        
    var name, c, l, relationship,
        rsystem, rsubject, rusecase,
        usecaseUrl, finalizedUsecase, activity;

    for (c = -1, l = names.length; l--;) {
        name = names[++c];
        relationship = relationships[name];
        rsystem = relationship.system;
        rsubject = relationship.subject;
        rusecase = relationship.usecase;
        
        finalizedUsecase = finalizedList[convention.createUrl(
                                            rsystem,
                                            rsubject,
                                            rusecase)];
        activity = finalizedUsecase.activity;
        
        if (!activity) {
            throw new Error("Usecase [" + usecaseUrl +
                "] requires defined activity before [" + finalized.url +
                "] can " + errorLabel + " it.");
        }
        
        name = convention.createParameterName(rsystem, rsubject, rusecase);
        finalNames[nl++] = name;
        indexes[name] = {
            usecase: finalizedUsecase.url,
            activity: finalizedUsecase.activity
        };
        
    }
}

function applyInheritedRelation(type, source, target) {
    var hasOwn = Object.prototype.hasOwnProperty,
        isExtend = type === 'extend',
        names = target[isExtend ? 'extensionNames' : 'includeNames'],
        indexes = target[isExtend ? 'extensions' : 'includes'],
        sourceNames = source[isExtend ? 'extensionNames' : 'includeNames'],
        sourceRelationship = source[isExtend ? 'extensions' : 'includes'],
        sl = sourceNames.length;
        
    var c, l, name;

    for (c = -1, l = names.length; l--;) {
        name = names[++c];
        if (hasOwn.call(sourceRelationship, name)) {
            continue;
        }
        sourceNames[sl++] = name;
        sourceRelationship[name] = indexes[name];
    }
}

module.exports = EXPORTS;