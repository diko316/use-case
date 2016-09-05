'use strict';

var CONVENTION = require('./convention.js');

function registerRelationship(currentSubject, type, subject, usecase) {
    var currentUsecase = currentSubject.lastUsecase,
        currentName = currentSubject.name,
        system = currentSubject.system,
        usecases = system.definition.usecase;
    var subjectObj, id, definition, relationships, names;
    
    if (!currentUsecase) {
        throw new Error("No base use-case to \u00ab" + type + "\u00bb");
    }
    
    definition = usecases[currentName + '/' + currentUsecase];
    relationships = definition.relate;
    
    // register usecase
    subjectObj = system.subject(subject).usecase(usecase);
    subject = subjectObj.name;
    usecase = subjectObj.lastUsecase;
    
    if (subject === currentName) {
        currentSubject.lastUsecase = usecase;
    }
    
    id = subject + '/' + usecase;
    if (id in relationships) {
        throw new Error(
            id + " already has \u00ab" + relationships[id].type +
            "\u00bb  relationship to " + usecase);
    }
    
    // register
    relationships[id] = {
        type: type,
        subject: subject,
        usecase: usecase
    };
    
    names = definition.relateNames;
    names[names.length] = id;
    
    switch (type) {
    case 'extend':
        names = definition.extend;
        names[names.length] = id;
        break;
    
    case 'include':
        names = definition.include;
        names[names.length] = id;
        break;
    
    case 'generalize':
        names = definition.generalize;
        names[names.length] = id;
        break;
    }
    
    return relationships[id];
    
}


function Subject(system, name, label) {
    var definition = system.definition,
        names = definition.subjectNames;
    
    this.system = system;
    this.name = name;
    this.label = label;
    
    names[names.length] = name;
    definition.subject[':' + name] = {
        usecases: []
    };

}

Subject.prototype = {
    system: void(0),
    name: void(0),
    label: void(0),
    
    lastUsecase: void(0),
    
    constructor: Subject,
    
    usecase: function (usecase) {
        
        var convention = CONVENTION,
            systemDefinition = this.system.definition,
            definition = systemDefinition.subject[':' + this.name],
            raw = usecase;
        var id, usecases, names;
        
        if (!convention.validString(usecase)) {
            throw new Error("Invalid subject [usecase] parameter");
        }
        
        if (!convention.validUsecaseName(usecase)) {
            throw new Error(
                "[usecase] parameter contains invalid character: " + usecase);
        }
        
        usecase = convention.normalizeName(usecase);
        
        id = this.name + '/' + usecase;
        usecases = systemDefinition.usecase;
        if (!(id in usecases)) {
            // register to subject usecase list
            names = definition.usecases;
            names[names.length] = usecase;
            
            // register to usecase list
            names = systemDefinition.usecaseNames;
            names[names.length] = id;
            usecases[id] = {
                label: raw,
                subject: this.name,
                name: usecase,
                
                generalize: [],
                include: [],
                extend: [],
                
                relateNames: [],
                relate: {}
            };
        }
        
        this.lastUsecase = usecase;
        
        return this;
        
    },
    
    extend: function (subject, usecase, condition) {
        var F = Function;
        var relationship;
        
        // has condition
        switch (arguments.length) {
        case 1:
                usecase = subject;
                subject = this.name;
                condition = null;
            break;
        case 2:
                // no subject, only condition
                if (usecase instanceof F) {
                    condition = usecase;
                    usecase = subject;
                    subject = this.name;
                }
                else {
                    condition = null;
                }
        }
        
        relationship = registerRelationship(this, 'extend', subject, usecase);
        relationship.condition = condition instanceof F ?
                                    condition : false;
        
        return this;
    },
    
    include: function (usecase) {
        //associate(this, 'include', usecase);
        return this;
    },
    
    generalize: function (usecase) {
        //associate(this, 'generalize', usecase);
        return this;
    }
    
    
};


module.exports = Subject;
