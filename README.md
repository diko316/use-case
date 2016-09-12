# Use-case

This library aims to effectively plan the software development by following [UML Use-case](https://en.wikipedia.org/wiki/Use_case) based on a rough User Story. Use-case manifests will be detailed later by adding use-case relationships and adding workflows using [Apptivity](https://github.com/diko316/apptivity).


## Installation
Use-case is packaged by npm. Source can be found in https://github.com/diko316/use-case

```sh
npm install use-case --save
```

## Usage

To understand better on how to use this library, we are going to run through a quick start guide.

### Quick Start Guide

1. Define all user stories in a script based on what your P.O. or your team has agreed for the project named **My Auth Website**.
	- *P.O.*: As a **visitor**, I can **visit** the **public** area of the system.
	- *Team mate*:  As a **visitor** or **guest**, I can **login** and change my role into **admin**.
	- *P.O.*: As an **admin**, I can **logout** and change my role back into **visitor**.
	- *P.O.*: As an **admin**, I can **update** my profile in the **users** control panel.
```javascript
var USECASE = require("use-case");
USECASE.system("My Auth Website").
        as("guest").
            emulating("visitor").
        as("visitor").
            accessing("public area").
                can("visit web pages").
                can("login").
                    soThat("I can change my role into admin.").
        as("admin").
            accessing("private area").
                can("logout").
                    soThat("I can be a visitor/guest again").
            accessing("users control")
                can("update my profile").
                    soThat("I can customize my something whatever");
```
2. Detail the use-cases and their activities.
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
3. Try running one of the use-case that was completely defined with activity.
```javascript
var process = USECASE("My auth website://guest@public-area/visit web pages");

process.run({ page: "/about_us.html" }).
        then(function (result) {
			console.log("showing about us? ", result);
            return result;
        },
        function (error) {
        	console.log('yes! an error!', error);
            return Promise.reject(error);
        });

```


(To be continued... very sleepy!)

## License

[MIT](https://opensource.org/licenses/MIT)
