import {PostgresErrorCode} from './database.js';

export const postEndpoints = (app, options ,done) =>{
	app.post("/sign-up",async (request,reply) =>{
    // email
    // firstName
    // lastName
    // password

		let database = request.ctx.db;

		let email = request.body.email;
		let firstName = request.body.firstName;
		let lastName = request.body.lastName;
		let password = request.body.password;

    try {
      var user = await database.registerUser({firstName, lastName, email, password});
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

		let email = request.body.email;
		let password = request.body.password;

		let loginSuccess = await database.isUserPasswordValid({email, password});

		if(loginSuccess) {
			let user = await database.getUserByEmail(email);
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
		return '<html> 	<head> 		<style> 			.main { 				margin: 1%; 				height: 98%; 			} 			.inputs { 				background: lightgray; 				padding: 1%; 			} 			.responce { 				padding: 0.5%; 				font-size: larger; 				width: 99%; 				background: lightgray; 				height: 60%; 			} 			.status { 				font-size: larger; 			} 			table.inputTable { 				border-spacing: 1em; 			} 			input.inputBox { 				width: 500%; 				padding: 5%; 				border-radius: 1em; 				border-width: 1px; 				font-size: medium; 			} 		</style> 		<script> 			function postit(){\nvar ajaxRequest = new XMLHttpRequest();\najaxRequest.onreadystatechange = function(){\nif(ajaxRequest.readyState == 4){\ndocument.querySelector(".responce").innerHTML=ajaxRequest.responseText;\ndocument.querySelector(".statusCode").innerHTML="status: "+ajaxRequest.status;\n}\n}\najaxRequest.open("POST", document.querySelector(".url").value);\najaxRequest.setRequestHeader("Content-type", document.querySelector(".contentType").value);\najaxRequest.send(document.querySelector(".data").value);\n}\n</script> 	</head> 	 	<body> 		<div class="main"> 			<div class="inputs"> 				<table class="inputTable"> 					<tr> 						<td>URL to post to:</td> 						<td><input class="url inputBox"/></td> 					</tr> 					<tr> 						<td>Post data:</td> 						<td><input class="data inputBox"/></td> 					</tr> 					<tr> 						<td>Content type:</td> 						<td><input class="contentType inputBox"/></td> 					</tr> 				</table> 				 				<button onclick="postit()" style="padding: .5%;width: 70%;background: red;font-weight: bold;"> POST </button> 			</div> 			<div class="status"> 				<br> 				<span class="statusCode">status:</span> 				<br><br>responce: 			</div> 			<div class="responce"> 			 			</div> 		</div> 	</body> </html>';
	});
	done();
}
