'use strict';

var DEFINE = require('./lib/define/index.js'),
    RUN = require('./lib/run/index.js'),
    EXPORTS = DEFINE.define;



module.exports = EXPORTS['default'] = EXPORTS;

// temporary
EXPORTS.finalize = RUN.finalizeUsecase;
EXPORTS.finalizeActor = RUN.finalizeActor;
