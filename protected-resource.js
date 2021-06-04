const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const { timeout } = require("./utils")
const jwt = require("jsonwebtoken");
const config = {
	port: 9002,
	publicKey: fs.readFileSync("assets/public_key.pem"),
}

const users = {
	user1: {
		username: "user1",
		name: "User 1",
		date_of_birth: "7th October 1990",
		weight: 57,
	},
	john: {
		username: "john",
		name: "John Appleseed",
		date_of_birth: "12th September 1998",
		weight: 87,
	},
}

const app = express()
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/

app.get("/user-info", ( req, res) => {


	if(req.headers.authorization === undefined) {
		res.status(401).send();
		return;
	}
	const token = req.headers.authorization.slice("basic ".length).trim();

	jwt.verify(token, config.publicKey,{algorithms: ["RS256"]}, (err, tokenDecoded) => {
		if (err) {
			
			res.status(401).send();
			return;
		}
		if(!users[tokenDecoded.userName].username) {
			res.status(401).send();
			return;
		}
		let resp = {}

		const scopes = tokenDecoded.scope.split(' ')
	
		for (let index = 0; index < scopes.length; index++) {
			const key = scopes[index].slice("permissions:".length - 1).trim();

			resp[key] = users[tokenDecoded.userName][key];
		}

		res.status(200).json(resp);
	});


});

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes
module.exports = {
	app,
	server,
}
