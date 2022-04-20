const db = require('../data_control/db.js').Database;
var axios = require('axios');
const check = require('./check')
const hash_map=require("../models/hash map");

var CarsMap=new hash_map();
let database = db.getInstance();
let places=[]
var api_key=null
var radius=null
var long=null
var lat=null

var time_table=new Map();
this.TTSeter();

/**
 * 
 * @note :ride.status could only be{
    waiting for permission,
    looking for a car,
    car on the way,
    picked up,
    user canceled,
    driver cancelde,
    done
    } 
 */
module.exports.autocomplete = (input) => {
    //create a new sessiontoken if doesn't exist.
    var user=this.get_data_by_socket_id("enduser",socket.id)
    if(user.session_token==null){
        user.session_token=require('@google/maps').util.placesAutoCompleteSessionToken()
        this.update("enduser",user)
    }

    //using the google maps autocomplete api. 
    var text=input.string;
    var config = {
        method: 'get',
        url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&types=establishment&location=${lat}%2C${long}&radius=${radius}&key=${api_key}`,
        headers: { }
    };
    
    axios(config)
    .then(function (response) {
        //send response to the end user.
        socket.to(socket.id).emit("autocomplete response", response);
        //save the places in the ram to save it later in the database for future use.
        places.concat(response);
    })
    .catch(function (error) {
        console.log(error);
    });
}

module.exports.estimate = (input) => {
    //set the sessiontoken value to null.
    var user=this.get_data_by_socket_id("enduser",socket.id)
    user.session_token=null;
    this.update("enduser",user)

    //use google api to git the ride data and stor it in "res".
    var res=null

    var config = {
        method: 'get',
        url: `https://maps.googleapis.com/maps/api/directions/json?origin=${input.origin.lat}%2C${input.origin.long}&destination=${input.destination.lat}%2C${input.destination.long}&key=${api_key}`,
        headers: { }
    };
    
    axios(config)
    .then(function (response) {
        res=JSON.parse(response);
    })
    .catch(function (error) {
        console.log(error);
    });


    //calculate duration and destance.
    var c_distance=0
    var c_duration=0
    res.routes.forEach(route => {
        route.legs.forEach(leg => {
            c_duration+=leg.duration.value;
            c_distance+=leg.distance.value;
        });
    }); 

    
    //create a new rid.
    var ride={
        id:null,
        rate:null,
        arrival_time:null,
        departure_time:null,
        driver_id:null,
        user_id:user.id,
        distance:c_distance,
        price:((c_distance/1000)*3)+3,
        duration:c_duration,
        routes: res.routes,
        origin:input.origin,
        destination:input.destination,
        status:"waiting for permission",
        rejection_ids:[]
    };
    
    //add ride to database and send it to the end user.
    //database.nweride(ride);
    socket.to(socket.id).emit("estimated rid", ride);

}

module.exports.on_order = (input) => {
    var ride=input.ride
    ride.status='looking for a car'
    ride.id=this.generte_random_id();/**@todo: assign the id right before saving in memory */
    ride.user_id=this.get_data_by_socket_id("enduser",socket.id).enduser.id;
    let t=Math.round(new Date().getTime() / 1000);
    time_table.set(t%10,time_table.get(t%10).append(ride));
    this.order(ride);
}

/**@todo: chech the database operations on the ride */
module.exports.pickup_check = (input) => {
    if (!input.pickup_check){
        let ride = database.getride(input.ride_id)
        ride.status='car on the way'
        database.updateride_by_id(ride.id,ride)
        socket.to(database.getdriver(ride.driver_id).socket_id).emit("pickup error",'a7a ya driver');
    }
}

module.exports.cancel = (input) => {
    let enduser = thes.get_data_by_socket_id("enduser",socket.id).enduser;
    let ride =this.get_ride(enduser.currentride_id)
    if (ride.status=="picked up"){
        let d=this.get_ride_distans(ride.driver_id)
        ride.after_cancel={
            distance:d,
            price:3+(d*3),
        }
        ride.status="cnceled"
        database.newride(ride)
    }
    socket.to(this.get_data_by_id("driver",ride.driver_id).socket_id).emit("ride canceled",ride);
    socket.to(socket.id).emit("ride canceled",ride);
    this.remove_ride(ride);
}

//.................................................................................................................

module.exports. driver_live_location = (input) => {
    let d = 0
    for (driver in drivers){
        if (driver.socket_id == socket.id){
            d=check.getDistanceFromLatLonInKm(input.location.lat,input.location.long,driver.location.lat,driver.location.long);
            driver.location = location;
            driver.estimated_distance+=d
        }
    }
}

module.exports.driver_on_accepte = (input) => {
    
    for (driver in drivers){
        if (driver.socket_id == socket.id){
            if(!driver.free){
                socket.to(socket.id).emit("pickup error","you already have a ride")
                return;
            }
            driver.free=false;
        }
    }

    let ride =input.ride
    let driver_id=this.get_data_by_socket_id("driver",socket.id).driver.id;
    let driver=database.getdriver(driver_id)

    ride.status="car on the way"
    ride.driver_id=driver_id

    driver.currentride_id=ride.id;
    database.updatedriver_by_id(driver.id,driver);

    let user=database.getenduser(ride.user_id)
    socket.to(socket.id).emit('user data',user)
    socket.to(this.get_data_by_id("enduser",user.id).socket_id).emit('request status',{status:'request accepted',driver})

}

module.exports.driver_on_reject = (input) => {
    let ride=input.ride
    let driver_id=this.get_data_by_socket_id("driver",socket.id).driver.id;
    ride.rejection_ids.push(driver_id)
    this.update_ride(ride)

    this.order(ride);
}

