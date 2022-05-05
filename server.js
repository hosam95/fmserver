const express = require('express');
const {Server} =require ("socket.io");
const {createServer} = require ('http');
const config = require('config');
var cors = require('cors')
const bodyParser = require('body-parser');
const cn = require("./app/controllers/controllers.js");
const db = require('./app/data_control/db.js').Database;
var check= require('./app/controllers/check.js');
const ws_controllers = require("./app/controllers/ws_controllers.js");


const block_ip_period=10*60*1000; //endUser location sening period.

let database = db.getInstance();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

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
require("./app/routes/ws_routes.js")(io);

app.listen(config.get('app.port'), () => {
  console.log(`Server is running on port ${config.get('app.port')}.`);
});
httpServer.listen(config.get('app.ws_port'), () => {
  console.log(`WebSocket is running on port ${config.get('app.ws_port')}.`);
});


setInterval(() => {
  time = Math.round(new Date().getTime() / 1000);
  for (let i = 0; i < database.buses.lingth; i++) {
    if (database.buses[i].time == null) {
    }
    else if (database.buses[i].time < time - 5) {
      //send an alert.
      cn.outOfBoundsBuses.push(database.buses[i])
      database.buses[i].active=false;
    }
  }
}, 6000);

//clear bad ips
setInterval(()=>{
  check.bad_ip=[];
  check.good_ips.clear_and_balance();
},block_ip_period);

//clean endusers shared locations
setInterval(()=>{
  cn.locations.forEach(location => {
    for (let j = 0; j < location.users.length; j++) {
      if ((Math.round(new Date().getTime() / 1000) - location.users[j].time) > 10) {
        location.users.splice(j,1);
      }
    }
  });
},60000);

//set the orders loop timer.
setInterval(()=>{
  let time =Math.round(new Date.getTime() /1000);
  ws_controllers.orders_timer(time%10);
},1000)
