# Use-case

This library aims to effectively plan the software development by following [UML Use-case](https://en.wikipedia.org/wiki/Use_case) based on a rough User Story. Use-case manifests will be detailed later by adding use-case relationships and adding workflows using [Apptivity](https://github.com/diko316/apptivity).


## Installation
Use-case is packaged by npm. Source can be found in https://github.com/diko316/use-case

```sh
npm install use-case --save
```

## Usage

To better understand how to use this library, we are going to run through a quick start guide.

### Quick Start Guide

#### 1. Define all user stories in a script based on what your P.O. or your team has agreed for the project named **My Auth Website**.

1. *P.O.*: As a **visitor**, I can **visit** the **public** area of the system.
2. *Team mate*:  As a **visitor** or **guest**, I can **login** and change my role into **admin**.
3. *P.O.*: As an **admin**, I can **logout** and change my role back into **visitor**.
4. *P.O.*: As an **admin**, I can **update** my profile in the **users** control panel.

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


#### 2. Detail the use-cases and their activities.


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


#### 3. Try running one of the use-case that was completely defined with activity.

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

## API

#### Core
Static methods defined in `USECASE` when requiring the library with `var USECASE=require("use-case");`

##### USECASE(url:*String*):*Process*
Creates an instance of a Use-case `Process` that can run use-case based on the role and definition provided by `url` parameter.
> URL is in the form of `[system-name]://[role]@[subject]/[usecase]`

##### USECASE.system(name:*String*, [contextCallback:*Function*]):*systemDefinitionAPI*
Defines a `system` from provided `name` parameter if it doesn't exist and returns system definition end point. Optional `contextCallback` parameter is used to access concurrent `system` definitions, preprocess, and configurations inside that function.


Example in CommonJS

**lib/my-website/definitions.js**

```javacript
module.exports = function(system) {
	system.as("guest").
            emulating("visitor");
};
```

**lib/my-website/index.js**
```javascript
var USECASE = require("use-case");

USECASE.system("my-website", require("./definition.js"));
```

##### USECASE.subscribe(url:*String|RegExp*, event:*String|RegExp*, handler:Function):*Function*
Subscribes an `event` to specific use-case defined by `url` parameter. Available events are the following:

> **process-start** (**process**:*Process*, **url**:*String*, **input**:*Mixed*)
> - Dispatched before use-case has starts to run.
>
> **process-end** (**process**:*Process*, **url**:*String*, **output**:*Mixed*)
> - Dispatched after use-case has finished running.
>
> **state-change** (**process**:*Process*, **state**:*Immutable*)
> - Dispatched when state changes after processing use-case workflow activities.
>
> **prompt** (**process**:*Process*, **action**:*String*, **initialInput**:*Mixed*)
> - Dispatched when currently running use-case workflow activity is waiting for an `input`. It can be answered by calling `process.answer(myNewInput)`.
>
> **answer** (**process**:*Process*, **action**:*String*, **newInput**:*Mixed*)
> - Dispatched when use-case workflow input has been answered.
>
> **process-create** (**process**:*Process*)
> - Dispatched after Process is instantiated.
>
> **process-destroy** (**process**:*Process*)
> - Dispatched before Process is destroyed undergoing destruction phase.

##### USECASE.activity(activityName:*String*):*Activity*

Defines `Activity` used for options parameters in **condition** activity or sub-processes parameters in **fork** activity. The same method defined in [apptivity.activity()](https://github.com/diko316/apptivity) package.

(To be continued... very sleepy!)

## License

[MIT](https://opensource.org/licenses/MIT)
