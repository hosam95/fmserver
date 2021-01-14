
module.exports. line_check = (name,map) => {
    if (!name){return false;}
    if (!map){return false;}
    return true;
}

module.exports. line_is_new = (name,data) => {
    for(let i =0;i<data.length;i++){
        if (data[i].name==name){
            return false;
        }
    }
    return true;
}

module.exports. bus_check = (bus_imei,line,data) => {
    if (!bus_imei){
        return false;}
    if (!line){return false;}
    if (this.line_is_new(line,data)){return false;}
    return true;
}

module.exports. bus_is_new = (imei,data) => {
    for(let i =0;i<data.length;i++){
        for(let j =0; j < data[i].buses.length ;j++){
            if (data[i].buses[j].imei == imei){
            return false;
        }
        }
    }
    return true;
}

module.exports. buses_in_line = (name,data) => {
    for(let i =0;i<data.length;i++){
        if(data[i].name == name){
            if ( data[i].buses.length == 0 ){
                return false;
            }
            else{
                return true;
            }
        }
    }
}


module.exports. bus_indx = (imei,data) => {
    for(let i =0;i<data.length;i++){
        for(let j =0; j < data[i].buses.length ;j++){
            if (data[i].buses[j].imei == imei){
            return {i,j};
        }
        }
    }
}

module.exports. posted_location = (q,data) =>{
    if (this.bus_is_new(q.imei,data)){
        return false;
    }
    if(q.longitude && q.latitude){
        return true;
    }
    return false;
}