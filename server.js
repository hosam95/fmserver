const express = require('express');
const config = require('config');
var cors = require('cors')
const bodyParser = require('body-parser');
const cn = require("./app/controllers/controllers.js");
const db = require('./app/data_control/db.js').Database;
var check= require('./app/controllers/check.js');

const block_ip_period=10*60*1000; //endUser location sening period.

let database = db.getInstance();
const app = express();

// parse requests of content-type: application/json
app.use(bodyParser.json());

// User CORS
var corsOptions = {
  origin: config.get('app.cors_origin'),
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions))

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

setInterval(()=>{
  check.bad_ip=[];
  check.good_ips.clear_and_balance();
},block_ip_period);

setInterval(()=>{
  for (let i = 0; i < cn.locations.length; i++) {
    for (let j = 0; j < cn.locations[i].users.length; j++) {
      if ((Math.round(new Date().getTime() / 1000) -cn.locations[i].users[j].time) > 10) {
        cn.locations[i].users.splice(j,1);
      }
    }
  }
},60000);
