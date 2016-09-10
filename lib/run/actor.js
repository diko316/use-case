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
    
    return finalized[id];
    
}


function bulkfinalize() {
    var finalized = FINALIZED,
        inqueue = INQUEUE,
        pending = PENDING;
    var l, len, id, info, hasPending;
    
    if (!FINALIZING) {
        FINALIZING = true;
        l = len = pending.length;
        
        for (; l--;) {
            id = pending[l];
            
            if (id in finalized) {
                pending.splice(l, 1);
                continue;
            }
            
            hasPending = false;
            info = inqueue[id];
            
            
        }
        
        FINALIZING = false;
    }
}

module.exports = EXPORTS;