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
    user cancelled,
    arrived,
    no cars available
    } 
 */
module.exports.autocomplete = (input) => {
    //create a new sessiontoken if doesn't exist.
    var user=this.get_data_by_socket_id("enduser",socket.id).enduser;
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
    var user=this.get_data_by_socket_id("enduser",socket.id).enduser;
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
        rejection_ids:{
            ids:new Map(),
            last:null
        }
    };
    
    socket.to(socket.id).emit("estimated rid", ride);

}

module.exports.on_order = (input) => {
    var ride=input.ride
    ride.status='looking for a car'
    ride.id=database.new_ride_id();
    ride.user_id=this.get_data_by_socket_id("enduser",socket.id).enduser.id;
    let t=Math.round(new Date().getTime() / 1000);
    let order_s=this.order(ride);
    if(order_s==false){
        this.send("enduser",ride.user_id,"no cars available",{});
        ride.status="no cars available";
        this.update_ride(ride,false,true);
        return;
    }
    ride.rejection_ids.ids.set(order_s,{});
    ride.rejection_ids.last=order_s;
    time_table.get(t%10).add(ride.id);
    rides.set(ride.id,ride);
    this.update_ride(ride,false,true);
}

/**@todo: chech the database operations on the ride */
module.exports.pickup_check = (input) => {
    if (!input.pickup_check){
        let ride = database.read('rides',{id:input.ride_id})
        ride.status='car on the way'
        database.updateride_by_id(ride.id,ride)
        socket.to(database.getdriver(ride.driver_id).socket_id).emit("pickup error",'a7a ya driver');
    }
}

module.exports.user_cancel = (input) => {
    let ride_id = input.ride_id;
    let ride =this.get_ride(ride_id);

    let user =this.get_data_by_socket_id("enduser",socket.id).enduser;

    if (ride.status=="picked up"){
        let d=this.get_ride_distans(ride.driver_id)
        ride.after_cancel={
            distance:d,
            price:3+(d*3),
        }
        ride.status="cncelled"
        database.newride(ride)
    }
    else if(ride.status=="car on the way"){
        
        let driver=this.get_data_by_id("driver",ride.driver_id);
        driver.free=true;
        driver.current_ride=null;
        this.update("driver",driver,true,true);

        this.send("driver",ride.driver_id,"ride cancelled",{ride_id:ride.id});
    }
    else if(ride.status=="looking for a car"){
        for(let i=0;i<10;i++){
            if(time_table.get(i).has(ride.id)){
                time_table.get(i).delete(ride.id);
            }
        }
    }
    else{
        this.send("enduser",user.id,"ride is not in a cancelable phase",{ride_id:ride.id});
        return;
    }

    ride.status="user cancelled";
    this.update_ride(ride,false,true);
    rides.delete(ride.id);

    user.current_ride=null;
    this.update("enduser",user,true,true);
    
}

//.................................................................................................................

module.exports. driver_live_location = (input) => {
    let driver=this.get_data_by_socket_id("driver",socket.id).driver;
    if(driver.current_ride!=null){
        let ride=this.get_ride(driver.current_ride);
        if(ride.status=="car on the way"){
            this.send("enduser",ride.user_id,"car_location",input.location);
        }
    }
    CarsMap.set({id:driver.id,lat:input.location.lat,long:input.location.long});
    /**@todo:calculate thedistance from the last location.*/ 
     /*to calculate the price if the ride got calcelled in the middle of the way. */
}

module.exports.driver_on_accepte = (input) => {
    let ride_id=input.ride_id;
    let driver=this.get_data_by_socket_id("driver",socket.id).deriver;
    
    if(!driver.free){
        this.send("driver",driver.id,"error",{error:"you already have a ride."});
        return;
    }

    let ride=rides.get(ride_id);
    let i=0
    for (;i<10;i++){
        if(time_table.get(i).has(ride_id)){
            time_table.get(i).delete(ride_id);
        }
    }

    if(ride.status!="looking for a car"){
        this.send("driver",driver.id,"error",{error:"ride is no longer available."});
        return;
    }

    let user =this.get_data_by_id("enduser",ride.user_id);
    if(user==null){
        user=database.getenduser(ride.user_id);
    }
    ride.status="car on the way"
    ride.driver_id=driver_id
    driver.current_ride=ride.id;
    driver.free=false;
    user.current_ride=ride.id;

    this.update("enduser",user,true,true);
    this.update("driver",driver,true,true);
    this.update_ride(ride,true,true);

    this.send("driver",driver.id,"user data",user);
    this.send("enduser",user.id,"request status",{status:"request accepted",driver:driver});
}

module.exports.driver_on_reject = (input) => {
    let ride_id=input.ride_id
    let driver_id=this.get_data_by_socket_id("driver",socket.id).driver.id;
    let time=Math.round(new Date.getTime()/1000);
    let ride=rides.get(ride_id);
    

    // if olde_reject do nothing
    if(ride.rejection_ids.last!=driver_id){
        return;
    }

    for (let i=0;i<10;i++){
        if(time_table.get(i).has(ride_id)){
            time_table.get(i).delete(ride_id);
        }
    }
    
    let new_driver_id=this.order(ride);
    if(new_driver_id==false){
        this.send("enduser",ride.user_id,"no cars available",{});
        ride.status="no cars available";
        this.update_ride(ride,false,true);
        rides.delete(ride.id);
        return;
    }
    ride.rejection_ids.ids.set(new_driver_id,{});
    ride.rejection_ids.last=new_driver_id;
    this.update_ride(ride,true,true);
    time_table.get(time%10).add(ride_id);
}

