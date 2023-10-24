import {Database} from './database.js';
export const postEndpoints = (app, options ,done) =>{
	app.post("/sign-up",async (request,reply) =>{
		let database = request.cxt.db;
		//email
		//first name
		//last name
		//student id
		//password
		let email = request.email;
		let firstName = request.firstName;
		let lastName = request.lastName;
		let id = request.studentID;
		let password = request.password;
		let user = await database.registerUser(firstName,lastName,email,password);
		let token request.ctx.authManager.createToken(user);
		
		
		reply.type("application/json");
		if(token.startsWith("error")){
			reply.status(401);
			return '{"success":false,"message":"'+token+'"}'
		}else{
			reply.status(200);
			return '{"success":true,"message":"","token":'+token+'}'
		}
	});
	
	app.post("/login",async (request,reply) =>{	
		let database = request.cxt.db;
		reply.type("application/json");
		let userEmail = request.email;
		let rawPassword = request.password;
		let saltedPassword = saltPassword(rawPassword);
		let userid = "DATABASE: GET USER ID FROM EMAIL";
		if(!userid){
			reply.code(403);
			return '{"status": false , "message":"invalid username or password"}'
		}
		let passwordFromDataBase = "DATABASE: GET PASSWORD BASAED ON USER ID"
		if(saltedPassword == passwordFromDataBase){
			let token = generateNewToken();
			return '{"status": true , "message": " ", "token": "'+token+'"}'
		}else{
			reply.code(403);
			return '{"status": false , "message":"invalid username or password"}'
		}

	});
	
	app.post("/check-in", async (request,reply) =>{
		let database = request.cxt.db;
		reply.type("application/json");
		var token = request.body.token;
		var qrCode = request.body.code;
		var success  = await database.checkInUser(token,qrCode);
		return '{"success": '+success+'}';	
	});
	 
	app.get("/gopost", (request,reply) =>{
		reply.type("text/html");
		return '<html> 	<head> 		<style> 			.main { 				margin: 1%; 				height: 98%; 			} 			.inputs { 				background: lightgray; 				padding: 1%; 			} 			.responce { 				padding: 0.5%; 				font-size: larger; 				width: 99%; 				background: lightgray; 				height: 60%; 			} 			.status { 				font-size: larger; 			} 			table.inputTable { 				border-spacing: 1em; 			} 			input.inputBox { 				width: 500%; 				padding: 5%; 				border-radius: 1em; 				border-width: 1px; 				font-size: medium; 			} 		</style> 		<script> 			function postit(){\nvar ajaxRequest = new XMLHttpRequest();\najaxRequest.onreadystatechange = function(){\nif(ajaxRequest.readyState == 4){\ndocument.querySelector(".responce").innerHTML=ajaxRequest.responseText;\ndocument.querySelector(".statusCode").innerHTML="status: "+ajaxRequest.status;\n}\n}\najaxRequest.open("POST", document.querySelector(".url").value);\najaxRequest.setRequestHeader("Content-type", document.querySelector(".contentType").value);\najaxRequest.send(document.querySelector(".data").value);\n}\n</script> 	</head> 	 	<body> 		<div class="main"> 			<div class="inputs"> 				<table class="inputTable"> 					<tr> 						<td>URL to post to:</td> 						<td><input class="url inputBox"/></td> 					</tr> 					<tr> 						<td>Post data:</td> 						<td><input class="data inputBox"/></td> 					</tr> 					<tr> 						<td>Content type:</td> 						<td><input class="contentType inputBox"/></td> 					</tr> 				</table> 				 				<button onclick="postit()" style="padding: .5%;width: 70%;background: red;font-weight: bold;"> POST </button> 			</div> 			<div class="status"> 				<br> 				<span class="statusCode">status:</span> 				<br><br>responce: 			</div> 			<div class="responce"> 			 			</div> 		</div> 	</body> </html>';
	});
	done();
}
