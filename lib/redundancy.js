'use strict';

var MAP = {},
    EXPORTS = set;

function get(ns, item) {
    var map = MAP,
        id = ':' + ns;
    var index;
        
    if (!(id in map)) {
        map[id] = {};
    }
    index = map[id];
    
    id = ':' + item;
    
    if (!(id in index)) {
        index[id] = {
            id: id,
            name: item,
            names: [],
            index: {}
        };
    }
    
    return index[id];
}

function set(ns, source, target) {
    var hasOwn = Object.prototype.hasOwnProperty;
    var name, sourceIndex, sourceNames, id, len, crc;
    
    source = get(ns, source);

    crc = hasCRC(ns, source.name, target);
    if (crc) {
        return [crc, target.name];
    }
    
    sourceIndex = source.index;
    sourceNames = source.names;
    len = sourceNames.length;
    id = ':' + target;
    
    if (!(id in sourceIndex)) {
        sourceIndex[id] = true;
        sourceNames[len++] = id;
    }

    sourceIndex[':' + target] = target;
    target = get(ns, target);
    
    for (name in target.index) {
        if (hasOwn.call(target, name) && !(name in sourceIndex)) {
            sourceIndex[name] = true;
            sourceNames[len++] = name;
        }
    }
    
    return false;
}

function hasCRC(ns, source, target) {
    var getInfo = get,
        sourceNames = [];
    var l, name;
    
    target = getInfo(ns, target);
    source = getInfo(ns, source);
    
    sourceNames = [source.id];
    sourceNames.push.apply(sourceNames, source.names);
    
    for (l = sourceNames.length; l--;) {
        name = sourceNames[l];
        if (name in target.index) {
            return name.substring(1, name.length);
        }
    }
    return false;

}


module.exports = EXPORTS;
EXPORTS.set = set;