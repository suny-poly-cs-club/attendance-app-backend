import {PostgresErrorCode} from './database.js';

import {object, string, email, minLength, maxLength, safeParse, flatten} from 'valibot';
import { mapValibotToFormError } from './util/err.js';

const RegisterSchema = object({
  firstName: string([
    maxLength(80, 'first name exceeds max length'),
  ]),
  lastName: string([
    maxLength(80, 'last name exceeds max length'),
  ]),
  email: string([
    email('not a valid email address'),
    maxLength(254, 'email exceeds max length'),
  ]),
  password: string([
    minLength(5, 'password must be at least 5 characters long'),
  ]),
});

const LoginSchema = object({
  email: string([
    email('not a valid email address'),
  ]),
  password: string(),
});

export const postEndpoints = (app, options ,done) =>{
	app.post("/sign-up",async (request,reply) =>{
    // email
    // firstName
    // lastName
    // password

		let database = request.ctx.db;

    const result = safeParse(RegisterSchema, request.body);
    if (!result.success) {
      return reply.status(400).send(mapValibotToFormError(result.issues));
    }

		// let email = request.body.email;
		// let firstName = request.body.firstName;
		// let lastName = request.body.lastName;
		// let password = request.body.password;

    try {
      // var user = await database.registerUser({firstName, lastName, email, password});
      var user = await database.registerUser(result.output);
    } catch (err) {
      if (err.code === PostgresErrorCode.UniqueViolation) {
        reply.status(409); // 409 Conflict -- resource already exists
        return {
          message: 'an account with this email already exists'
        };
      }

      // if the error isn't that an account already exists, we don't know
      // how to handle it, so just log it and give 500

      console.error('Unhandled error:', err);

      reply.status(500);
      return {message: 'internal server error'};
    }

		let token = request.ctx.authManager.createToken(user);

		reply.status(200);
    return {token};
	});

	app.post("/login",async (request,reply) =>{
		let database = request.ctx.db;

    const result = safeParse(LoginSchema, request.body);
    if (!result.success) {
      return reply.status(400).send(mapValibotToFormError(result.issues));
    }

		// let loginSuccess = await database.isUserPasswordValid(result.output);
    const user = await database.getUserFromLogin(result.output);

		if(user) {
			let token = request.ctx.authManager.createToken(user);

      reply.status(200);
      return {token};
		} else {
			reply.code(401);
			return {message: 'incorrect email or password'};
		}
	});

	app.get("/gopost", (request,reply) =>{
		reply.type("text/html");
		return '<html> 	<head> 		<style> 			.main { 				margin: 1%; 				height: 98%; 			} 			.inputs { 				background: lightgray; 				padding: 1%; 			} 			.responce { 				padding: 0.5%; 				font-size: larger; 				width: 99%; 				background: lightgray; 				height: 60%; 			} 			.status { 				font-size: larger; 			} 			table.inputTable { 				border-spacing: 1em; 			} 			input.inputBox { 				width: 500%; 				padding: 5%; 				border-radius: 1em; 				border-width: 1px; 				font-size: medium; 			} 		</style> 		<script>\nfunction postit(){\nvar ajaxRequest = new XMLHttpRequest();\najaxRequest.onreadystatechange = function(){\nif(ajaxRequest.readyState == 4){\ndocument.querySelector(".responce").innerHTML=ajaxRequest.responseText;\ndocument.querySelector(".statusCode").innerHTML="status: "+ajaxRequest.status;\n}\n}\najaxRequest.open("POST", document.querySelector(".url").value);\nvar headers1 = document.querySelector(".headers").value.split(",");\nfor(var i =0 ; i < headers1.length;i++){\nvar data = headers1[i].split(":");\najaxRequest.setRequestHeader(data[0],data[1]);\n}\najaxRequest.setRequestHeader("Content-type", document.querySelector(".contentType").value);\najaxRequest.send(document.querySelector(".data").value);\n}\n</script> 	</head> 	 	<body> 		<div class="main"> 			<div class="inputs"> 				<table class="inputTable"> 					<tr> 						<td>URL to post to:</td> 						<td><input class="url inputBox"/></td> 					</tr> 					<tr> 						<td>Post data:</td> 						<td><input class="data inputBox"/></td> 					</tr> 					<tr> 						<td>Content type:</td> 						<td><input class="contentType inputBox"/></td> 					</tr> 					<tr> 						<td>Headers:</td> 						<td><input class="headers inputBox"/></td> 					</tr> 				</table> 				 				<button onclick="postit()" style="padding: .5%;width: 70%;background: red;font-weight: bold;"> POST </button> 			</div> 			<div class="status"> 				<br> 				<span class="statusCode">status:</span> 				<br><br>responce: 			</div> 			<div class="responce"> 			 			</div> 		</div> 	</body> </html>';
	});
	done();
}
