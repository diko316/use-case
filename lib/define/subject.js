'use strict';

var CONVENTION = require('../convention.js');


function registerRelationship(currentSubject, type, subject, usecase) {
    var currentUsecase = currentSubject.lastUsecase,
        currentName = currentSubject.name,
        system = currentSubject.system,
        usecases = system.definition.usecase,
        convention = CONVENTION;
        
    var subjectObj, id, definition, relationships, names, currentId;//, related;
    
    if (!currentUsecase) {
        throw new Error("No base use-case to \u00ab" + type + "\u00bb");
    }
    
    currentId = convention.createUrl(null, currentName, currentUsecase);
    
    
    definition = usecases[currentId];
    relationships = definition.relate;
    
    // register usecase
    subjectObj = system.subject(subject).usecase(usecase);
    subject = subjectObj.name;
    usecase = subjectObj.lastUsecase;
    
    if (subject === currentName) {
        currentSubject.lastUsecase = usecase;
    }
    
    id = convention.createUrl(null, subject, usecase);
    
    if (id in relationships) {
        throw new Error(currentId + " \u00ab" + type + "\u00bb " + id +
            " conflicts with " + currentId +
            " \u00ab" + relationships[id].type + "\u00bb " + id);
    }
    
    if (convention.hasCRC(system.name + ':usecase', currentId, id)) {
        throw new Error(currentId + " \u00ab" + type + "\u00bb " + id +
            " has cyclic redundant relationship");
    }
    
    //related = hasRelationCRC(currentSubject, currentUsecase, id);
    //
    //if (related) {
    //    throw new Error(currentId + " \u00ab" + type + "\u00bb " + id +
    //        " has cyclic redundant relationship");
    //}
    
    // register
    relationships[id] = {
        type: type,
        system: system.name,
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


function hasRelationCRC(subject, usecase, target) {
    var usecases = subject.system.definition.usecase,
        convention = CONVENTION,
        marked = {},
        list = [
            convention.createUrl(null, subject.name, usecase)
        ],
        len = 1;
    var item, relations, l;
    
    // mark all source relations
    for (; len--;) {
        item = list[len];
        if (!(item in marked)) {
            marked[item] = true;
            relations = usecases[item].relateNames;
            for (l = relations.length; l--;) {
                list[len++] = relations[l];
            }
        }
    }
    
    // find all relations
    list = [target];
    len = list.length;
    for (; len--;) {
        item = list[len];
        
        if (item in marked) {
            return item;
        }
        
        relations = usecases[item].relateNames;
        for (l = relations.length; l--;) {
            list[len++] = relations[l];
        }
    }
    
    return false;
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
    
    usecase: function (usecase, loader) {
        
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
        
        id = convention.createUrl(null, this.name, usecase);
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
                
                workflow: convention.createUrl(
                                this.system.name,
                                this.name,
                                usecase),
                finalized: false,
                
                generalize: [],
                include: [],
                extend: [],
                
                relateNames: [],
                relate: {}
            };
        }
        
        if (loader instanceof Function) {
            this.lastUsecase = usecase;
            convention.load(loader, [this]);
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
    
    include: function (subject, usecase) {
        if (arguments.length < 2) {
            usecase = subject;
            subject = this.name;
        }
        registerRelationship(this, 'include', subject, usecase);
        return this;
    },
    
    generalize: function (subject, usecase) {
        if (arguments.length < 2) {
            usecase = subject;
            subject = this.name;
        }
        registerRelationship(this, 'generalize', subject, usecase);
        return this;
    }
    
    
};


module.exports = Subject;
