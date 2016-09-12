'use strict';

var USECASE = require('../index.js');


var app = USECASE.system('my-system');

app.as('guest').
        emulating('visitor', 'unknown').
        accessing('public').
            can('login').
            can('test usecase');
            
app.as('visitor').
        accessing('public').
            can('visit sites').
                soThat(
                    'We can show that this works',
                    'As tested');

app.subject('public').
            usecase('login').
                extend('get auth').
                include('server authenticate');
                
                
app.activity('public', 'login').
        action('authenticate');
        
app.activity('public', 'get auth').
        action('showLoginPage').
            handler(function (data) {
                console.log('   !! showing login page ', data);
                return data;
            }).
        input('authInfo').
            handler(function (data) {
                console.log('   !! auth data input ', data);
                return data;
            });

app.activity('public', 'server authenticate').
        action('auth to server').
            handler(function (data) {
                console.log('   !! authenticating to server ', data);
                return data;
            });
        
        
var process = USECASE('my-system://guest@public/login');

process.subscribe('prompt',
    function (process) {
        console.log('answering prompt!', process.info('prompt'),
                ' state: ', process.currentState());
        process.answer({ name: 'my input!' });
        
        //process.destroy();
    });
process.run({ name: 'test' });


//console.log('exist? ', app.hasActivity('public', 'login'));
        
//USECASE.run('my-system://guest@public/login as admin', { name: 'test' });

//USECASE.finalize('my system://public/test login');
//console.log(USECASE.finalizeActor('my-system', 'guest'));

//console.log(USE)
//console.log(
//    require('util').
//        inspect(app.definition, { depth: 10, breakLength: 1 })
//);