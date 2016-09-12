'use strict';

var APPTIVITY = require("apptivity"),
    BUS = require('./lib/bus.js'),
    DEFINE = require('./lib/define/index.js'),
    PROCESS = require('./lib/process/index.js'),
    EXPORTS = PROCESS;
    

function subscribe(process, event, handler) {
    
}

module.exports = EXPORTS['default'] = EXPORTS;
EXPORTS.system = DEFINE.define;
EXPORTS.subscribe = subscribe;
EXPORTS.activity = APPTIVITY.activity;


