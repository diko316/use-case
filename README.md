# Use-case

This library aims to effectively plan the software development by following [UML Use-case](https://en.wikipedia.org/wiki/Use_case) based from User Stories. Use-case manifests will be detailed later by adding use-case relationships and activity workflows using [Apptivity](https://github.com/diko316/apptivity) package.


## Installation
Use-case is packaged by npm. Source can be found in [github repository](https://github.com/diko316/use-case).

```sh
npm install use-case --save
```

## Usage

To better understand how to use this library, we are going to run through a quick start guide.

### Quick Start Guide

#### 1. Translate User Stories into Use-case manifest using [use-case](https://www.npmjs.com/package/use-case) definition objects.
The following are the User Stories gathered from the **My Auth Website** app.

1. As a **visitor**, I can **visit** the **public** area of the system.
2. As a **visitor** or **guest**, I can **login** and change my role into **admin**.
3. As an **admin**, I can **logout** and change my role back into **visitor**.
4. As an **admin**, I can **update** my profile in the **users** control panel.

Below is the sample translation of User Stories into Use-cases using [use-case](https://www.npmjs.com/package/use-case) definition object.

```javascript
var USECASE = require("use-case");
USECASE.system("My Auth Website").
        as("guest").
            emulating("visitor").
        as("visitor").
            accessing("public area").
                can("visit web pages").
                can("login").
                    soThat("I can change my role into admin.",
                    		"Or, change role depending on what is assigned after server authentication.").
        as("admin").
            accessing("private area").
                can("logout").
                    soThat("I can be a visitor/guest again.").
            accessing("users control")
                can("update my profile").
                    soThat("I can customize my something-whatever.");
```


#### 2. Further detail the Use-cases and Activities.
Use-cases can be defined further into `subjects` namespace and specific `use-case`. When usecases and it's relationships are all defined, their equivalent activities should also be defined to complete the whole Use-case definitions. 

```javascript
var myApp = USECASE.system("My auth website");

// don't worry, system, subject, usecase, and actors are case-insensitive
myApp.subject("Public area").
		usecase("navigate").
        usecase("login").
        	extend("get auth info"),
            include("authenticate");

// here you're going to define activity of the defined usecases
myApp.activity("public area", "navigate").
		input("choosePage").
        action("navigate");

myApp.activity("public area", "login").
		action("validate");

myApp.activity("public area", "get auth info").
		action("showLoginPage").
        input("authData");

myApp.activity("public area", "authenticate").
		action("authenticate").
        	handler(function (input) {
            	console.log("authenticating to backend? ", input);
            	return client.authToBackend(input);
            }).
		action("setAuthToken");
```

> The example above is for demo purposes only. That is why, Activity definitions and implementations were defined in one script file. The best practice in coding [Apptivity](https://diko316.github.io/apptivity) is to split definitions (like the `action("setAuthToken");` line above.) from implementations using [Apptivity.task(name:String, runner:Function)](https://diko316.github.io/apptivity/#namedTask) method in a separate implementation script file.

#### 3. Run a completely defined Use-case.
Complete Use-cases are use-cases having complete definitions of Actor, Subject, optional Usecase relationships, and Activity within the System. Use-cases cannot run using the code below if it is not completely defined.

```javascript

USECASE("My auth website://guest@public area/visit web pages").
	on("state-change",
    	function (process, state) {
        	console.log("current state ", state.toJS());
        }).
    on("prompt",
    	function (process, action, initialInput) {
        	console.log("what to do with prompts? ", action, initialInput);
            process.answer({ value: "my answer to this prompt." });
        }).
    run({ page: "/about_us.html" }).
        then(function (result) {
            console.log("showing about us? ", result);
            return result;
        },
        function (error) {
            console.log('yes! an error!', error);
            return Promise.reject(error);
        });

```

## Documentation

Detailed documentation including API can be found [here](https://diko316.github.io/use-case).

## License

This Project is fully Open Source [MIT licensed](https://opensource.org/licenses/MIT).
