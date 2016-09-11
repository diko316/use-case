'use strict';

var APPVITIY = require("apptivity"),
    PROMISE = require("bluebird"),
    BUS = require("../bus.js"),
    INFO = require("./info.js"),
    ACTOR = require("./actor.js"),
    USECASE = require("./usecase.js"),
    PROCESS_CACHE = {},
    EXPORTS = get;

function get(url) {
    var info = INFO(url),
        cache = PROCESS_CACHE;
    var cid, definition, found, actor, usecase, errorLabel;
    
    if (info) {
        url = info.url;
        
        cid = ':' + url;
        if (cid in cache) {
            return cache[cid];
        }
        
        definition = info.definition;
        
        if (definition &&
            definition.actor &&
            definition.subject &&
            definition.usecase) {
            
            errorLabel = "[" + info.usecase + "] in [" + info.subject + "]";
            
            // finalize role and usecase
            actor = ACTOR(info.system, info.actor);
            if (!actor) {
                throw new Error("Unable to finalize actor [" + info.actor +"]");
            }
            
            usecase = USECASE(url);
            if (!usecase) {
                throw new Error("Unable to finalize usecase " + errorLabel);
            }
            
            if (!usecase.activity) {
                throw new Error("Activity of usecase " + errorLabel +
                        " is not implemented.");
            }
            
            if (!(usecase.id in actor.usecaseIndex)) {
                throw new Error(
                        "Actor [" + actor.actor + "] cannot " + errorLabel);
            }
            
            cache[cid] = found = new Process(info, actor, usecase);

            return found;
            
        }
        
    }
    
    return void(0);

}

function runActivity(process, activity, input, sequence) {
    var workflow = APPVITIY(activity),
        bus = BUS;
    workflow.usecase = process;
    return workflow.
            on("state-change",
                function (session, data) {
                    sequence[sequence.length] = data;
                    bus.publish("state-change", process, session, data);
                }).
            on("prompt",
                function (session, action, data) {
                    bus.publish("prompt", process, session, action, data);
                }).
            run(input).
                then(function (data) {
                    return data.toJS().response;
                });
}

function runForkMerge(process, input, sequence, names, index) {
    var Promise = PROMISE,
        getUsecase = USECASE,
        c = -1,
        l = names.length;
    var name, promises;
    
    if (l) {
        promises = [];
        
        for (; l--;) {
            name = names[++c];
            promises[c] = runCurrentActivity(
                                process,
                                getUsecase(index[name]),
                                input,
                                sequence);
        }
        
        return Promise.all(promises).
                then(function (data) {
                    var keys = names,
                        c = -1,
                        l = keys.length,
                        junction = {};
                    var name;
                    for (; l--;) {
                        name = keys[++c];
                        junction[name] = data[c];
                    }
                    return junction;
                });
    }
    
    return Promise.resolve(input);
}

function runCurrentActivity(process, info, input, sequence) {
    var activity = info.activity;
    var promise, generalized;
    // run extensions
    promise = runForkMerge(process,
                           input,
                           sequence,
                           info.extensionNames,
                           info.extensions);
    
    // run activity
    if (activity) {
        promise = promise.
                    then(function (data) {
                        return runActivity(process,
                                    activity,
                                    data,
                                    sequence);
                    });
    }
    // use generalized
    else {
        generalized = USECASE(info.generalized);
        promise = promise.
                    then(function (data) {
                        return runCurrentActivity(
                                    process,
                                    generalized,
                                    data,
                                    sequence);
                    });
    }
    
    
    // run includes
    return promise.
                then(function (data) {
                    var inf = info;
                    return runForkMerge(process,
                           data,
                           sequence,
                           inf.includeNames,
                           inf.includes);
                });
}


function Process(info, actor, usecase) {
    this.url = info.url;
    this.info = function (type) {
        var uc = usecase,
            inf = info;
        
        switch (type) {
        case 'url': return inf.url;
        case 'actor': return actor.actor;
        case 'system': return uc.system;
        case 'subject': return inf.subject;
        case 'usecase': return uc.usecase;
        case 'usecase-runtime': return uc;
        default: return void(0);
        }
    };
    
}

Process.prototype = {
    inputList: void(0),
    info: void(0),
    constructor: Process,
    run: function (data) {
        var sequence = [];
        return runCurrentActivity(this,
                            this.info('usecase-runtime'),
                            data,
                            sequence);
 
    },
    
    subscribe: function () {
        
    },
    
    answer: function (data) {
        
    }
};


module.exports = EXPORTS;
EXPORTS.actor = ACTOR;
EXPORTS.usecase = USECASE;