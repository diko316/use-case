'use strict';

var DEFINE = require('./lib/define/index.js'),
    PROCESS = require('./lib/process/index.js'),
    EXPORTS = DEFINE.define;



module.exports = EXPORTS['default'] = EXPORTS;

// temporary
EXPORTS.process = PROCESS;
