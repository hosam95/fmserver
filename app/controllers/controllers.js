const db = require('../data_control/db.js').Database;
const check = require("./check");
const url = require('url');
const { response } = require('express');
const { json } = require("body-parser");
const { set } = require('express/lib/application');

module.exports. outOfBoundsBuses = new Set();
module.exports. disconnected=new Set();
module.exports.locations = [];
let indx = 0;
let database = db.getInstance();

//stop sharing location.
module.exports.remove_enduser_location =(req,res) => {
    let line =req.params.line;
    let ip= req.socket.localAddress;

    if (check.is_bad_ip(ip)) {
        res.status(401).send({
            message: "request denied."
        });
        return;
    }


    if (check.line_is_new(line,check.map2list(database.lines()))){
        res.status(404).send({
            message : "line not found"
        });
        return;
    }

    if (!check.ip_check(ip,"remove")) {
        res.status(429).send({
            message: "request denied."
        });
        return;
    }

    for (let i = 0; i < this.locations.length; i++) {
        if (this.locations[i].name == line) {
            for (let j = 0; j < this.locations[i].users.length; j++) {
                if (this.locations[i].users[j].ip == ip) {
                    this.locations[i].users.splice(j,1);;
                }
            }
        }
    }
    res.status(200).send({
        message: "location removed."
    });
}

// post user location
module.exports.add_enduser_location = (req, res) => {
    let test = true;
    let line = req.params.line;
    let end_point=null
    let q = url.parse(req.url, true).query;
    try{
        if (q.end === "true" || q.end ==="false" || q.end === true || q.end === false ){
            end_point= q.end === "true" || q.end === true;
        }
        else{
            test=false;
            res.status(400).send({message:"request structure error"});
        }
    }catch(error){
        //nothing to do.
    }
    let ip = req.socket.localAddress;

    if (check.is_bad_ip(ip)) {
        res.status(401).send({
            message: "request denied."
        });
        return;
    }

    // Validate request
    if (!req.body) {
        test = false;
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }


    if (check.line_is_new(line, check.map2list(database.lines()))) {
        test = false;
        res.status(404).send({
            message: "line not found"
        });
    }

    if (!check.posted_location(q)) {
        test = false;
        res.status(400).send({
            
            message: "request structure error"
        });
    }

    if (!check.ip_check(ip,"add")) {
        res.status(429).send({
            message: "request denied."
        });
        return;
    }

    if (test) {
        //add to the memory.
        let location_c = { long: q.longitude, lat: q.latitude };
        let user_c = { ip: ip, loc: location_c ,time: Math.round(new Date().getTime() / 1000),end:end_point };
        let flag = true;
        let user_exist = false;
        for (let i = 0; i < this.locations.length; i++) {
            if (this.locations[i].name == line) {
                flag = false;
                for (let j = 0; j < this.locations[i].users.length; j++) {
                    if (this.locations[i].users[j].ip == ip) {
                        user_exist = true;
                        this.locations[i].users[j].loc = location_c;
                        this.locations[i].users[j].end = end_point;
                    }
                }
                if (!user_exist) {
                    this.locations[i].users.push(user_c);
                }
            }
        }
        if (flag) {
            let line_c = { name: line, users: [] };
            line_c.users.push(user_c);
            this.locations.push(line_c);
        }

        res.status(200).send({
            message: "Location Added"
        });
    }
}

// get end users locations.
module.exports.get_endusers_locations = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        let imei = req.params.imei;
        //Validate request.
        if (!req.body) {
            res.status(400).send({
                message: "content can not be empty!"
            });
            return;
        }

        let line=database.buses().get(imei).line;
        

        if (!line) {
            res.status(404).send({
                message: "Line not found"
            });
            return;
        }

        //send the locations.
        for (let i = 0; i < this.locations.length; i++) {
            if (this.locations[i].name == line) {
                res.status(200).send(this.locations[i].users.map((user) => {return {loc:user.loc , end:user.end}}));
                return;
            }
        }

        res.status(404).send({
            message: "Couldn't find locations"
        });
        return;

    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

