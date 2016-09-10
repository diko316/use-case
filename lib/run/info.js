'use strict';

var CONVENTION = require('../convention.js'),
    SYSTEM = require('../define/system.js'),
    EXPORTS = getInfo,
    INFO_CACHE = {},
    ACTOR_CACHE = {};

function getActor(system, actor) {
    var cache = ACTOR_CACHE;
    var id, actors, found, cid;
    
    cid = ':' + system + ':' + actor;
    if (cid in cache) {
        return cache[cid];
    }
    
    system = SYSTEM(system);
    if (system) {
        actors = system.definition.actor;
        actor = CONVENTION.normalizeName(actor);
        id = ':' + actor;
        if (id in actors) {
            cache[cid] = found = {
                id: system.name + ':' + actor,
                system: system,
                actor: actor,
                definition: actors[id]
            };
            return found;
        }
    }
    return void(0);
}

function getInfo(url) {
    var cache = INFO_CACHE,
        convention = CONVENTION;
    var info, systemInstance, definition,
        system, subject, usecase, actor, id, def, index;
    
    if (Object.prototype.hasOwnProperty.call(cache, url)) {
        return cache[url];
    }
    
    if (url && typeof url === 'string') {
        info = convention.parseUrl(url);

        cache[url] = info;
        
        if (info) {
            system = info.system;
            info.url = convention.createUrl(system,
                                            info.subject,
                                            info.usecase,
                                            info.actor);
            
            // apply definition if system exist
            info.systemInstance =
                systemInstance = (system && SYSTEM(system)) || null;
            
            
            
            if (systemInstance) {
                definition = systemInstance.definition;
                info.definition = index = {
                    system: definition,
                    subject: null,
                    usecase: null,
                    usecaseUrl: null,
                    actor: null
                };
                
                subject = info.subject;
                if (subject) {
                    id = ':' + subject;
                    def = definition.subject;
                    if (id in def) {
                        index.subject = def[id];
                    }
                }
                
                usecase = info.usecase;
                if (usecase) {
                    id = convention.createUrl(null, subject, usecase);
                    def = definition.usecase;
                    if (id in def) {
                        index.usecase = def[id];
                        index.usecaseUrl = id;
                    }
                }
                
                actor = info.actor;
                if (actor) {
                    id = ':' + actor;
                    def = definition.actor;
                    if (id in def) {
                        index.actor = def[id];
                    }
                }
            }
            else {
                info.definition = null;
            }

            return info;
        }
    }
    
    return void(0);
}

function exist(url) {
    var info = getInfo(url),
        convention = CONVENTION,
        returnValue = false,
        target = null;
    var item, definition, subject, usecase, actor;
    
    if (info) {
        definition = info.definition;
        if (definition) {
            subject = info.subject;
            if (subject) {
                item = definition.subject;
                if (!item) {
                    return false;
                }
                returnValue = item;
            }
            
            usecase = info.usecase;
            if (usecase) {
                item = definition.usecase;
                if (!item) {
                    return false;
                }
                returnValue = item;
                target = convention.createUrl(null, subject, usecase);
            }
            
            actor = info.actor;
            if (actor) {
                item = definition.actor;
                if (!item || !target || !(target in item.usecase)) {
                    return false;
                }
            }
            
            return returnValue;
        }
    }
    return false;
}

module.exports = EXPORTS;
EXPORTS.exist = exist;
EXPORTS.convention = CONVENTION;
EXPORTS.actor = getActor;