const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.text());

app.listen(3000, function() {
  console.log("Started listening for requests on port 3000");
});

app.get("/", function(request, response) {
  response.redirect("https://multiplayer-chess.gq/");
});
