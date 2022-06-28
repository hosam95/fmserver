const db = require('../data_control/db.js').Database;
const url = require('url');

let database = db.getInstance();

module.exports.new_ticket = (req,res)=>{
    database.checkToken(req.header("token"),async (result) => {
        let tickets=req.body.tickets;
        let errors= await database.addTicketsIfNew(tickets)
        
        if(errors.length>0){
            res.status(400).send(err_t);
        }else{
            res.status(200).send({message:"done"})
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

module.exports.get_overview = (req,res)=>{
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let q=url.parse(req.url, true).query
            let only_active=q.only_active;

            database.get_tdrivers(only_active,(data)=>{
                res.status(200).send(data);
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

module.exports.get_driver_scope =(req,res)=>{
    database.checkToken(req.header("token"), (result) => {
        if (result.role === 'admin') {
            let q=url.parse(req.url, true).query
            let date=q.date;
            let drivre_id=q.driver_id
            let day=database.get_tday_by_date(date,drivre_id);
            if(!day.id){
                res.status(200).send({day:day});
                return;
            }
            
            let sessions=database.get_sessions_by_day_id(day.id);
            for(let i=0;i<sessions.length;i++){
                sessions[i].buss=database.get_buss_by_session_id(sessions[i].id);

                for(let j=0;j<sessions[i].buss.length;j++){
                    sessions[i].buss[j].prices=database.get_prices_by_bus_id(sessions[i].buss[j].id);
                }
            }

            res.status(200).send({day:day,sessions:sessions});

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
            let t_price_id=req.body.t_price_id;
            let tickets=[];
            tickets=database.get_tickets_by_tprice_id(t_price_id);

            res.status(200).send(tickets);
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

            let t_d_id=req.body.t_d_id;
            if(!database.has_drivr(t_d_id)){
                res.status(404).send({message:"driver not found!"});
                return;
            }

            let total=database.finish_session(t_d_id);
            res.status(200).send({driver_total:total});
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
 * @property {date} l_paycheck_date date of the last paycheck.
 * @property {string} l_paycheck_time time of the last paycheck.
 * @property {boolean} is_active false if the driver is no longer working
 */

/**
 * @typedef {Object} t_day
 * @property {string} id the id of the date session.
 * @property {Date} date the date.
 * @property {boolean} finished wither the day has unfinished sessions or not.
 * @property {Int32Array} total total price of tickets.
 * @property {Int32Array} sessions_count the number of olde sessions that day has.
 * @property {string} t_dr_id the id of the t_driver.
 */

/**
 * @typedef {Object} t_session
 * @property {string} id the id of the session.
 * @property {boolean} finished wither the session is finished or not.
 * @property {Int32Array} total total price of tickets.
 * @property {string} t_dr_id the id of the t_driver.
 * @property {string} t_dy_id the id of the t_day.
 */

/**
 * @typedef {Object} t_bus
 * @property {string} id the id of the t_bus.
 * @property {string} b_id the id of the bus.
 * @property {Int32Array} total total price of tickets.
 * @property {string} t_s_id the id of the t_session.
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