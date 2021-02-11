const db = require('../data_control/db.js').Database;
const check = require("./check");
const url = require('url');
const { response } = require('express');
const { json } = require("body-parser")
/*
let lines =[];
let BUSES =[];*/
let indx = 0;
let database = db.getInstance();

// Log In.
module.exports.log_in = (req, res) => {
    let test = true;

    // Validate request
    if (!req.body) {
        test = false;
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    database.login(req.body.username, req.body.password, (token) => {
        res.status(200).send({
            token: token
        })
    }, () => {
        res.status(400).send({
            massage: "username or password is not correct!"
        })
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
        res.status(400).send({
            massage: "Token is incorrect or expired"
        })
    });

}

//..................................................................

// Send the buses data.
module.exports.get_buses = (req, res) => {
    res.status(200).send(JSON.stringify(database.buses));
}

//..................................................................

// Send the map data.
module.exports.get_map = (req, res) => {
    res.status(200).send(JSON.stringify(database.lines));
}

//..................................................................

//post buses location.
module.exports.post_location = (req, res) => {

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

    if (!check.posted_location(imei, q, database.buses)) {
        test = false;
        res.status(400).send({
            message: "Content structure is not correct!"
        });
    }

    if (test) {
        let i = 0;
        let bus;
        for (let i = 0; i < database.buses.length; i++) {
            if (imei == database.buses[i].imei) {
                bus = database.buses[i];
                bus.loc.long = q.longitude;
                bus.loc.lat = q.latitude;
                bus.time = Math.round(new Date().getTime() / 1000);
                database.updateBusInfo(bus);
                res.status(200).send({
                    message: "DONE."
                });
                break;
            }
        }

        for (let j = 0; j < database.lines.length; j++) {
            if (database.lines[j].index == bus.line) {
                if (!check.in_line(q.latitude, q.longitude, lines[j].map)) {
                    /*########################################################################################
                    fire the alert.
                    ########################################################################################*/
                }
            }
        }
    }
}

//..................................................................


//Add a new line.
module.exports.add_line = (req, res) => {
    let q = req.params;
    let test = true;
    let line_c = {
        name: '',
        map: [],
        index: null,
        stops: []
    }
    // Validate request
    if (!req.body) {
        test = false;
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    if (!check.line_check(q.name, req.body.map, req.body.stops)) {
        test = false;
        res.status(400).send({
            message: "Content structure is not correct!"
        });
    }

    if (!check.line_is_new(q.name, database.lines)) {
        test = false;
        res.status(400).send({
            message: "Line olready exist!"
        });
    }
    database.checkToken(req.header("token"), (result) => {
        if (test) {
            line_c.name = q.name;
            line_c.map = req.body.map;
            line_c.stops = req.body.stops;
            if (database.lines.length == 0) {
                indx = 0;
            }
            else {
                indx = database.lines[database.lines.length - 1].index;
            }
            indx++;
            line_c.index = indx;
            database.addLine(line_c);
            res.status(200).send({
                message: "index:" + line_c.index
            });
        }
    }, () => {
        res.status(403).send({
            message: "Access Denied"
        });
    });
}

//..................................................................

// Add a new bus.
module.exports.add_bus = (req, res) => {
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
        time: null
    }

    // Validate request
    if (!req.body) {
        test = false;
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    if (!check.bus_check(imei, q.line, database.lines)) {
        test = false;
        res.status(400).send({
            message: "Content structure is not correct!"
        });
    }

    if (!check.bus_is_new(imei, database.buses)) {
        test = false;
        res.status(400).send({
            message: "Bus olready exist!"
        });
    }

    database.checkToken(req.header("token"), (result) => {
        if (test) {
            bus_c.imei = imei;
            bus_c.line = q.line;
            database.addBus(bus_c);
            res.status(200).send({
                message: "DONE."
            });
        }
    }, () => {
        res.status(403).send({
            message: "Access Denied"
        });
    });


}



//..................................................................

// Remove a line.
module.exports.remove_line = (req, res) => {
    let q = req.params;

    let test = true;
    // Validate request
    if (!req.body) {
        test = false;
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    if (check.line_is_new(q.name, database.lines)) {
        test = false;
        res.status(400).send({
            message: "Line does not exist!"
        });
    }

    if (check.buses_in_line(q.name, database.buses)) {
        test = false;
        res.status(401).send({
            message: "Remove or reassign the buses in the line first!"
        });
    }
    database.checkToken(req.header("token"), (result) => {
        if (test) {
            for (let i = 0; i < database.lines.length; i++) {
                if (q.name == database.lines[i].name) {
                    let line_c = database.lines[i];
                    database.removeLine(line_c)
                    res.status(200).send({
                        message: "DONE."
                    });
                    break;
                }
            }
        }
    }, () => {
        res.status(403).send({
            message: "Access Denied"
        });
    });

}

//..................................................................

// Remove a bus.
module.exports.remove_bus = (req, res) => {
    let q = req.params;
    let test = true;
    // Validate request
    if (!req.body) {
        test = false;
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    if (check.bus_is_new(q.imei, database.buses)) {
        test = false;
        res.status(400).send({
            message: "Bus does not exist!"
        });
    }
    database.checkToken(req.header("token"), (result) => {
        if (test) {
            for (let i = 0; i < database.buses.length; i++) {
                if (database.buses[i].imei == q.imei) {
                    let bus_c = database.buses[i];
                    database.removeBus(bus_c);
                    res.status(200).send({
                        message: "DONE."
                    });
                    break;
                }
            }
        }
    }, () => {
        res.status(403).send({
            message: "Access Denied"
        });
    });

}

//..................................................................

// Assign bus data.
module.exports.update_bus = (req, res) => {
    let imei = req.params.imei;
    let q = url.parse(req.url, true).query;
    let test = true;
    let bus_c = {};
    for (let i = 0; i < database.buses.length; i++) {
        if (database.buses[i].imei == imei) {
            bus_c = database.buses[i];
            break;
        }
    }

    // Validate request
    if (!req.body) {
        test = false;
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }
    else if (check.bus_is_new(imei, database.buses)) {
        test = false;
        res.status(400).send({
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
            if (check.line_is_new(q.line, database.lines)) {
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
    database.checkToken(req.header("token"), (result) => {
        if (test) {
            database.updateBusInfo(bus_c);
            res.status(200).send({
                message: "DONE."
            });
        }
    }, () => {
        res.status(403).send({
            message: "Access Denied"
        });
    });


}

//..................................................................


/*    let q =url.parse(req.url, true).query;    */

