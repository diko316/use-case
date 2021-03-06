'use strict';

var APPVITIY = require("apptivity"),
    PROMISE = require("bluebird"),
    IMMUTABLE = require("immutable"),
    EventEmitter = require("eventemitter3"),
    BUS = require("../bus.js"),
    INFO = require("./info.js"),
    ACTOR = require("./actor.js"),
    USECASE = require("./usecase.js"),
    PROCESS_CACHE = {},
    PROCESS_ID_GEN = 0,
    STATE_CACHE = {},
    EXPORTS = instantiate;
    
function EMPTY() {
    
}

function instantiate(url) {
    var info = INFO(url),
        cache = PROCESS_CACHE;
    var cid, definition, found, actor, usecase, errorLabel;
    
    if (info) {
        url = info.url;
        
        cid = ':' + url;
        if (!(cid in cache)) {
        
            definition = info.definition;
            
            if (!definition) {
                throw new Error(
                "Incomplete [url] parameter doesn't contain usecase [system]");
            }
            
            if (!definition.actor) {
                throw new Error(
                "Incomplete [url] parameter doesn't contain usecase [actor]");
            }
            
            if (!definition.subject) {
                throw new Error(
                "Incomplete [url] parameter doesn't contain usecase [subject]");
            }
            
            if (!definition.usecase) {
                throw new Error(
                "Incomplete [url] parameter doesn't contain [usecase]");
            }
                
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
            
            if (!(usecase.id in actor.usecaseIndex)) {
                throw new Error(
                        "Actor [" + actor.actor + "] cannot " + errorLabel);
            }
            
            cache[cid] = [info, actor, usecase];

        }
        
        found = cache[cid];
        
        return new Process(found[0], found[1], found[2]);
        
    }
    
    return void(0);

}

function runActivity(process, activity, input) {
    var workflow = APPVITIY(activity),
        bus = BUS;
    
    return workflow.

            on("state-change",
                // params: session, data
                function () {
                    var data = arguments[1],
                        current = process;
                    var sequence, previous, id, list;
                    
                    if (!current.info('destroyed')) {
                        id = current.id;
                        list = STATE_CACHE;
                        sequence = list[id];
                        previous = sequence;
                        
                        data = data.toJS();
                        data = IMMUTABLE.fromJS({
                            url: current.info('url'),
                            activity: activity,
                            action: data.action,
                            state: data.state,
                            input: data.request,
                            data: data.response
                        });

                        sequence = list[id] = {
                            state: data,
                            previous: sequence,
                            next: null
                        };
                        
                        if (previous) {
                            previous.next = sequence;
                        }
                        
                        bus.publish("state-change", process, data);
                    }
                }).
            
            on("prompt",
                function (session, action, data) {
                    var current = process;
                    if (!current.info('destroyed')) {
                        STATE_CACHE[current.id].prompt = {
                            activity: activity,
                            action: action,
                            session: session,
                            initial: data,
                            answer: null
                        };
                        bus.publish("prompt", current, action, data);
                    }
                }).
            
                        
            on("answer",
                // params: session, action, data
                function () {
                    var params = arguments,
                        action = params[1],
                        data = params[2],
                        current = process;
                    if (!current.info('destroyed')) {
                        STATE_CACHE[current.id].prompt.answer = data;
                        bus.publish("answer", current, action, data);
                    }
                    params = null;
                    data = null;
                }).
            
            runOnce(input, process).
                then(function (data) {
                    var current = process;
                    if (!current.info('destroyed')) {
                        data = data.toJS().response;
                    }
                    return data;
                });
}

function runForkMerge(process, input, names, index) {
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
                                input);
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

function runCurrentActivity(process, info, input) {
    var activity = info.activity,
        Promise = PROMISE;
    var promise, generalized;
    // run extensions
    promise = runForkMerge(process,
                           input,
                           info.extensionNames,
                           info.extensions);
    
    // run activity
    if (activity) {
        promise = promise.
                    then(function (data) {
                        var current = process;
                        if (current.info('destroyed')) {
                            return Promise.reject(
                                "Process is already destroyed."
                            );
                        }
                        return runActivity(current,
                                            activity,
                                            data);
                    });
    }
    // use generalized
    else {
        generalized = USECASE(info.generalized);
        promise = promise.
                    then(function (data) {
                        var current = process;
                        if (current.info('destroyed')) {
                            return Promise.reject(
                                "Process is already destroyed."
                            );
                        }
                        return runCurrentActivity(current,
                                                    generalized,
                                                    data);
                    });
    }
    
    // run includes
    return promise.
                then(function (data) {
                    var inf = info,
                        current = process;
                    if (current.info('destroyed')) {
                        return Promise.reject(
                            "Process is already destroyed."
                        );
                    }
                    return runForkMerge(current,
                                        data,
                                        inf.includeNames,
                                        inf.includes);
                });
}


function Process(info, actor, usecase) {
    var me = this,
        event = new EventEmitter(),
        id = 'process' + (++PROCESS_ID_GEN),
        cache = STATE_CACHE;
    
    cache[id] = null;
    me.id = id;
    me.url = info.url;
    me.info = function (type) {
        var uc = usecase,
            inf = info;
        var prompt;
        
        switch (type) {
        case 'url': return inf.url;
        case 'actor': return actor.actor;
        case 'system': return uc.system;
        case 'subject': return inf.subject;
        case 'usecase': return uc.usecase;
        case 'usecase-runtime': return uc;
        case 'event': return event;
        case 'destroyed': return false;
        case 'prompt':
                inf = cache[me.id];
                prompt = info && info.prompt;
                return prompt ? {
                            activity: prompt.activity,
                            action: prompt.action,
                            initial: prompt.initial
                        } : null;
                        
        default: return void(0);
        }
    };
    
    BUS.publish("process-create", me);
    
}

