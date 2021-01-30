const db_code = require ('../models/db_code.js');
const check = require ("./check");
const url = require ('url');
const { response } = require('express');
let data =[];
let BUSES =[];




// Send the map data.
module.exports. get_map = (req,res) =>{
    res.status(200).send( JSON.stringify(data) );
}

//..................................................................

//post buses location.
module.exports. post_location = (req,res) =>{

    let test = true;
    let q =url.parse(req.url, true).query;

    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    if(!check.posted_location(q,data)){
        test = false;
        res.status(400).send({
            message : "Message Error!"
        });
    }

    if(test){
        let indx = check.bus_indx(q.imei,data);

            data[indx.i].buses[indx.j].longitude = q.longitude;
            data[indx.i].buses[indx.j].latitude = q.latitude;
            for (let i=0;i<BUSES.lingth;i++){
                if (q.imei==BUSES[i].imei){
                    BUSES[i].longitude = q.longitude;
                    BUSES[i].latitude = q.latitude;
                    break;
                }
            }
            res.status(200).send({
                message : "DONE."
            });
    }
    
} 

//..................................................................


//Add a new line.
module.exports. add_line = (req, res) => {
    let q =url.parse(req.url, true).query;
    let test = true;
    let line_c = {
        name : '',
        map : [],
        buses :[]
    }
    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }
    


    if (!check.line_check(q.name,q.map)){
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
        line_c.map = q.map;
        data.push(line_c);
        res.status(200).send({
            message: "DONE."
        });
    }
}

//..................................................................

// Add a new bus.
module.exports. add_bus = (req,res) =>{
    let q =url.parse(req.url, true).query;
    let test = true;
    let bus_c= {
        imei : '',
        driver : '',
        state : true,
        longitude : null,
        latitude : null,
        course : null,
        line:''
    }
    
    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }
   
    if (!check.bus_check(q.imei , q.line , data )){
        test = false;
        res.status(400).send({
          message: "Content structure is not correct!"
        });
    }

    if (!check.bus_is_new(q.imei,data)){
        test = false;
        res.status(400).send({
          message: "Bus olready exist!"
        });
    }
    
    if (test){
        for (let i=0 ;i<data.length; i++){
            if (data[i].name==q.line){
                bus_c.imei = q.imei;
                bus_c.line = q.line;
                data[i].buses.push(bus_c);
                res.status(200).send({
                    message: "DONE."
                });
                break;
            }
        }
        BUSES.push(bus_c);

    }
    
}



//..................................................................

// Remove a line.
module.exports. remove_line = (req,res) =>{
    let q =url.parse(req.url, true).query;

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
    
    if (check.buses_in_line(q.name,data)){
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
    let q =url.parse(req.url, true).query;
    let test =true;
    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    if (check.bus_is_new(q.imei,data)){
        test = false;
        res.status(400).send({
          message: "Bus dose not exist!"
        });
    }

    if(test){
        for(let i =0;i<data.length;i++){
            for(let j =0; j < data[i].buses.length ;j++){
                if (data[i].buses[j].imei == q.imei){
                    data[i].buses.splice(j,1);
                    res.status(200).send({
                        message: "DONE."
                    });
                    break;
                }
            }
        }
        for(let i=0;i<BUSES.length;i++){
            if(BUSES[i].imei==q.imei){
                BUSES.splice(i,1);
                break;
            }
        }
    }
}

//..................................................................

// Assign bus data.
module.exports. update_bus = (req,res) =>{
    let q =url.parse(req.url, true).query;
    let test =true;

    // Validate request
    if (!req.body) {
        test = false;
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }
    else if (check.bus_is_new(q.imei,data)){
        test = false;
        res.status(400).send({
          message: "Bus dose not exist!"
        });
    }
    else{
        let indx = check.bus_indx(q.imei,data);
        let k;
        for (let i=0;i<BUSES.length;i++){
            if(q.imei==BUSES[i].imei){
                k=i;
                break;
            }
        }

        if (q.driver != ''){
            data[indx.i].buses[indx.j].driver = q.driver;
            BUSES[k].driver = q.driver;
        }
        if (q.state != ""){
            data[indx.i].buses[indx.j].state = Number(q.state);
            BUSES[k].state = Number(q.state);
        }
        if (q.line !=  ''){
            if (check.line_is_new(q.line,data)){
                test = false;
                res.status(400).send({
                message: "Line dose not exist!"
                });
            }
            else if(data[indx.i].name==q.name){
                BUSES[k].line = q.line;
            }
            else{
                let bus_c = data[indx.i].buses[indx.j];

                for (let i=0 ;i<data.length; i++){
                    if (data[i].name==q.line){
                        data[i].buses.push(bus_c);
                        res.status(200).send({
                            message: "DONE."
                        });
                        break;
                    }
                }

                data[indx.i].buses.splice(indx.j,1);
                BUSES[k].line = q.line;
            }
        }
    }

}

//..................................................................
