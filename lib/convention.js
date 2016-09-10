'use strict';

var EventEmitter = require('eventemitter3'),
    URL = require('url'),
    LOADER_EVENT = new EventEmitter(),
    VALID_NAME_RE = /^[a-z]+([ \-\_]?[a-z0-9]+)*$/i,
    VALID_SYSTEM_NAME_RE = /^[a-z]+([\-]?[a-z0-9]+)*$/i,
    VALID_SUBJECT_NAME_RE = /^[a-z]+([\-\_]?[a-z0-9]+)*$/i,
    URL_ACTOR_RE = /^([^\:]+)/,
    URL_PREPROCESS_RE = /^([^:]+)\:/,
    NORMALIZE_NAME_RE = /[ \_]/g,
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
                call(str, NORMALIZE_NAME_RE, '-').
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

function createParameterName(system, subject, usecase) {
    return subject + ':' + usecase;
}

function preprocessCallback(all, system) {
    if (system) {
        return normalizeName(system) + ':';
    }
    return all;
}

function preprocessUrl(url) {
    var re = URL_PREPROCESS_RE;
    if (re.test(url)) {
        url = url.replace(re, preprocessCallback);
    }
    return url;
}

function parseUrl(url) {
    var o = URL.parse(preprocessUrl(url), false, true),
        system = o.protocol,
        actor = o.auth,
        subject = o.hostname,
        usecase = o.pathname,
        decode = decodeURIComponent,
        normalize = normalizeName;
    var m, urlObject;
    
    if (subject && usecase) {

        urlObject = {
            system: null,
            actor: null
        };
        
        if (system) {
            urlObject.system = normalize(system.substring(0, system.length -1));
        }
        
        if (actor) {
            m = actor.match(URL_ACTOR_RE);
            if (m) {
                urlObject.actor = m[1];
            }
        }
        
        urlObject.subject = normalize(decode(subject));
        usecase = normalize(decode(usecase));
        urlObject.usecase = usecase.substring(1, usecase.length);
        
        return urlObject;
        
    }
    return void(0);
}

function createUrl(system, subject, usecase, actor) {
    var urlObject = {},
        normalize = normalizeName,
        allow = false;
    
    
    urlObject.slashes = false;
    
    if (system && typeof system === 'string') {
        urlObject.protocol = normalize(system);
    }
    
    if (subject && typeof subject === 'string') {
        urlObject.hostname = normalize(subject);
        urlObject.slashes = true;
        allow = true;
        if (usecase && typeof usecase === 'string') {
            urlObject.pathname = '/' + normalize(usecase);
        }
    }
    
    if (actor && typeof actor === 'string') {
        urlObject.auth = normalize(actor);
    }
    
    return allow ? URL.format(urlObject) : void(0);
    
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
    
    parseUrl: parseUrl,
    
    createUrl: createUrl,
    
    createParameterName: createParameterName
    
};