Process.prototype = {
    sequence: null,
    running: false,
    
    constructor: Process,
    
    info: function (type) {
        return type === 'destroyed' ? true : void(0);
    },
    
    currentState: function () {
        var me = this;
        var data;
        if (!me.info('destroyed')) {
            data = STATE_CACHE[me.id];
            if (data) {
                return data.state.toJS();
            }
        }
        return null;
    },
    
    run: function (data) {
        var me = this,
            bus = BUS,
            Promise = PROMISE,
            url = me.info('url');
        var event;
        
        if (me.info('destroyed')) {
            return Promise.reject(new Error("Process is already destroyed."));
        
        }
        else if (!me.running) {
            STATE_CACHE[me.id] = null;
            event = me.info('event');
            
            bus.publish("process-start", me, url, data);
            event.emit('start', me);
            me.running = true;
            
            return runCurrentActivity(me,
                                me.info('usecase-runtime'),
                                data).
                    then(function (data) {
                        var current = me;
                        delete current.running;
                        if (!current.info('destroyed')) {
                            bus.publish("process-end", current, url, data);
                            event.emit('end', current);
                        }
                        return data;
                    });
        }
        
        return Promise.reject(new Error("Process is still running"));
    },
    
    runOnce: function () {
        var me = this;
        return me.run.apply(me, arguments).
                    then(function(data) {
                        me.destroy();
                        return data;
                    });
    },
    
    reset: function () {
        var me = this,
            cache = STATE_CACHE;
        var pointer, id;
            
        if (me.info('destroyed')) {
            throw new Error("Process is already destroyed.");
        }
        else if (me.running) {
            throw new Error("Process is still running");
        }
        id = me.id;
        pointer = cache[id];
        if (pointer) {
            for (; pointer.previous; pointer = pointer.previous) {}
            cache[id] = pointer;
        }
        return me;
    },
    
    current: function () {
        var me = this,
            bus = BUS;
        var pointer, url, state, prompt, promptAction;
        
        if (me.info('destroyed')) {
            throw new Error("Process is already destroyed.");
        }
        else if (me.running) {
            throw new Error("Process is still running");
        }

        pointer = STATE_CACHE[me.id];
        if (pointer) {
            
            url = me.info('url');
            state = pointer.state;
            prompt = pointer.prompt;
            
            if (!pointer.previous) {
                bus.publish("process-start", me,
                                            url,
                                            state.toJS().input);
            }
            
            if (prompt) {
                promptAction = prompt.action;
                
                bus.publish("prompt", me,
                                    promptAction,
                                    prompt.initial);
                
                bus.publish("answer", me,
                                    promptAction,
                                    prompt.answer);
            }
            
            bus.publish("state-change", me, state);
            
            if (!pointer.next) {
                bus.publish("process-end", me,
                                            url,
                                            state.toJS().data);
            }
        }
        return me;
    },
    
    previous: function () {
        var me = this,
            cache = STATE_CACHE;
        var pointer;
        
        if (me.info('destroyed')) {
            throw new Error("Process is already destroyed.");
        }
        else if (me.running) {
            throw new Error("Process is still running");
        }
        
        pointer = cache[me.id];
        if (pointer) {
            pointer = pointer.previous;
            if (pointer) {
                cache[me.id] = pointer;
                me.current();
            }
        }
        
        return me;
        
    },
    
    next: function () {
        var me = this,
            cache = STATE_CACHE;
        var pointer;
        
        if (me.info('destroyed')) {
            throw new Error("Process is already destroyed.");
        }
        else if (me.running) {
            throw new Error("Process is still running");
        }
        
        pointer = cache[me.id];
        if (pointer) {
            pointer = pointer.next;
            if (pointer) {
                cache[me.id] = pointer;
                me.current();
            }
        }
        
        return me;
    },
    
    subscribe: function (event, handler) {
        var me = this;
        var returnValue;
        
        if (!me.info('destroyed')) {
            if (!event ||
                (typeof event !== 'string' && !(event instanceof RegExp))) {
                throw new Error("Invalid [event] name parameter");
            }
            
            if (!(handler instanceof Function)) {
                throw new Error("Invaid [handler] parameter");
            }
            
            returnValue = BUS.subscribe(event,
                        function (process) {
                            if (process === me) {
                                handler.apply(null, arguments);
                            }
                        });
            
            me.info('event').
                once('destroy',
                    function () {
                        returnValue();
                    });

            return returnValue;
        }
        
        return EMPTY;
    
    },
    
    answer: function (data) {
        var me = this;
        var info, prompt;
            
        if (!me.info('destroyed')) {
            info = STATE_CACHE[me.id];
            prompt = info && info.prompt;
            if (prompt && prompt.session) {
                prompt.session.answer(data);
            }
        }
        
        return me;
    },
    
    destroy: function () {
        var me = this;
        var event;
        if (!me.info('destroyed')) {
            event = me.info('event');
            
            // wait for process to complete the run
            if (me.running) {
                event.once('end',
                    function (me) {
                        me.destroy();
                    });
            }
            // destroy
            else {
                BUS.publish("process-destroy", me);
                event.emit('destroy', me);
                delete STATE_CACHE[me.id];
                delete me.info;
                delete me.sequence;
                delete me.running;
            }
        }
        return me;
    }
    
};


module.exports = EXPORTS;
