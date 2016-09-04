'use strict';

var VALID_NAME_RE = /^[a-z]+([ \-\_]?[a-z0-9]+)*$/i,
    NORMALIZE_NAME_RE = /[ \-]/g,
    S = String.prototype,
    STR_REPLACE = S.replace;

function validName(str) {
    return VALID_NAME_RE.test(str);
}

function normalizeName(str) {
    return STR_REPLACE.
                call(str, NORMALIZE_NAME_RE, '_').
                toLowerCase();
}


module.exports = {
    
    validString: function (str, allowEmpty) {
        return typeof str === 'string' &&
                (allowEmpty === true || str.length > 0);
    },
    
    validSystemName: validName,
    
    validActorName: validName,
    
    validSubjectName: validName,
    
    validUsecaseName: validName,
    
    normalizeName: normalizeName
};