'use strict';

var CONVENTION = require('./convention.js');


function associate(subject, type, usecase) {
    var current = subject.lastUsecase;
    var definition, id, associations, names, created, crc;
    
    if (!current) {
        throw new Error("No base use-case to \u00ab" + type + "\u00bb");
    }
    
    // register usecase
    subject.usecase(usecase);
    subject.lastUsecase = current;
    
    usecase = CONVENTION.normalizeName(usecase);
    
    // register integrations
    definition = subject.system.definition.
                    usecase[subject.name + '/' + current];
    associations = definition.associate;
    
    id = ':' + usecase;
    if (id in associations) {
        throw new Error(
            current + " is already associated as \u00ab" +
                associations[id].type + "\u00bb to " + usecase);
    }
    
    crc = runAssociationCRC(subject, current, usecase);
    if (crc) {
        throw new Error(
            current + " \u00ab" + type + "\u00bb association with " + usecase +
                " will result in  cyclic or redundant association with " + crc +
                " usecase."
        );
    }
    
    names = definition.associateNames;
    names[names.length] = usecase;
    associations[id] = created = {
        type: type,
        usecase: usecase
    };
    return created;
}


function runAssociationCRC(subject, base, sub) {
    var usecases = subject.system.definition.usecase,
        subjectName = subject.name,
        flags = {},
        list = [base],
        len = 1;
    var names, usecase, l, name, id;
    
    flags[':' + base] = true;
        
    // create flags
    for (; len--;) {
        usecase = list[len];
        names = usecases[subjectName + '/' + usecase].associateNames;
        for (l = names.length; l--;) {
            name = names[l];
            id = ':' + name;
            if (!(id in flags)) {
                flags[id] = true;
                list[len++] = name;
            }
        }
    }
    
    // walk through sub if some of its associates is
    //      pointing to one of the flags
    list.length = len = 1;
    list[0] = sub;
    
    for (; len--;) {
        usecase = list[len];
        names = usecases[subjectName + '/' + usecase].associateNames;
        for (l = names.length; l--;) {
            name = names[l];
            id = ':' + name;
            if (id in flags) {
                return usecase;
            }
            list[len++] = name;
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
                associateNames: [],
                associate: {}
            };
        }
        
        this.lastUsecase = usecase;
        
        return this;
        
    },
    
    extend: function (usecase, condition) {
        var association = associate(this, 'extend', usecase);
        
        if (arguments.length > 1) {
            if (!(condition instanceof Function)) {
                throw new Error(
                    "Invalid extend [condition] parameter.");
            }
            association.condition = condition;
        }
        else {
            association.condition = false;
        }
        
        return this;
    },
    
    include: function (usecase) {
        associate(this, 'include', usecase);
        return this;
    },
    
    generalize: function (usecase) {
        associate(this, 'generalize', usecase);
        return this;
    }
    
    
};


module.exports = Subject;
