const db = require('../data_control/db.js').Database;
let database = db.getInstance();

module.exports. check_tickets=(tickets)=>{
    for(let i=0;i<tickets.length;i++){
        if(!tickets[i].driver_id){
            return false;
        }
        if(!tickets[i].bus_imei){
            return false;
        }
        if(!tickets[i].line_index){
            return false;
        }
        if(!tickets[i].price){
            return false;
        }
        if(!tickets[i].timestamp){
            return false;
        }
        
    }
    return true;
}

module.exports. ticket_pretty=(tickets)=>{
    let lines=database.lines()
    let pretty_tickets=[]
    for(let i=0;i<tickets.length;i++){
        let ticket=tickets[i];
        delete ticket._id
        ticket.line_name=lines.get(ticket.line_index).name

        pretty_tickets.push(ticket)
    }

    return pretty_tickets;
}