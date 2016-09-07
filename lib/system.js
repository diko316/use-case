'use strict';

var ACTIVITY = require('apptivity'),
    CONVENTION = require('./convention.js'),
    Actor = require('./actor.js'),
    Subject = require('./subject.js'),
    EXPORTS = getOrCreate,
    DEFINITION_API = {},
    SYSTEMS = {};

function getOrCreate(name, loader) {
    var list = SYSTEMS,
        convention = CONVENTION,
        raw = name;
    var id, system;
    
    if (!convention.validString(name)) {
        throw new Error("Invalid use-case system [name] parameter");
    }
    
    if (!convention.validSystemName(name)) {
        throw new Error("[name] parameter contains invalid character: " + name);
    }
    
    name = convention.normalizeName(name);
    
    id = ':' + name;
    if (id in list) {
        system = list[id];
    }
    else {
        system = new System(id, raw);
    }
    
    // apply loader
    if (loader instanceof Function) {
        convention.load(loader, [system]);
    }
    
    return system;

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
    
    as: function (actor, loader) {
        var convention = CONVENTION,
            apis = DEFINITION_API[this.id],
            raw = actor;
        var defId, api;
        
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
        
        api = apis[defId];
        
        if (loader instanceof Function) {
            convention.load(loader, [api]);
        }
        
        return api;

    },
    
    subject: function (subject, loader) {
        var convention = CONVENTION,
            apis = DEFINITION_API[this.id],
            raw = subject;
        var defId, api;
        
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
        
        api = apis[defId];
        
        if (loader instanceof Function) {
            convention.load(loader, [api]);
        }
        
        return api;

    },
    
    activity: function (subject, usecase, loader) {
        var workflow = ACTIVITY;
        var id, activity, subjectName;
        
        subject = this.subject(subject).usecase(usecase);
        usecase = subject.lastUsecase;
        subjectName = subject.name;
        
        id = this.name + '://' + subjectName + '/' + usecase;
        
        if (workflow.exist(id)) {
            throw new Error('Activity of '+
                            subjectName + '/' + usecase + ' already exist');
        }
        
        activity = workflow.create(id);
        
        if (loader instanceof Function) {
            CONVENTION.load(loader, [activity, subjectName, usecase]);
        }
        
        return activity;
    }
    
};



module.exports = EXPORTS;


