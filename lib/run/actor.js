'use strict';

var INFO = require('./info.js'),
    EXPORTS = finalize,
    INQUEUE = {},
    PENDING = [],
    FINALIZED = {},
    FINALIZING = false;


function finalize(system, actor) {
    var finalized = FINALIZED,
        inqueue = INQUEUE,
        pending = PENDING;
    var info, id;
    
    if (!system || typeof system !== 'string') {
        throw new Error("Invalid [system] parameter");
    }
    if (!actor || typeof actor !== 'string') {
        throw new Error("Invalid [actor] parameter");
    }
    
    info = INFO.actor(system, actor);
    if (!info) {
        throw new Error("Actor " + actor + " not found in " + system);
    }
    
    id = info.id;
    
    if (!(id in finalized)) {
        
        if (!(id in inqueue)) {
            inqueue[id] = info;
            pending[pending.length] = id;
        }
        
        bulkfinalize();
        
    }
    
    return id in finalized && finalized[id];
    
}


function bulkfinalize() {
    var finalized = FINALIZED,
        inqueue = INQUEUE,
        pending = PENDING,
        getInfo = INFO;
    var l, len, id, info, hasPending, definition,
        nl, names, actor, itemInfo, aid, system;
    
    if (!FINALIZING) {
        FINALIZING = true;
        l = len = pending.length;
        
        for (; l--;) {
            id = pending[l];
            
            if (id in finalized) {
                pending.splice(l, 1);
                len--;
                continue;
            }
            
            hasPending = false;
            info = inqueue[id];
            
            // fetch all inherited roles
            definition = info.definition;
            system = info.system.name;
            names = definition.generalizeNames;
            for (nl = names.length; nl--;) {
                actor = names[nl];
                itemInfo = getInfo.actor(system, actor);
                aid = itemInfo.id;
                
                if (!(aid in finalized)) {
                    hasPending = true;
                    if (!(aid in inqueue)) {
                        inqueue[aid] = itemInfo;
                        pending[len++] = aid;
                        l = len;
                    }
                }

            }
            
            // is ready!
            if (!hasPending) {
                createFinalizedActor(info);
                l = len;
            }
            
        }
        
        FINALIZING = false;
    }
}

function createFinalizedActor(info) {
    var finalizeList = FINALIZED,
        getInfo = INFO, 
        usecases = {},
        usecaseNames = [],
        ul = 0,
        definition = info.definition,
        system = info.system,
        systemUsecases = system.definition.usecase,
        systemName = system.name,
        actorNames = definition.generalizeNames,
        usecaseList = definition.usecaseNames;
        
    var c, l, actor, item, ac, al;
    
    finalizeList[info.id] = {
        id: info.id,
        actor: info.actor,
        system: systemName,
        usecases: usecaseNames,
        usecaseIndex: usecases
    };
    
    // apply my usecases
    for (c = -1, l = usecaseList.length; l--;) {
        item = usecaseList[++c];
        usecaseNames[ul++] = item;
        usecases[item] = systemUsecases[item];
    }
    
    // inherit other actor's usecases
    for (c = -1, l = actorNames.length; l--;) {
        
        actor = getInfo.actor(systemName, actorNames[++c]);
        usecaseList = finalizeList[actor.id].usecases;
        
        for (ac = -1, al = usecaseList.length; al--;) {
            item = usecaseList[++ac];
            
            if (item in usecases) {
                continue;
            }
            usecaseNames[ul++] = item;
            usecases[item] = systemUsecases[item];
        }
    }
    
}

module.exports = EXPORTS;