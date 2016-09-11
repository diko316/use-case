'use strict';

var APPVITIY = require("apptivity"),
    PROMISE = require("bluebird"),
    INTERESTING = require("interesting"),
    INFO = require("./info.js"),
    ACTOR = require("./actor.js"),
    USECASE = require("./usecase.js"),
    BUS = INTERESTING(),
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

function passthrough(process, activity, sequence) {
    return function (input) {
        return runActivity(process, activity, input, sequence);
    };
}

//function convertToJS(data) {
//    return Object.prototype.toString.call(data) === '[object Object]' &&
//            data.toJS instanceof Function ?
//                data.toJS() : data;
//}

//function runAsExtension(process, activity, input, sequence, name, junction) {
//    return runActivity(process, activity, input, sequence).
//                then(function (data) {
//                    junction[name] = data;
//                    return data;
//                });
//}


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
        var me = this,
            Promise = PROMISE,
            info = me.info('usecase-runtime'),
            sequence = [],
            run = runActivity,
            pass = passthrough;
        var name, names, index, c, l, item, promises, promise;
        
        // run extensions
        names = info.extensionNames;
        index = info.extensions;
        l = names.length;
        if (l) {
            promises = [];
            for (c = -1; l--;) {
                name = names[++c];
                item = index[name];
                promises[c] = run(me, item.activity, data, sequence);
            }
            promise = Promise.all(promises).
                        then(function (data) {
                            var keys = names,
                                c = -1,
                                l = keys.length,
                                returnValue = {};
                            var name;
                            for (; l--;) {
                                name = keys[++c];
                                returnValue[name] = data[c];
                            }
                            return returnValue;
                        });
        }
        else {
            promise = Promise.resolve(data);
        }
        
        // run main activity
        promise.then(function (data) {
            return run(me, info.activity, data, sequence);
        });
        
        names = info.includeNames;
        index = info.includes;
        
        for (c = -1, l = names.length; l--;) {
            promise = promise.then(
                        pass(me, index[names[++c]].activity, sequence));
        }
        
        return promise;
    },
    
    subscribe: function () {
        
    },
    
    answer: function (data) {
        
    }
};


module.exports = EXPORTS;
EXPORTS.actor = ACTOR;
EXPORTS.usecase = USECASE;