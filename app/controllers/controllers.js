const db_code = require ('../models/db_code.js');
const check = require ("./check");
const url = require ('url');
const { response } = require('express');
let data =[];
let BUSES =[];
let indx = 0;

// Log In.
module.exports. log_in = (req,res) =>{


}

//..................................................................

// Send the buses data.
module.exports. get_buses = (req,res) =>{
    res.status(200).send( JSON.stringify(BUSES) );
}

//..................................................................

// Send the map data.
module.exports. get_map = (req,res) =>{
    res.status(200).send( JSON.stringify(data) );
}

//..................................................................

//post buses location.
module.exports. post_location = (req,res) =>{

    let test = true;
    let imei = req.params;
    let q =url.parse(req.url, true).query;

    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    if(!check.posted_location(imei,q,BUSES)){
        test = false;
        res.status(400).send({
            message : "Content structure is not correct!"
        });
    }
    if(test){
            for (let i=0; i < BUSES.length ;i++){
                if (imei==BUSES[i].imei){
                    BUSES[i].loc.long = q.longitude;
                    BUSES[i].loc.lat = q.latitude;
                    BUSES[i].time = Math.round(new Date().getTime()/1000);
                    res.status(200).send({
                        message : "DONE."
                    });
                    break;
                }
            }
           
    }
    
} 

//..................................................................


//Add a new line.
module.exports. add_line = (req, res) => {
    let q = req.params;
    let test = true;
    let line_c = {
        name : '',
        map : [],
        index: null,
        stops:[]        
    }
    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }
//*************** */
console.log(req.body.map);
/**************** */
    if (!check.line_check(q.name,req.body.map,req.body.stops)){
        test = false;
        res.status(400).send({
          message: "Content structure is not correct!"
        });
    }

    if (!check.line_is_new(q.name,data)){
        test = false;
        res.status(400).send({
          message: "Line olready exist!"
        });
    }

    if (test){
        line_c.name = q.name;
        line_c.map = req.body.map;
        line_c.stops=req.body.stops;
        line_c.index=indx;
        indx++;
        data.push(line_c);
        res.status(200).send({
            message: "index:"+ line_c.index
        });
    }
}

//..................................................................

// Add a new bus.
module.exports. add_bus = (req,res) =>{
    let imei = req.params;
    let q =url.parse(req.url, true).query;
    let test = true;
    let bus_c= {
        imei : '',
        driver : '',
        active : true,
        loc:{
            lat:null,
            long:null
        },
        line:'',
        time:null
    }
    
    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }
   
    if (!check.bus_check(imei , q.line , data )){
        test = false;
        res.status(400).send({
          message: "Content structure is not correct!"
        });
    }

    if (!check.bus_is_new(imei,BUSES)){
        test = false;
        res.status(400).send({
          message: "Bus olready exist!"
        });
    }
    
if (test){
        bus_c.imei = imei;
        bus_c.line = q.line;
        BUSES.push(bus_c);
        res.status(200).send({
            message: "DONE."
        });
    }
    
}



//..................................................................

// Remove a line.
module.exports. remove_line = (req,res) =>{
    let q = req.params;

    let test =true;
    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    if (check.line_is_new(q.name,data)){
        test = false;
        res.status(400).send({
          message: "Line dose not exist!"
        });
    }
    
    if (check.buses_in_line(q.name,BUSES)){
        test = false;
        res.status(401).send({
          message: "Remove or reassign the buses in the line first!"
        });
    }
    
    if (test){
        for (let i =0; i<data.length;i++){
            if (q.name==data[i].name){
                data.splice(i,1);
                res.status(200).send({
                    message: "DONE."
                });
                break;
            }
        }
    }
}

//..................................................................

// Remove a bus.
module.exports. remove_bus = (req,res) =>{
    let q = req.params;
    let test =true;
    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    if (check.bus_is_new(q.imei,BUSES)){
        test = false;
        res.status(400).send({
          message: "Bus dose not exist!"
        });
    }

    if(test){   
        for(let i=0;i<BUSES.length;i++){
            if(BUSES[i].imei==q.imei){
                BUSES.splice(i,1);
                res.status(200).send({
                    message: "DONE."
                });
                break;
            }
        }
    }
}

//..................................................................

// Assign bus data.
module.exports. update_bus = (req,res) =>{
    let imei = req.params;
    let q =url.parse(req.url, true).query;
    let test =true;

    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }
    else if (check.bus_is_new(imei,BUSES)){
        test = false;
        res.status(400).send({
          message: "Bus dose not exist!"
        });
    }
    else{
        let k;
        for (let i=0;i<BUSES.length;i++){
            if(imei==BUSES[i].imei){
                k=i;
                break;
            }
        }

        if (q.driver != ''){
            BUSES[k].driver = q.driver;
        }
        if (q.active != ""){
            if (q.active=="true"){BUSES[k].active=true;}
            else if (q.active=="false"){BUSES[k].active=false;}
            else {
                test = false;
                res.status(401).send({
                message: "active value can only be 'true' or 'false'."
                });
            }
        }
        if (q.line !=  ''){
            if (check.line_is_new(q.line,data)){
                test = false;
                res.status(400).send({
                message: "Line dose not exist!"
                });
            }
            else{
                BUSES[k].line = q.line;
            }
        } 
    }
    if(test){
        res.status(200).send({
            message: "DONE."
        });
    }
}

//..................................................................

module.exports. BUSES = BUSES;

/*    let q =url.parse(req.url, true).query;    */