// Log In.
module.exports.log_in = (req, res) => {

    // Validate request
    if (!req.body || !req.body.username || !req.body.password) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }
    
    database.login(req.body.username, req.body.password, (token) => {
        res.status(200).send({
            token: token
        })
    }, () => {
        res.status(401).send({
            massage: "Username or password is not correct!"
        })
    });

}

// Update password
module.exports.update_password = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        let test = true;

        // Validate request
        if (!req.body) {
            test = false;
            res.status(400).send({
                message: "Content can not be empty!"
            });
        }

        if (test) {
            database.changeUserPassword(result, req.body.password);
            res.status(200).send({
                message: "Password changed"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

// Validate token.
module.exports.validate_token = (req, res) => {
    let test = true;

    // Validate request
    if (!req.body) {
        test = false;
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    database.checkToken(req.body.token, (user) => {
        res.status(200).send({
            username: user.username
        })
    }, () => {
        res.status(401).send({
            massage: "Token is incorrect or expired"
        })
    });

}

// Get all users
module.exports.get_users = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let q = url.parse(req.url, true).query;
            let query={}
            if(q.role){
                query.role=q.role
            }
            database.getUsers(query,(result) => {
                res.status(200).send(result);
            });
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

// Update or add user
module.exports.update_or_add_user = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let test = true;

            // Validate request
            if (!req.body) {
                test = false;
                res.status(400).send({
                    message: "Content can not be empty!"
                });
            }

            if (!req.body.username) {
                test = false;
                res.status(400).send({
                    message: "Username is required"
                });
            }

            if (test) {
                database.addOrUpdateUser(req.body);
                res.status(200).send({ message: "Done!" });
            }
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

// Delete user
module.exports.delete_user = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let test = true;
            let q = req.params;

            if (!q.username) {
                test = false;
                res.status(400).send({
                    message: "Username is required"
                });
            }

            if (test) {
                database.removeUser({ username: q.username });
                res.status(200).send({ message: "Done!" });
            }
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

//..................................................................

// Send the buses data.
module.exports.get_buses = (req, res) => {
    res.status(200).send(check.map2list(database.buses()));
}

module.exports.get_bus = (req, res) => {
    let q = req.params;
    let bus = database.buses().get(q.imei);
    if (bus)
        res.status(200).send(bus);
    else
        res.status(404).send({"error": "Bus not found"});
}
 
//..................................................................

// Send the map data.
module.exports.get_map = (req, res) => {
    res.status(200).send(check.map2list(database.lines()));
}

module.exports.get_line = (req, res) => {
    let q = req.params;
    let line;
    if(!req.param("line_index")){
        line = check.get_line_by_name(database.lines(),q.name);
        if(!line){
            res.status(404).send({"error": "Line not found"});
            return;
        }
        else{
            res.status(200).send(line);

        }
    }
    else{
        line = database.lines().get(q.line_index);
    
        if (line)
            res.status(200).send(line);
        else
            res.status(404).send({"error": "Line not found"});
    }
}

//..................................................................

//post buses location.
module.exports.post_location = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        let test = true;
        let imei = req.params.imei;
        let q = url.parse(req.url, true).query;

        // Validate request
        if (!req.body) {
            test = false;
            res.status(400).send({
                message: "Content can not be empty!"
            });
        }

        if (!database.buses().has(imei)) {
            test = false;
            res.status(404).send({
                message: "bus not found!"
            });
        }

        if (!check.posted_location(q)) {
            test = false;
            res.status(400).send({
                message: "Content structure is not correct!"
            });
        }

        if (test) {
            let bus;
            bus = database.buses().get(imei);
            let distance = sqrDistance2Points(bus.loc.long,bus.loc.lat,q.longitude,q.latitude);
            let angle = bus.angle;
            if(distance > 1e-10)
                angle = calculateAngle(bus.loc.long,bus.loc.lat,q.longitude,q.latitude);
            bus.loc.long = q.longitude;
            bus.loc.lat = q.latitude;
            bus.time = Math.round(new Date().getTime() / 1000);
            bus.angle=angle;
            let lineMap
            if(bus.line_index!==undefined){
                lineMap=database.lines().get(bus.line_index).map;
            }else{
                let line_c=check.get_line_by_name(database.lines(),bus.line)
                if(line_c=== undefined){
                    bus.line=[...database.lines()][0].name;
                    bus.line_index=[...database.lines()][0].index;
                    lineMap=[...database.lines()][0].map;
                }else{
                    lineMap=line_c.map;
                    bus.line_index=line_c.index;
                }
            }
            
            database.updateBusInfo(bus);
            if (!check.in_line(parseFloat( bus.loc.lat),parseFloat( bus.loc.long), lineMap)) {
                //***************************************** */
                let count=0;
                let line_index;
                let line_name;
                database.lines().forEach((val,key)=>{
                    if(check.in_line(parseFloat( bus.loc.lat),parseFloat( bus.loc.long), val.map)){
                        count++;
                        line_index=val.index;
                        line_name=val.name;
                    }
                })

                if(count==1){
                    bus.line=line_name;
                    bus.line_index=line_index;
                    database.updateBusInfo(bus);
                }
                /***************************************** */
                else{
                    bus.active=false;
                    database.updateBusInfo(bus);
                    if (!this.outOfBoundsBuses.has(bus.imei)) {
                        this.outOfBoundsBuses.add(bus.imei);
                        database.addOutOfBoundsBus(bus);
                    }
                }
            }
            else {
                if(this.outOfBoundsBuses.has(bus.imei)){
                    this.outOfBoundsBuses.delete(bus.imei);
                    bus.active=true;
                    database.updateBusInfo(bus);
                }
            }

            if(this.disconnected.has(bus.imei)){
                this.disconnected.delete(bus.imei);
                bus.active=true;
                database.updateBusInfo(bus);
            }
            res.status(200).send("Done");
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

//calculate the bus location angle.
function calculateAngle(long1,lat1,long2,lat2){
    //Math.atan(1)*(180/Math.PI)
    angle=Math.atan2(lat2-lat1,long2-long1)*(180/Math.PI);
    return angle
}

function sqrDistance2Points(x1, y1, x2, y2) {
    return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}
//..................................................................


//Add new or update line.
module.exports.add_or_update_line = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let q = req.params;
            let test = true;
            let line_c = {
                name: '',
                map: [],
                index: null,
                stops: [],
                prices:[]
            }
            // Validate request
            if (!req.body) {
                test = false;
                res.status(400).send({
                    message: "Content can not be empty!"
                });
            }

            if (!check.line_check(q.name, req.body.map, req.body.stops,req.body.prices)) {
                test = false;
                res.status(400).send({
                    message: "Content structure is not correct!"
                });
            }

            if (test) {
                line_c.name = req.body.name;
                line_c.map = req.body.map;
                line_c.stops = req.body.stops;
                line_c.prices=req.body.prices;
                // if (database.lines.length == 0) {
                //     indx = 0;
                // }
                // else {
                //     indx = database.lines[database.lines.length - 1].index;
                // }
                // indx++;
                line_c.index = req.body.index;
                if (!check.line_is_new(q.name, check.map2list(database.lines()))) {
                    database.updateLineInfo( line_c);
                }
                else {
                    database.addLine(line_c);
                }

                res.status(200).send({
                    message: "index:" + line_c.index
                });
            }
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

//..................................................................

// Add a new bus.
module.exports.add_or_update_bus = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let imei = req.params.imei;
            let q = url.parse(req.url, true).query;
            let test = true;
            let bus_c = {
                imei: '',
                driver: '',
                active: true,
                loc: {
                    lat: null,
                    long: null
                },
                line: '',
                line_index:0,
                time: null
            }

            // Validate request
            if (!req.body) {
                test = false;
                res.status(400).send({
                    message: "Content can not be empty!"
                });
            }

            if (!check.bus_check(imei, q.line, check.map2list(database.lines()))) {
                test = false;
                res.status(400).send({
                    message: "Content structure is not correct!"
                });
            }

            if (test) {
                bus_c.imei = imei;
                bus_c.line = q.line;
                bus_c.driver = q.driver;
                bus_c.active = q.active == 'true';
                let line=check.get_line_by_name(database.lines(),q.line);
                if(!line){
                    console.log(q.line)
                    res.status(404).send({
                        message: "Line not found!"
                    });
                    return
                }

                bus_c.line_index=line.index;
                

                if (database.buses().has(imei)) {
                    let bus=database.buses().get(imei)
                    bus_c.loc=bus.loc;
                    database.updateBusInfo( bus_c);
                }
                else {
                    database.addBus(bus_c);
                }

                res.status(200).send({
                    message: "DONE."
                });
            }
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });


}



//..................................................................

// Set enable bus
module.exports.setActiveBus = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        let imei = req.params.imei;
        let q = url.parse(req.url, true).query;

        let bus =database.buses().get(imei);
        bus.active = q.active == 'true';

        database.updateBusInfo(bus);

        res.status(200).send({
            message: "DONE."
        });
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });


}