module.exports.driver_on_pickup = (input) => {
    let ride=this.get_ride(input.ride_id);
    ride.status="picked up";
    this.update_ride(ride,true,true);
    this.send("enduser",ride.user_id,"picked up",{});

    /**@todo:set the distance to 0.*/ 
     /*to calculate the price if the ride got calcelled in the middle of the way. */
}

module.exports.driver_on_arrive = (input) =>{
    driver = get_data_by_socket_id("driver",socket.id).driver;
    driver.free=true;
    driver.current_ride=null;
    this.update("driver",deriver,true,true);

    ride= this.get_ride(driver.current_ride)
    ride.status="arrived";
    this.update_ride(ride,false,true);
    ride.delete(ride.id);

    enduser = this.get_data_by_id("enduser",ride.user_id).enduser;
    enduser.current_ride=null
    this.update("enduser",enduser,true,true);
    
    this.send("enduser",enduser.id,"arrived",{ride_id:ride.id});
}

module.exports.driver_cancel=(input)=>{
    let ride_id=input.ride_id;
    let ride=this.get_ride(ride_id);
    if(ride.status!="car on the way"){
        this.send("driver",ride.user_id,"ride can not be canceled",{});
        return;
    }

    this.send("enduser",ride.user_id,"driver canceled the ride",ride);
    ride.status="looking for a car";
    ride.driver_id=null;

    let t=Math.round(new Date().getTime() / 1000);
    let nwe_driver_id=this.order(ride);
    if(nwe_driver_id==false){
        this.send("enduser",ride.user_id,"no cars available",{});
        ride.status="no cars available";
        this.update_ride(ride,false,true);
        rides.delete(ride.id);
        return;
    }
    ride.rejection_ids.ids.set(nwe_driver_id,{});
    ride.rejection_ids.last=nwe_driver_id;
    time_table.get(t%10).add(ride.id);
    this.update_ride(ride,true,true);

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
    return car.id;
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

module.exports.generte_random_id=(role)=>{
    function random_id(){
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    let id;
    for(id=random_id();/**@todo:check if the id is repeated*/;id=random_id()){

    }
    return id;
}

module.exports.update_ride=(ride,ram,db) => {
    if(ram){
        rides.set(ride.id,ride)
    }
    if(db){
        /**@todo:updat the ride data in the datebase.*/
    }
}

module.exports.get_ride=(ride_id) => {

    if(rides.has(ride_id)){
        return rides.get(ride_id);
    }

    /**@todo:get the ride from the database and return it */


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

module.exports. update = (role, opjct,ram,db) => {
    if (role == 'driver'){
        if(ram){
            if(drivers_sockets.has(opjct.id)){
                let socket_id=drivers_sockets.get(opjct.id)
                let driver=drivers.get(socket_id)
                drivers.set(socket_id,{...driver,...opjct});
            }
        }
        if(db){
            /**@todo:update the driver data in the database.*/
        }
    }
    else if( role =='enduser'){
        if(ram){
            if(endusers_sockets.has(opjct.id)){
                let socket_id=endusers_sockets.get(opjct.id)
                let enduser=endusers.get(socket_id)
                endusers.set(socket_id,{...enduser,...opjct});
            }
        }
        if(db){
            /**@todo:update the enduser data in the database.*/
        }
    }
}

module.exports. send=(role,id,str,opj,socket=null)=>{
    if(socket!=null){
        try{
            socket.to(socket).emit(str,opj);
            
        }catch(e){
            database.driverqueue(id,str,opj);
        }
        return;
    }
    if(role=="driver"){
        if(drivers_sockets.has(id)){
            socket.to(drivers_sockets.get(id)).emit(str,opj);
        }
        else database.driverqueue(id,str,opj);
        return;
    }
    if(endusers_sockets.has(id)){
        socket.to(endusers_sockets.get(id)).emit(str,opj);
    }
    else database.enduserqueue(id,str,opj);
}

module.exports. TTSeter =()=>{
    for(let i=0;i<10;i++){
        time_table.set(i,new Set());
    }
}

module.exports. orders_timer=(i)=>{
    time_table.get(i).forEach((value) =>{ 
        let ride=rides.get(value);
        let driver_id=this.order(ride);
        if(driver_id==false){
            this.send("enduser",ride.user_id,"no cars available",{});
            ride.status="no cars available";
            this.update_ride(ride,false,true);
            time_table.get(i).delete(value);
            rides.delete(key);
            this.update_ride(ride,false,true);
            return;
        }
        ride.rejection_ids.ids.set(driver_id,{});
        ride.rejection_ids.last=driver_id;
        this.update_ride(ride,true,true);
    })
}