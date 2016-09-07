'use strict';

var EventEmitter = require('eventemitter3'),
    LOADER_EVENT = new EventEmitter(),
    VALID_NAME_RE = /^[a-z]+([ \-\_]?[a-z0-9]+)*$/i,
    NORMALIZE_NAME_RE = /[ \-]/g,
    S = String.prototype,
    STR_REPLACE = S.replace;

function validName(str) {
    return VALID_NAME_RE.test(str);
}

function normalizeName(str) {
    return STR_REPLACE.
                call(str, NORMALIZE_NAME_RE, '_').
                toLowerCase();
}

function load(handler, args) {
    var event = LOADER_EVENT;
    event.once('on-load', handler);
    args = Array.prototype.slice.call(args, 0);
    args.splice(0, 0, 'on-load');
    event.emit.apply(event, args);
    args.length = 0;
}

module.exports = {
    
    validString: function (str, allowEmpty) {
        return typeof str === 'string' &&
                (allowEmpty === true || str.length > 0);
    },
    
    validSystemName: validName,
    
    validActorName: validName,
    
    validSubjectName: validName,
    
    validUsecaseName: validName,
    
    normalizeName: normalizeName,
    
    load: load
};