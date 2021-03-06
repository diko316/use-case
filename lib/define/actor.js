'use strict';

var CONVENTION = require('../convention.js');

function Actor(system, name, label) {
    var definition = system.definition,
        names = definition.actorNames;
    
    this.system = system;
    this.label = label;
    this.name = name;
    
    // populate actor
    names[names.length] = name;
    definition.actor[':' + name] = {
        
        finalized: false,
        
        generalizeNames: [],
        generalize: {},
        
        usecaseNames: [],
        usecase: {}
    };
}

Actor.prototype = {
    name: void(0),
    system: void(0),
    lastSubject: void(0),
    lastUsecase: void(0),
    
    constructor: Actor,
    
    accessing: function (subject, loader) {
        var name;
        
        subject = this.system.subject(subject);
        
        if (subject) {
            name = subject.name;
            
            if (loader instanceof Function) {
                this.lastSubject = name;
                CONVENTION.load(loader, [this]);
            }
            
            this.lastSubject = name;
        }
        
        return this;
        
    },
    
    emulating: function () {
        var convention = CONVENTION,
            system = this.system,
            actorName = this.name,
            definition = system.definition.actor[':' + actorName],
            crcIndex = system.name + ':actor',
            index = definition.generalize,
            bases = definition.generalizeNames,
            bl = bases.length,
            list = arguments,
            len = list.length,
            c = -1;
        var actor, id;
        
        for (; len--;) {
            actor = system.as(list[++c]).name;
            if (convention.hasCRC(crcIndex, actorName, actor)) {
                throw new Error(actorName + " \u21fe " + actor +
                    " has cyclic redundant generalization");
            }
            id = ':' + actor;
            if (!(id in index)) {
                index[id] = true;
                bases[bl++] = actor;
            }
        }
        
        return this;
    },
    
    can: function (usecase, loader) {
        var convention = CONVENTION,
            system = this.system,
            subjectName = this.lastSubject;
            
        var definition;
        
        var id, usecases, names, subject;
        
        if (!convention.validString(usecase)) {
            throw new Error("Invalid actor's associated [usecase] parameter");
        }
        
        if (!subjectName) {
            throw new Error(usecase + ' usecase do not belong to a subject');
        }
        
        definition = system.definition.actor[':' + this.name];
        subject = system.subject(subjectName);
        usecase = subject.usecase(usecase).lastUsecase;
        
        // update actor definition
        id = convention.createUrl(null, subjectName, usecase);
        usecases = definition.usecase;
        
        if (!(id in usecases)) {
            names = definition.usecaseNames;
            names[names.length] = id;
            usecases[id] = {
                subject: subjectName,
                name: usecase,
                description: []
            };
        }
        
        if (loader instanceof Function) {
            this.lastUsecase = usecase;
            convention.load(loader, [this]);
        }
        
        this.lastUsecase = usecase;
        
        return this;
    
    },
    
    soThat: function () {
        var convention = CONVENTION,
            list = arguments,
            subject = this.lastSubject,
            usecase = this.lastUsecase;
        
        var c, l, item, descriptions, dl;

        if (!subject) {
            throw new Error('no use-case subject was selected to describe');
        }
        
        if (!usecase) {
            throw new Error('no use-case was selected to describe');
        }
        
        descriptions = this.system.definition.actor[':' + this.name].
                            usecase[convention.createUrl(null,
                                                            subject,
                                                            usecase)].
                            description;
        
        dl = descriptions.length;
        
        for (c = -1, l = list.length; l--;) {
            item = list[++c];
            if (convention.validString(item, true)) {
                descriptions[dl++] = item;
            }
            
        }
        
        return this;
    }
    
};


module.exports = Actor;