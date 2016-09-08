'use strict';

var EventEmitter = require('eventemitter3'),
    URL = require('url'),
    LOADER_EVENT = new EventEmitter(),
    VALID_NAME_RE = /^[a-z]+([ \-\_]?[a-z0-9]+)*$/i,
    VALID_SYSTEM_NAME_RE = /^[a-z]+([\-]?[a-z0-9]+)*$/i,
    VALID_SUBJECT_NAME_RE = /^[a-z]+([\-\_]?[a-z0-9]+)*$/i,
    URL_ACTOR_RE = /^([^\:]+)/,
    NORMALIZE_NAME_RE = /[ \-]/g,
    S = String.prototype,
    STR_REPLACE = S.replace;

function validName(str) {
    return VALID_NAME_RE.test(str);
}

function validSystemName(str) {
    return VALID_SYSTEM_NAME_RE.test(str);
}

function validSubjectName(str) {
    return VALID_SUBJECT_NAME_RE.test(str);
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

function createActivityId(system, subject, usecase) {
    return subject + '.' + system + '/' + usecase;
}

function getUrlInfo(url) {
    var o = URL.parse(url),
        system = o.protocol,
        actor = o.auth,
        subject = o.host,
        usecase = o.pathname,
        decode = decodeURIComponent,
        normalize = normalizeName;
    var m;
        
    if (system && actor && subject && usecase) {
        
        m = actor.match(URL_ACTOR_RE);
        if (m) {
            actor = m[1];
        }
        
        subject = normalize(decode(subject));
        
        usecase = normalize(decode(usecase));
        
        return {
            actor: actor,
            system: normalize(system.substring(0, system.length -1)),
            subject: subject,
            usecase: usecase.substring(1, usecase.length)
        };
        
    }
    return void(0);
}

module.exports = {
    
    validString: function (str, allowEmpty) {
        return typeof str === 'string' &&
                (allowEmpty === true || str.length > 0);
    },
    
    validSystemName: validSystemName,
    
    validActorName: validName,
    
    validSubjectName: validSubjectName,
    
    validUsecaseName: validName,
    
    normalizeName: normalizeName,
    
    load: load,
    
    createActivityId: createActivityId,
    
    getUrlInfo: getUrlInfo
};