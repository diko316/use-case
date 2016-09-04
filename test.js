'use strict';

var USECASE = require('./index.js');



var usecase = USECASE('my-system');

usecase.as('guest').
        accessing('public').
            can('visit sites').
                soThat(
                    'We can show that this works',
                    'As tested').
            
            can('login as admin');

usecase.subject('public').
            usecase('login').
                extend('login as admin');

console.log(
    require('util').
        inspect(usecase.definition, { depth: 10, breakLength: 1 })
);