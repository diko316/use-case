'use strict';

var CONVENTION = require('./convention.js'),
    Actor = require('./actor.js'),
    Subject = require('./subject.js'),
    EXPORTS = getOrCreate,
    DEFINITION_API = {},
    SYSTEMS = {};

function getOrCreate(name) {
    var list = SYSTEMS,
        convention = CONVENTION,
        raw = name;
    var id;
    
    if (!convention.validString(name)) {
        throw new Error("Invalid use-case system [name] parameter");
    }
    
    if (!convention.validSystemName(name)) {
        throw new Error("[name] parameter contains invalid character: " + name);
    }
    
    name = convention.normalizeName(name);
    
    id = ':' + name;
    if (id in list) {
        return list[id];
    }
    
    return new System(id, raw);

}



function System(id, label) {
    SYSTEMS[id] = this;
    DEFINITION_API[id] = {};
    this.id = id;
    this.name = id.substring(1, id.length);
    this.label = label;
    
    this.definition = {
        actorNames: [],
        actor: {},
        
        subjectNames: [],
        subject: {},
        
        usecaseNames: [],
        usecase: {},
        implement: {}
    };
}


System.prototype = {
    
    id: void(0),
    name: void(0),
    label: void(0),
    definition: void(0),
    
    constructor: System,
    
    actor: function () {
        return this.as.apply(this, arguments);
    },
    
    as: function (actor) {
        var convention = CONVENTION,
            apis = DEFINITION_API[this.id],
            raw = actor;
        var defId;
        
        if (!convention.validString(actor)) {
            throw new Error("Invalid use-case [actor] parameter");
        }
        
        if (!convention.validActorName(actor)) {
            throw new Error(
                "[actor] parameter contains invalid character: " + actor);
        }
        
        actor = convention.normalizeName(actor);
        defId = 'actor:' + actor;
        
        if (!(defId in apis)) {
            apis[defId] = new Actor(this, actor, raw);
        }
        
        return apis[defId];

    },
    
    subject: function (subject) {
        var convention = CONVENTION,
            apis = DEFINITION_API[this.id],
            raw = subject;
        var defId;
        
        if (!convention.validString(subject)) {
            throw new Error("Invalid use-case [subject] parameter");
        }
        
        if (!convention.validSubjectName(subject)) {
            throw new Error(
                "[subject] parameter contains invalid character: " + subject);
        }
        
        subject = convention.normalizeName(subject);
        defId = 'subject:'+subject;
        
        if (!(defId in apis)) {
            apis[defId] = new Subject(this, subject, raw);
        }
        
        return apis[defId];

    },
    
    activity: function (subjectUsecase) {
        
    }
    
};



module.exports = EXPORTS;


