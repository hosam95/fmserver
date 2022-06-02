const db = require('../data_control/db.js').Database;
const url = require('url');

let database = db.getInstance();

module.exports.new_ticket =(req,res)=>{
    database.checkToken(req.header("token"), (result) => {
        let tickets=req.body.tickets;
        let err_t=[];
        for (ticket in tickets){
            /**@todo:create database.addTicketIfNew()*/
            let err=database.addTicketIfNew(ticket);
            if(!err.state){
                err_t.push({t_id:ticket.id,error:err.error})
            }
        }
        if(err_t.length>0){
            res.state(400).send(err_t);
        }else{
            res.state(200).send({message:"done"})
        }
        
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

module.exports.get_score =(req,res)=>{
    database.checkToken(req.header("token"), (result) => {
        
        
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

module.exports.get_overview =(req,res)=>{
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            
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

module.exports.get_driver_scope =(req,res)=>{
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            
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

module.exports.get_detailed_scope =(req,res)=>{
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            
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

module.exports.finish_session =(req,res)=>{
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            
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


/**
 * @typedef {Object} t_driver
 * @property {string} id driver id.
 * @property {Int32Array} total total price of tickets.
 * @property {Date} last_paycheck date of the last paycheck.
 */

/**
 * @typedef {Object} t_day
 * @property {string} id the id of the date session.
 * @property {Date} date the date.
 * @property {Int32Array} total total price of tickets.
 * @property {string} t_dr_id the id of the driver.
 */

/**
 * @typedef {Object} session
 * @property {string} id the id of the session.
 * @property {boolean} finished wither the session is finished or not.
 * @property {Int32Array} total total price of tickets.
 * @property {string} t_dy_id the id of the t_day.
 */

/**
 * @typedef {Object} t_bus
 * @property {string} id the id of the t_bus.
 * @property {string} b_id the id of the bus.
 * @property {Int32Array} total total price of tickets.
 * @property {string} t_s_id the id of the session.
 */

/**
 * @typedef {Object} t_price
 * @property {string} id the id of the t_price.
 * @property {Int32Array} price the price of ticket.
 * @property {Int32Array} count total count of tickets with that price.
 * @property {string} t_b_id the id of the t_bus.
 */

/**
 * @typedef {Object} ticket
 * @property {string} id the id of the ticket.
 * @property {Int32Array} price the price of ticket.
 * @property {string} b_id the id of the bus.
 * @property {Date} date the date.
 * @property {string} d_id driver id.
 * @property {string} time the time the ticket was taken.
 * @property {string} t_p_id the id of the t_price.
 */