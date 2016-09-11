'use strict';

var USECASE = require('../index.js');


var app = USECASE('my-system');

app.as('guest').
        emulating('visitor', 'unknown').
        accessing('public').
            can('login as admin').
            can('test login');
            
app.as('visitor').
        emulating('unknown').
        accessing('public').
            can('visit sites').
                soThat(
                    'We can show that this works',
                    'As tested');

app.subject('public').
            usecase('login').
                extend('login as admin').
            usecase('test login').
                generalize('login as admin');
                
                
app.activity('public', 'login as admin').
        action('showLoginPage').
        input('authInfo').
        action('authenticate');

//console.log('exist? ', app.hasActivity('public', 'login'));
        
//USECASE.run('my-system://guest@public/login as admin', { name: 'test' });

USECASE.finalize('my system://public/test login');
console.log(USECASE.finalizeActor('my-system', 'guest'));

//console.log(USE)
//console.log(
//    require('util').
//        inspect(app.definition, { depth: 10, breakLength: 1 })
//);