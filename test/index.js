'use strict';

var USECASE = require('../index.js');

//USECASE.subscribe(/./,/./,
//    function (process) {
//        console.log('*********************************', process.info("url"));
//        console.log('all events: ', Array.prototype.slice.call(arguments, 1));
//        console.log('*********************************');
//    });

var app = USECASE.system('my-system');

app.as('guest').
        emulating('visitor', 'unknown').
        accessing('public area').
            can('login').
            can('test usecase');
            
app.as('visitor').
        accessing('public area').
            can('visit sites').
                soThat(
                    'We can show that this works',
                    'As tested');

app.subject('public area').
            usecase('login').
                extend('get auth').
                include('server authenticate');
                
                
app.activity('public area', 'login').
        action('authenticate');
        
app.activity('public area', 'get auth').
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

app.activity('public area', 'server authenticate').
        action('auth to server').
            handler(function (data) {
                console.log('   !! authenticating to server ', data);
                return data;
            });

USECASE.subscribe(
    "usecase=login",
    "state-change",
    function (process, data) {
        console.log("state change", data.toJS());
    });
    
var process = USECASE('My system://guest@public area/login');

process.subscribe('state-change',
    function (process, data) {
        //console.log("state change", data.toJS());
    });

process.subscribe('prompt',
    function (process) {
        //console.log('answering prompt!', process.info('prompt'),
        //        ' state: ', process.currentState());
        process.answer({ name: 'my input!' });
        
        //process.destroy();
    });

process.run({ name: 'test' }).
    then(function () {
        console.log("*******************************************");
        console.log("start again! ");
        process.reset().
            next();

    });


//console.log('exist? ', app.hasActivity('public', 'login'));
        
//USECASE.run('my-system://guest@public/login as admin', { name: 'test' });

//USECASE.finalize('my system://public/test login');
//console.log(USECASE.finalizeActor('my-system', 'guest'));

//console.log(USE)
//console.log(
//    require('util').
//        inspect(app.definition, { depth: 10, breakLength: 1 })
//);