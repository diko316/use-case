'use strict';

var USECASE = require('./index.js');



var app = USECASE('my-system');

app.as('guest').
        emulating('visitor', 'unknown').
        accessing('public').
            can('visit sites').
                soThat(
                    'We can show that this works',
                    'As tested').
            
            can('login as admin');
            
            


app.subject('public').
            usecase('login').
                extend('login as admin');

console.log(
    require('util').
        inspect(usecase.definition, { depth: 10, breakLength: 1 })
);