const express = require('express');
const config = require('config');
const bodyParser = require('body-parser');
const cn = require("./app/controllers/controllers.js");
const db = require('./app/data_control/db.js').Database;

let database = db.getInstance();
const app = express();

// parse requests of content-type: application/json
app.use(bodyParser.json());

// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

require("./app/routes/routes.js")(app);

app.listen(config.get('app.port'), () => {
  console.log(`Server is running on port ${config.get('app.port')}.`);
});

setInterval(() => {
  time = Math.round(new Date().getTime() / 1000);
  for (let i = 0; i < database.buses.lingth; i++) {
    if (database.buses[i].time == null) {
    }
    else if (database.buses[i].time < time - 5) {
      //send an alert.
    }
  }
}, 6000);