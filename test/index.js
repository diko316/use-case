'use strict';

var USECASE = require('../index.js');


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
                
                
app.activity('public', 'login as admin').
        action('showLoginPage').
        input('authInfo').
        action('authenticate');

//console.log('exist? ', app.hasActivity('public', 'login'));
        
//USECASE.run('my-system://guest@public/login as admin', { name: 'test' });

//console.log(
//    require('util').
//        inspect(app.definition, { depth: 10, breakLength: 1 })
//);