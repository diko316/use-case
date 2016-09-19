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

> The example above is for demo purposes only. That is why, Activity definitions and implementations were defined in one script file. The best practice in coding [Apptivity](https://www.npmjs.com/package/apptivity) is to split definitions (like the `action("setAuthToken");` line above.) from implementations using [Apptivity.task(name:String, runner:Function)](https://www.npmjs.com/package/apptivity#namedTask) method in a separate implementation script file.

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

## API

### Main USECASE `Function` and method properties.

The following are the methods defined in `USECASE` object found in the examples above.

##### USECASE(url:*String*):*Process*
Creates an instance of a Use-case `Process` using system, actor, subject and usecase info extracted from the `url` parameter.

`url` string syntax is `[system-name]://[actor]@[subject]/[usecase]`.


##### USECASE.system(name:*String*, [contextCallback:*Function*]):*SystemDefinition*
Defines a `system` named after its `name` parameter. If system do not exist, the method will create one. Optional `contextCallback` parameter is used to access concurrent `system` definitions, preprocess, and configurations inside the callback function.


Example of organizing modules in CommonJS 


**lib/my-website/definitions.js**

```javascript
const USECASE = require("use-case");

USECASE.system("my-website",
			require("./definition.js"));

// ... and other definitions
```

**lib/my-website/route/guest.js**
```javascript
module.exports = function(system) {

system.as("guest").
            emulating("visitor");
};

```

##### USECASE.subscribe(filter:*String*, event:*String|RegExp*, handler:Function):*Function*
Subscribes a Process `event` filtered by `filter` parameter.

`filter` parameter syntax is: `"system=[system-name], actor=[actor-name], subject=[subject-name], usecase|use-case=[use-case-name]"`. All comma-separated `"name=value"` pairs are optional. If `filter` string is malformed, event subscription matches all running process.

Available events are the following:

> **process-create** (**process**:*Process*)
> - `"process-create"` event is dispatched after Process is instantiated.
>
> **process-destroy** (**process**:*Process*)
> - `"process-destroy"` event is dispatched before Process is destroyed undergoing destruction phase.
>
> **process-start** (**process**:*Process*, **url**:*String*, **input**:*Mixed*)
> - `"process-start"` event is dispatched before use-case process starts running.
>
> **process-end** (**process**:*Process*, **url**:*String*, **output**:*Mixed*)
> - `"process-end"` event is dispatched after use-case process has finished running.
>
> **state-change** (**process**:*Process*, **state**:*Immutable*)
> - `"state-change"` event is dispatched when use-case process changes state data. State data are [Immutable](https://www.npmjs.com/package/immutable) objects based from published events of a running [apptivity](https://www.npmjs.com/package/apptivity) workflow session.
>
>  The immutable state data object has the following properties:

```javascript
var stateData = Immutable.fromJS({
	url: "[system-name]://[actor]@[subject]/[usecase]",
	activity: "[system-name]://[subject]/[usecase]",
    action: "[apptivity-action-name]",
    state: "[apptivity-fsm-state]",
    input: { ... [apptivity action input] },
  	data: { ... [apptivity action output] }
});
```

> **prompt** (**process**:*Process*, **action**:*String*, **initialInput**:*Mixed*)
> - `"prompt"` event is dispatched when currently running workflow session is waiting for an `input`. It can be answered by calling `process.answer(myInput)` or manually calling `workflowSession.answer(myInput)` if workflow session is accessible.
>
> **answer** (**process**:*Process*, **action**:*String*, **newInput**:*Mixed*)
> - `"answer"` event is dispatched when workflow session `input` has been answered.
>


##### USECASE.activity(activityName:*String*):*Activity*

Defines an `Activity` used as option parameters of `condition` action or sub-processe parameters of `fork` action.

This method is an alias of [apptivity.activity(name:String)](https://www.npmjs.com/package/apptivity#workflowactivityactivitynamestringactivity) .

### System Definition Object

#### systemDefinition.as(actorName:*String*, [contextCallback:*Function*]):*ActorDefinition*

#### systemDefinition.subject(subjectName:*String*, [contextCallback:*Function*]):*SubjectDefinition*

#### systemDefinition.activity(activityName:*String*, usecaseName:*String*, [contextCallback:*Function*]):*ActivityDefinition*

(To be continued... very sleepy!)

## License

[MIT](https://opensource.org/licenses/MIT)
