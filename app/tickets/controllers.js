const db = require('../data_control/db.js').Database;
const url = require('url');
const check=require('./check')
let database = db.getInstance();

module.exports.add_ticket = (req,res)=>{
    database.checkToken(req.header("token"),async (result) => {
        let tickets=req.body;
        
        //check the tpe of the tickets array.
        if(!Array.isArray(tickets)){
            res.status(406).send({
                message:"Type Error:the 'tickets' should be an array"
            });
            return
        }
        //check the content of the tickets array.
        if(!check.check_tickets(tickets)){
            res.status(400).send({
                message:"wrong ticket structure"
            })
            return
        }

        let added_tickets_ids= await database.addTicketsIfNew(tickets)

        res.status(200).send(added_tickets_ids);

    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

module.exports.get_tickets_total =(req,res)=>{
    database.checkToken(req.header("token"), async(result) => {
        let q = url.parse(req.url, true).query;
        let query={};
        if(q.id){
            query.id=q.id
        }
        if(q.driver_id){
            query.driver_id=q.driver_id
        }
        if(q.line_index){
            query.line_index=parseInt(q.line_index)
        }
        if(q.bus_imei){
            query.bus_imei=q.bus_imei
        }
        if(q.price){
            query.price=parseInt(q.price)
        }
        if(q.pos){
            query.pos=q.pos
        }
        if(q.checked){
            query.checked=(q.checked=="true")
        }if(q.start){
            query.timestamp={ $gte:parseInt(q.start)}
        }
        if(q.end){
            query.timestamp={ $lte:parseInt(q.end)}
        }
        if(q.end && q.start){
            query.timestamp={ $gte : parseInt(q.start), $lte : parseInt(q.end)}
        }
        
        let total=await database.get_total(query);

        if(total.length==0){
            res.status(200).send({total:0})
            return
        }
        if(total.length!=1){
            res.status(500).send({message:"server side error occurred :the 'total' array has unexpected number of values"})
            return
        }
        res.status(200).send({total:total[0].total})

        
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

module.exports.get_tickets = (req,res)=>{
    database.checkToken(req.header("token"), async (result) => {
        if (result.role === 'admin') {
            let q = url.parse(req.url, true).query;
            let query={};
            let page=0
            let limit=50
            if(q.id){
                query.id=q.id
            }
            if(q.driver_id){
                query.driver_id=q.driver_id
            }
            if(q.line_index){
                query.line_index=parseInt(q.line_index)
            }
            if(q.bus_imei){
                query.bus_imei=q.bus_imei
            }
            if(q.price){
                query.price=parseInt(q.price)
            }
            if(q.pos){
                query.pos=q.pos
            }
            if(q.checked){
                query.checked=(q.checked=="true")
            }
            if(q.start){
                query.timestamp={ $gte:parseInt(q.start)}
            }
            if(q.end){
                query.timestamp={ $lte:parseInt(q.end)}
            }
            if(q.end && q.start){
                query.timestamp={ $gte : parseInt(q.start), $lte : parseInt(q.end)}
            }
            
            if(q.page){
                page=parseInt(q.page)
            }
            if(q.limit){
                limit=parseInt(q.limit)
            }
            let ticket_obj=await database.get_tickets(query,page,limit);

            
            res.status(200).send(ticket_obj)                

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

module.exports.driver_checkout =(req,res)=>{
    database.checkToken(req.header("token"),async (result) => {
        if (result.role === 'admin') {

            let driver_id=req.params.driver_id;

            await database.driver_checkout(driver_id);
            res.status(200).send({message:"Done"});
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
 * @typedef {Object} ticket
 * @property {string} id the id of the ticket.
 * @property {string} driver_id driver id.
 * @property {string} bus_imei the id of the bus.
 * @property {Int32Array} line_index line id.
 * @property {string} pos the id of the pos machean.
 * @property {Int32Array} price the price of ticket.
 * @property {number} time_stamp the date and time.
 * @property {Boolean} checked is the ticket checked or not.
 */
