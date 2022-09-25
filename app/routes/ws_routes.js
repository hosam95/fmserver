const data = require("../controllers/ws_controllers.js");
const db = require('../data_control/db.js').Database;
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let database = db.getInstance();
var drivers=new Map();
var drivers_sockets=new Map();
var endusers=new Map();
var endusers_sockets=new Map();
var rides = new Map();

module.exports = io => {
  io.on("connection", (socket) => {
  //add parameters and code hear.        

    admin.auth().verifyIdToken(socket.handshake.headers.token)
    .then((decodedToken) => {
    const uid = decodedToken.uid;
    get_data(uid,socket.id,socket.handshake.headers.role)
    })
    .catch((error) => {
      // Handle error
      /**@todo:disconnect the socket*/ 
    });    

    //define messages.
    socket.on("autocomplete",data.outocomplete(input));
    socket.on("estimate",data.estimate(input));
    socket.on("order",data.on_order(input));
    socket.on("pickup check",data.pickup_check())//not compleat nor used.
    socket.on("cancel",data.user_cancel(input));
    socket.on("accepte ride",data.driver_on_accepte())
    socket.on("reject ride",data.driver_on_reject())
    socket.on("pickup",data.driver_on_pickup())
    socket.on("arrive",data.driver_on_arrive())
    socket.on("live lication",data.driver_live_location())

    socket.on("disconnect",()=>{
      for (let i=0;i<endusers.length();i++){
        if (endusers[i].socket_id==socket.id){
          endusers.splice(i,1)
          return;
        }
      }
      for(let i=0;i<drivers.length();i++){
        if(drivers[i].socket_id==socket.id){
          drivers.splice(i,1)
          return;
        }
      }

      console.log(`socket: ${socket.id} is not in the ram`);
    })

    
  });
    

};

function get_data(uid,socket_id,role){

  if (role=="driver"){
    let driver= database.get_driver(uid)
    if (driver != null){
      drivers.set(socket_id,driver);
      drivers_sockets.set(uid,socket_id);
      return;
    }

    admin.auth()
    .getUser(uid)
    .then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      driver ={
        id:uid,
        phone:userRecord.phoneNumber,
        current_ride:null,
        car:null,
        free:true,
        rate:{
          rate:0,
          rate_times:0
        },
        queu:[]
      }
      database.add_driver(driver)
      drivers.set(socket_id,driver);
      drivers_sockets.set(uid,socket_id);
    })
    .catch((error) => {
      console.log('Error fetching user data:', error);
      /**@todo:disconnect the socket*/ 
    });


  }
  else if(role =="enduser"){
    let enduser = database.get_enduser(uid)
    if (enduser != null){
      endusers.set(socket_id,enduser);
      endusers_sockets.set(uid,socket_id);

      return;
    }

    admin.auth()
    .getUser(uid)
    .then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      enduser={
        id:uid,
        phone:userRecord.phoneNumber,
        current_ride:null,
        session_token:null,
        home:null,
        work:null,
        places:[],
        queu:[]
      }
      database.add_enduser(enduser);
      endusers.set(socket_id,enduser);
      endusers_sockets.set(uid,socket_id);
    })
    .catch((error) => {
      console.log('Error fetching user data:', error);
      /**@todo:disconnect the socket*/ 
    });

  }
} 