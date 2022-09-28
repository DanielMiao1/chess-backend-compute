const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const load_engine = require("./stockfish.js/load_engine");
const https = require("https");
const http = require("http");

const server_url = "validation.multiplayerchess.gq";
// const server_url = "localhost";

const server_port = "443";
// const server_port = "34874";

// const method = https;
const method = http;

const app = express();

var authorization_requests = {};

app.use(bodyParser.text());

app.listen(3000, function() {
  console.log("Started listening for requests on port 3000");
});

app.get("/", function(request, response) {
  response.redirect("https://multiplayerchess.gq/");
});

app.post("/auth", function(request, response) {
  if (!request.headers["-x-uuid"]) {
    response.status(400);
    response.end();
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
  } else if (!request.headers["-x-fen"] || !request.headers["-x-board-id"] || parseInt(request.body) == NaN) {
    delete authorization_requests[request.headers["-x-uuid"]];
    response.status(400);
    response.end();
    return;
  } else if (parseInt(request.body) / parseInt(process.env.SECRET) * parseInt(process.env.SECRET2) != authorization_requests[request.headers["-x-uuid"]]) {
    response.status(401);
    response.end();
    return;
  };

  delete authorization_requests[request.headers["-x-uuid"]];

  response.send("authorized");
  response.end();

  var engine = load_engine(__dirname + "/node_modules/stockfish/src/stockfish.js")

  // TODO: enable NNUE

  engine.send("uci");
  engine.send("ucinewgame");
  engine.send(`position fen ${request.headers["-x-fen"]}`);
  engine.send("go movetime 4000", function(data) {
    const request_ = method.request({
      method: "POST",
      hostname: server_url,
      port: server_port,
      path: "/result",
      headers: {"Content-Type": "text/plain", "-x-board-id": parseInt(request.headers["-x-board-id"]) * parseInt(process.env.SECRET3) - parseInt(process.env.SECRET2) + parseInt(process.env.SECRET3)}
    });
    
    request_.on("error", error => {
      console.error(error);
    });
    
    request_.write(data.split(" ")[1]);
    request_.end();
  });
});