module.exports.driver_on_pickup = (input) => {
    let ride=input.ride
    ride.status="picked up"
    ride.driver_id=this.get_data_by_socket_id("driver",socket.id).driver.id;
    rides.push(ride)
    socket.to(this.get_data_by_id("enduser",ride.user_id).socket_id).emit("picked up",{})

    for (driver in drivers){
        if (driver.socket_id == socket_id){
            driver.estimated_distance=0
        }
    }
}

module.exports.driver_on_arrive = (input) =>{
    driver = get_data_by_socket_id("driver",socket.id).driver
    ride= this.get_ride(driver.current_ride)
    ride.done.distance=this.get_distance(ride.id)
    ride.done.price= 3+(3*ride.distance)
    database.newride(ride)
    this.remove_ride(ride)
    driver.current_ride=null
    database.updatedriver_by_id(driver.id,driver)
    enduser = this.get_data_by_id("enduser",ride.enduser_id)
    enduser.enduser.current_ride=null
    database.upbateenduser_by_id(enduser.enduser.id,enduser.enduser)
    socket.to(socket.id, enduser.socket_id).emit("arrived", ride)
}


//.................................................................................................................

module.exports. driver_update_location = (socket_id,location) =>{//not used yet.
    for (driver in drivers){
        if (driver.socket_id == socket_id){
            driver.location = location;
        }
    }
}

module.exports.order = (ride) => {
    let car=CarsMap.search(ride.origin,ride.rejection_ids);
    if(car.id==null){
        return false;
    }
    this.send("driver",car.id,"order",ride);
}

module.exports. get_data_by_socket_id= (role,socket_id) => {
    if(role=="driver"){
        return {socket_id:socket_id,driver:drivers.get(socket_id)};
    }
    else if(role=="enduser"){
        return {socket_id:socket_id,enduser:endusers.get(socket_id)};
    }
    return null
}

module.exports. get_data_by_id= (role,id) => {
    if(role=="driver"){
        let socket_id=drivers_sockets.get(id);
        return {socket_id:socket_id,driver:drivers.get(socket_id)};
    }
    else if(role=="enduser"){
        let socket_id=endusers_sockets.get(id);
        return {socket_id:socket_id,enduser:endusers.get(socket_id)};
    }
    return null
}

/* input={
    origin: {
        lat:30.45646584635,
        long :31.537676354
    }
    destination: {
        lat:30.76543276433 , 
        long: 31.9876543222
    }
*/
module.exports. get_route_api = (input) =>{
    var res=null

    var config = {
        method: 'get',
        url: `https://maps.googleapis.com/maps/api/directions/json?origin=${input.origin.lat}%2C${input.origin.long}&destination=${input.destination.lat}%2C${input.destination.long}&key=${api_key}`,
        headers: { }
    };
    
    axios(config)
        .then(function (response) {
        res=JSON.parse(response);
    })
    .catch(function (error) {
        console.log(error);
    });


    //calculate duration and destance.
    var c_distance=0
    var c_duration=0
    res.routes.forEach(route => {
        route.legs.forEach(leg => {
            c_duration+=leg.duration.value;
            c_distance+=leg.distance.value;
        });
    }); 

    
    //create a new rid.
    var ride={
        id:null,
        rate:null,
        arrival_time:null,
        departure_time:null,
        driver_id:null,
        user_id:user.id,
        distance:c_distance,
        price:((c_distance/1000)*3)+3,
        duration:c_duration,
        routes: res.routes,
        origin:input.origin,
        destination:input.destination,
        status:"waiting for permission",
        rejection_ids:[]
    };
    return ride
}

module.exports.generte_random_id=()=>{
    while(true){
        let flag=true
        let num = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
        for (ride in rides){
            if(ride.id==num){
                flag=false;
            }
        }
        if (flag){
            return num;
        }
    }
}

module.exports.update_ride=(ride) => {
    for (let i=0;i<rides.length;i++){
        if (rides[i].id==ride.id){
            rides[i]=ride;
            return true
        }
    }
    return 'ride not found';
}

module.exports.get_ride=(ride_id) => {
    for (let i=0;i<rides.length;i++){
        if (rides[i].id==ride_id){
            return rides[i]
        }
    }
    return 'ride not found';
}

module.exports. get_ride_distans = (driver_id) => {
    for (driver in drivers){
        if (driver.id == driver_id){
            driver.free=true;
            return estimated_distance
        }
    }
}

module.exports. remove_ride = (ride) =>{
    for (let i=0 ; i < rides.length() ; i++){
        if (rides[i]==ride){
            rides.splice(i,1)
        }
    }
}

module.exports. update = (role, opjct) => {
    if (role == 'driver'){
        for (let i=0 ; i<drivers.length() ; i++ ){
            if (drivers[i].id == opjct.id){
                drivers[i]=opjct;
            }
        }
    }
    else if( role =='enduser'){
        for (let i=0 ; i<endusers.length() ; i++ ){
            if (endusers[i].id == opjct.id){
                endusers[i]=opjct;
            }
        }
    }
}

module.exports. send=(role,id,str,opj)=>{
    if(role=="driver"){
        if(drivers_sockets.has(id)){
            socket.to(drivers_sockets.get(id)).emit(str,opj);
        }
        else database.driverqueue(id,str.opj);
        return;
    }
    if(endusers_sockets.has(id)){
        socket.to(endusers_sockets.get(id)).emit(str,opj);
    }
    else database.enduserqueue(id,str.opj);
}

module.exports. TTSeter =()=>{
    for(let i=0;i<10;i++){
        time_table.set(i,[]);
    }
}