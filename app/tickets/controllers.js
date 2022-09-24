const db = require('../data_control/db.js').Database;
const url = require('url');
const { get_line_by_name } = require('../controllers/check.js');
const check=require('./check')
const G_check=require('../controllers/check');
let database = db.getInstance();

module.exports.add_ticket = (req,res)=>{
    database.checkToken(req.header("token"),async (result) => {
        let tickets=req.body;
        
        //check the type of the tickets array.
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

        database.add_req_tickets({time:new Date(),tickets:tickets,...tickets[0]})

        let added_tickets_ids= await database.addTicketsIfNew(tickets)

        res.status(200).send(added_tickets_ids);

    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

module.exports.get_totals_all_drivers =(req,res)=>{
    database.checkToken(req.header("token"), async(result) => {
        let q = url.parse(req.url, true).query;
        let query={};
        

        if(q.line_index){
            query.line_index=parseInt(q.line_index)
        }
        else if(q.line_name){
            let line=G_check.get_line_by_name(database.lines(),q.line_name)
            query.line_index=line.index;
        }
        
        if(q.price){
            query.price=parseInt(q.price)
        }
        
        if(q.checked){
            query.checked=(q.checked=="true")
        }
        
        if(q.end && q.start){
            query.timestamp={ $gte : parseInt(q.start), $lte : parseInt(q.end)}
        }
        else if(q.end){
            query.timestamp={ $lte:parseInt(q.end)}
        }
        else if(q.start){
            query.timestamp={ $gte:parseInt(q.start)}
        }

        let drivers = await database.getUsers({role:"driver"})
        let totals=await database.get_all_totals("$driver_id",query);
        let not_checked=await database.get_all_totals("$driver_id",{checked:false});

        let tickets_dect=new Map()

        for(let i=0;i<drivers.length;i++){
            tickets_dect.set(drivers[i].username,{username:drivers[i].username,name:drivers[i].name,total:0,not_checked:0})
        }

        for(let i=0;i<totals.length;i++){
            tickets_dect.set(totals[i]._id,{...tickets_dect.get(totals[i]._id) , total:totals[i].total})
        }

        for(let i=0;i<not_checked.length;i++){
            tickets_dect.set(not_checked[i]._id,{...tickets_dect.get(not_checked[i]._id),not_checked:not_checked[i].total})
        }

        let tickets_list=G_check.map2list(tickets_dect)



        /*for(let i=0;i<drivers.length;i++){
            let driver_obj={
                username:drivers[i].username,
                name:drivers[i].name
            }
            query={...query,driver_id:drivers[i].username}
            total=await database.get_total(query);
            if(total.length!=0){
                driver_obj.total=total[0].total
            }
            else{
                driver_obj.total=0
            }
            not_checked=await database.get_total({driver_id:drivers[i].username,checked:false});
            if(total.length!=0){
                driver_obj.not_checked=not_checked[0].total
            }
            else{
                driver_obj.not_checked=0
            }
            tickets_list.push(driver_obj);
        }*/
        
        

        if(tickets_list.length==0){
            res.status(200).send({message:"thare is no drivers account yet"})
            return
        }
        res.status(200).send(tickets_list)

        
    }, () => {
        res.status(401).send({
            message: "Access Denied"
        });
    });
}

module.exports.get_totals_all_buss =(req,res)=>{
    database.checkToken(req.header("token"), async(result) => {
        let q = url.parse(req.url, true).query;
        let query={};
        

        if(q.line_index){
            query.line_index=parseInt(q.line_index)
        }
        else if(q.line_name){
            let line=G_check.get_line_by_name(database.lines(),q.line_name)
            query.line_index=line.index;
        }
        
        if(q.price){
            query.price=parseInt(q.price)
        }
        
        if(q.checked){
            query.checked=(q.checked=="true")
        }
        
        if(q.end && q.start){
            query.timestamp={ $gte : parseInt(q.start), $lte : parseInt(q.end)}
        }
        else if(q.end){
            query.timestamp={ $lte:parseInt(q.end)}
        }
        else if(q.start){
            query.timestamp={ $gte:parseInt(q.start)}
        }

        let buss = G_check.map2list(database.buses())
        let totals=await database.get_all_totals("$bus_imei",query);
        let not_checked=await database.get_all_totals("$bus_imei",{checked:false});

        let tickets_dect=new Map()

        for(let i=0;i<buss.length;i++){
            tickets_dect.set(buss[i].imei,{imei:buss[i].imei,total:0,not_checked:0})
        }

        for(let i=0;i<totals.length;i++){
            tickets_dect.set(totals[i]._id,{...tickets_dect.get(totals[i]._id) , total:totals[i].total})
        }

        for(let i=0;i<not_checked.length;i++){
            tickets_dect.set(not_checked[i]._id,{...tickets_dect.get(not_checked[i]._id),not_checked:not_checked[i].total})
        }

        let tickets_list=G_check.map2list(tickets_dect)
        /*for(let i=0;i<buss.length;i++){
            let bus_obj={
                imei:buss[i].imei
            }
            query={...query,bus_imei:buss[i].imei}
            total=await database.get_total(query);
            if(total.length!=0){
                bus_obj.total=total[0].total
            }
            else{
                bus_obj.total=0
            }
            not_checked=await database.get_total({bus_imei:buss[i].imei,checked:false});
            if(total.length!=0){
                bus_obj.not_checked=not_checked[0].total
            }
            else{
                bus_obj.not_checked=0
            }
            tickets_list.push(bus_obj);
        }*/
        

        if(tickets_list.length==0){
            res.status(200).send({message:"thare is no buss yet"})
            return
        }
        res.status(200).send(tickets_list)

        
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
        else if(q.line_name){
            let line=G_check.get_line_by_name(database.lines(),q.line_name)
            query.line_index=line.index;
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
        if (result.role === 'admin' || result.role ==="accountant") {
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
            else if(q.line_name){
                let line=G_check.get_line_by_name(database.lines(),q.line_name)
                query.line_index=line.index;
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

            let pretty_tickets=check.ticket_pretty(ticket_obj.tickets);
            ticket_obj.tickets=pretty_tickets
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
        if (result.role === 'admin' || result.role === "accountant") {

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
 * @property {number} timestamp the date and time.
 * @property {Boolean} checked is the ticket checked or not.
 */

 module.exports.get_req_tickets = (req,res)=>{
    database.checkToken(req.header("token"), async (result) => {
        if (result.role === 'admin') {
            let q = url.parse(req.url, true).query;
            let query={};
            let page=0
            let limit=50
            if(q.driver_id){
                query.driver_id=q.driver_id
            }

            if(q.line_index){
                query.line_index=parseInt(q.line_index)
            }
            else if(q.line_name){
                let line=G_check.get_line_by_name(database.lines(),q.line_name)
                query.line_index=line.index;
            }

            if(q.bus_imei){
                query.bus_imei=q.bus_imei
            }
            if(q.price){
                query.price=parseInt(q.price)
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

            let ticket_obj=await database.get_req_tickets(query,page,limit);

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
