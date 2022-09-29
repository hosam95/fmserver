const controller = require("../controllers/ws_controllers.js");
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
    let role=socket.handshake.headers.role
    cache_data(uid,socket.id,role)
    send_queued(uid,role)
    })
    .catch((error) => {
      // Handle error
      /**@todo:disconnect the socket*/ 
    });    

    //define messages.
    socket.on("autocomplete",controller.outocomplete(input));
    socket.on("estimate",controller.estimate(input));
    socket.on("order",controller.on_order(input));
    socket.on("pickup check",controller.pickup_check())//not compleat nor used.
    socket.on("cancel",controller.user_cancel(input));
    socket.on("accepte ride",controller.driver_on_accepte())
    socket.on("reject ride",controller.driver_on_reject())
    socket.on("pickup",controller.driver_on_pickup())
    socket.on("arrive",controller.driver_on_arrive())
    socket.on("live lication",controller.driver_live_location())

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

function cache_data(uid,socket_id,role){

  if (role=="driver"){
    let driver= database.read('c_drivers',{id:uid})
    if (driver.length != 0){
      drivers.set(socket_id,driver[0]);
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
        }
      }
      database.create('c_drivers',driver)
      drivers.set(socket_id,driver);
      drivers_sockets.set(uid,socket_id);
    })
    .catch((error) => {
      console.log('Error fetching user data:', error);
      /**@todo:disconnect the socket*/ 
    });


  }
  else if(role =="enduser"){
    let enduser = database.read('endusers',{id:uid})
    if (enduser.length != 0){
      endusers.set(socket_id,enduser[0]);
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
        places:[]
      }
      database.create('endusers',enduser)
      endusers.set(socket_id,enduser);
      endusers_sockets.set(uid,socket_id);
    })
    .catch((error) => {
      console.log('Error fetching user data:', error);
      /**@todo:disconnect the socket*/ 
    });

  }
} 

function send_queued(id,role){
  let queue = database.read('queue',{uid:id,role:role})
  queue.forEach(val => {
    try{
      socket.to(drivers_sockets.get(id)).emit(val.str,val.opject);
      database.delete('queue',{_id:val._id})
    }catch(e){
      //do nothing
    }
  });
}