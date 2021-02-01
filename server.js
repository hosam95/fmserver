const express = require ('express');
const bodyParser = require ('body-parser');
const cn = require("./app/controllers/controllers.js");

const app = express();

// parse requests of content-type: application/json
app.use(bodyParser.json());

// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

require("./app/routes/routes.js")(app);

app.listen(3000, () => {
    console.log("Server is running on port 3000.");
  });
  
setInterval(() => {
  time=Math.round(new Date().getTime()/1000);
  for(let i=0;i<cn.BUSES.lingth;i++){
    if(cn.BUSES[i].time==null){
    }
    else if (cn.BUSES[i].time<time-5){
      //send an alert.
    }
  }
},6000);