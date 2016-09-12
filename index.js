'use strict';

var APPTIVITY = require("apptivity"),
    BUS = require('./lib/bus.js'),
    DEFINE = require('./lib/define/index.js'),
    PROCESS = require('./lib/process/index.js'),
    EXPORTS = PROCESS;
    

function subscribe(url, event, handler) {
    var Re = RegExp,
        isUrlRegex = url instanceof Re;
        
    if (!url || (typeof url !== 'string' && !isUrlRegex)) {
        throw new Error("Invalid [url] parameter");
    }
    
    if (!event || (typeof event !== 'string' && !(event instanceof Re))) {
        throw new Error("Invalid [event] name parameter");
    }
    
    if (!(handler instanceof Function)) {
        throw new Error("Invalid [handler] callback parameter");
    }
    
    return BUS.subscribe(event,
            function (process) {
                var processUrl = process.info("url");
                if (isUrlRegex ? url.test(processUrl) : processUrl === url) {
                    handler.apply(null, arguments);
                }
            });
}

module.exports = EXPORTS['default'] = EXPORTS;
EXPORTS.system = DEFINE.define;
EXPORTS.subscribe = subscribe;
EXPORTS.activity = APPTIVITY.activity;


