const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const {
  randomString,
  containsAll,
  decodeAuthCredentials,
  timeout,
} = require("./utils");

const config = {
  port: 9001,
  privateKey: fs.readFileSync("assets/private_key.pem"),

  clientId: "my-client",
  clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
  redirectUri: "http://localhost:9000/callback",

  authorizationEndpoint: "http://localhost:9001/authorize",
};

const clients = {
  "my-client": {
    name: "Sample Client",
    clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
    scopes: ["permission:name", "permission:date_of_birth"],
  },
  "test-client": {
    name: "Test Client",
    clientSecret: "TestSecret",
    scopes: ["permission:name"],
  },
};

const users = {
  user1: "password1",
  john: "appleseed",
};

const requests = {};
const authorizationCodes = {};

let state = "";

const app = express();
app.set("view engine", "ejs");
app.set("views", "assets/authorization-server");
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/

app.get("/authorize", (req, res) => {


  if (clients[req.query.client_id] === undefined) {
    res.status(401).send();
    return;
  }
  const clientID = req.query.client_id;
  if (
    !containsAll(
      clients[clientID].scopes,
      req.query.scope.split(" ")
    )
  ) {
    res.status(401).send();
    return;
  }
  const key = randomString();
  requests[key] = req.query;

  res.render("login", {
    client: clients[clientID],
    scope: req.query.scope,
    requestId: key,
  });
//   res.status(200).send();
//   res.end();
});

app.post("/approve", (req, res) => {
  if (users[req.body.userName] !== req.body.password) {
    res.status(401).send();
	return;
  }

  const request = requests[req.body.requestId];
  if (!request) {
    res.status(401).send();
	return;
  }
  delete requests[req.body.requestId];
  const key = randomString();
  authorizationCodes[key] = {
    clientReq: request,
    userName: req.body.userName,
  };
  const myURL = new URL(request.redirect_uri);
  myURL.searchParams.append("code", key);
  myURL.searchParams.append("state", request.state);
  res.redirect(302,myURL);
 
});

app.post("/token", (req, res) => {
  if (!req.headers.authorization) {
    res.status(401).send();
	return;
  }

  const auth = decodeAuthCredentials(req.headers.authorization);

  if (clients[auth.clientId].clientSecret !== auth.clientSecret) {
    res.status(401).send();
	return;
  }

  const obj = authorizationCodes[req.body.code];

  if (!obj) {
    res.status(401).send();
	return;
  }

  delete authorizationCodes[req.body.code];

  res.status(200).json({
    access_token: jwt.sign(
      {
        userName: obj.userName,
        scope: obj.clientReq.scope,
      },
      config.privateKey,
      { algorithm: "RS256" }
    ),
    token_type: "bearer",
  });
});

const server = app.listen(config.port, "localhost", function () {
  var host = server.address().address;
  var port = server.address().port;
});

// for testing purposes

module.exports = { app, requests, authorizationCodes, server };
