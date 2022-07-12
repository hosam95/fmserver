
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
        if(!tickets[i].time_stamp){
            return false;
        }
        
    }
    return true;
}