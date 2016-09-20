'use strict';

var APPTIVITY = require("apptivity"),
    BUS = require('./lib/bus.js'),
    CONVENTION = require("./lib/convention"),
    DEFINE = require('./lib/define/index.js'),
    PROCESS = require('./lib/process/index.js'),
    EXPORTS = PROCESS;



// url parameter should be:
//      "system=[system], actor=[actor], subject=[subject], usecase=[usecase]"

function subscribe(query, event, handler) {
        
    if (!query || typeof query !== 'string') {
        throw new Error("Invalid [query] parameter");
    }
    
    if (!event || (typeof event !== 'string' && !(event instanceof RegExp))) {
        throw new Error("Invalid [event] name parameter");
    }
    
    if (!(handler instanceof Function)) {
        throw new Error("Invalid [handler] callback parameter");
    }
    
    return BUS.subscribe(event,
            function (process) {
                if (CONVENTION.createProcessMatcher(query)(process)) {
                    handler.apply(null, arguments);
                }
            });
}

module.exports = EXPORTS['default'] = EXPORTS;
EXPORTS.system = DEFINE.define;
EXPORTS.subscribe = subscribe;
EXPORTS.activity = APPTIVITY.activity;