// Remove a line.
module.exports.remove_line = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let q = req.params;

            let test = true;
            // Validate request
            if (!req.body) {
                test = false;
                res.status(400).send({
                    message: "Content can not be empty!"
                });
            }

            if (check.line_is_new(q.name, check.map2list(database.lines()))) {
                test = false;
                res.status(403).send({
                    message: "Line does not exist!"
                });
            }

            if (check.buses_in_line(q.name, check.map2list(database.buses()))) {
                test = false;
                res.status(401).send({
                    message: "Remove or reassign the buses in the line first!"
                });
            }
            if (test) {
                let line_c;
                if(!req.param("line_index")){
                    line_c=check.get_line_by_name(database.lines(),q.name);
                }
                else{
                    line_c=database.lines().get(q.line_index);
                }

                database.removeLine(line_c)
                res.status(200).send({
                    message: "DONE."
                });
                database.lines().delete(line_c.index);
            }
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });

}

//..................................................................

// Remove a bus.
module.exports.remove_bus = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let q = req.params;
            let test = true;
            // Validate request
            if (!req.body) {
                test = false;
                res.status(400).send({
                    message: "Content can not be empty!"
                });
            }

            if (!database.buses().has(q.imei)) {
                test = false;
                res.status(403).send({
                    message: "Bus does not exist!"
                });
            }
            if (test) {
                let bus_c=database.buses().get(q.imei);
                database.removeBus(bus_c);
                res.status(200).send({
                    message: "DONE."
                });
                database.buses().delete(q.imei);
            }
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });

}

