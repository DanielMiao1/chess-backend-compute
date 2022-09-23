const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
var engine = require("./stockfish.js/load_engine")(__dirname + "/node_modules/stockfish/src/stockfish.js")

engine.send("uci\n", function(data) {
  console.log(data);
});

const app = express();

var authorization_requests = {};

app.use(bodyParser.text());

app.listen(3000, function() {
  console.log("Started listening for requests on port 3000");
});

app.get("/", function(request, response) {
  response.redirect("https://multiplayer-chess.gq/");
});

app.post("/auth", function(request, response) {
  if (!request.headers["-x-uuid"]) {
    response.status(400);
    response.end();
    console.log("hi");
    return;
  };
  let data = crypto.randomInt(1000000) * parseInt(process.env.SECRET2);
  authorization_requests[request.headers["-x-uuid"]] = data;
  response.send(data.toString())
});

// auth request timeout and clear dictionary

app.post("/result", function(request, response) {
  if (!request.headers["-x-uuid"] || !authorization_requests[request.headers["-x-uuid"]]) {
    response.status(400);
    response.end();
    return;
  } else if (parseInt(request.body) == NaN || !request.headers["-x-fen"]) {
    delete authorization_requests[request.headers["-x-uuid"]];
    response.status(400);
    response.end();
    return;
  } else if (parseInt(request.body) / parseInt(process.env.SECRET) * parseInt(process.env.SECRET2) != authorization_requests[request.headers["-x-uuid"]]) {
    response.status(401);
    response.end();
    return;
  };
  response.send("authorized");
  response.end();
});

app.post("/analyse", function(request, response) {
  console.log(request.body)
  response.send("a");
});