//..................................................................

// Assign bus data.
module.exports.update_bus = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let imei = req.params.imei;
            let q = url.parse(req.url, true).query;
            let test = true;
            let bus_c = database.buses().get(imei);
            

            // Validate request
            if (!req.body) {
                test = false;
                res.status(400).send({
                    message: "Content can not be empty!"
                });
            }
            else if (!database.buses().has(imei)) {
                test = false;
                res.status(403).send({
                    message: "Bus does not exist!"
                });
            }
            else {

                if (q.driver != '') {
                    bus_c.driver = q.driver;
                }
                if (q.active != "") {
                    if (q.active == "true") { bus_c.active = true; }
                    else if (q.active == "false") { bus_c.active = false; }
                    else {
                        test = false;
                        res.status(401).send({
                            message: "active value can only be 'true' or 'false'."
                        });
                    }
                }
                if (q.line != '') {
                    if (check.line_is_new(q.line, check.map2list(database.lines()))) {
                        test = false;
                        res.status(400).send({
                            message: "Line does not exist!"
                        });
                    }
                    else {
                        bus_c.line = q.line;
                    }
                }
            }
            if (test) {
                database.updateBusInfo(bus_c);
                res.status(200).send({
                    message: "DONE."
                });
            }
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });


}

//..................................................................

//check buses out of bounds.
module.exports.out_of_bounds = (req, res) => {
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            res.status(200).send({outofbounds:Array.from(this.outOfBoundsBuses), disconnected:Array.from(this.disconnected)});
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });

}

//.....................................................................

//send out of bounds history.
module.exports.out_of_bounds_history = (req, res) => {

    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            database.getOutOfBoundsBuses((result) => {
                res.status(200).send(result);
            })
        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });

}

//************************************************************************** */
/*    let q =url.parse(req.url, true).query;    */
module.exports.testing=(req,res)=>{
    
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            //testing api.
            //write the test script here.

            
        
            res.status(200).send({
                message: "DONE."
            });

        }
        else {
            res.status(401).send({
                message: "Access Denied"
            });
        }
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
    
}
