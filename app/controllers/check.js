
module.exports. line_check = (name,map,stops) => {
    if (!name){
    return false;}
    for (let i=0;i<map.length;i++){
        if (!map[i].lat){
            return false;}
        if (!map[i].long){
            return false;}
    }
    for (let i=0;i<stops.length;i++){
        if (!stops[i].name){
            return false;}
        if (!stops[i].lat){
            return false;}
        if (!stops[i].long){
            return false;}
    }
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
    if (!bus_imei){return false;}
    if (!line){return false;}
    if (this.line_is_new(line,data)){return false;}
    return true;
}

module.exports. bus_is_new = (imei,buses) => {
    for(let j =0; j < buses.length ;j++){
        if (buses[j].imei == imei){
        return false;
        }
    }
    return true;
}

module.exports. buses_in_line = (name,buses) => {
    for(let i =0;i<buses.length;i++){
        if(buses[i].line == name){
            return true;
        }
    }
    return false;
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

module.exports. posted_location = (q,buses) =>{
    if (this.bus_is_new(q.imei,buses)){
        console.log("1")
        return false;
    }
    if(!q.longitude){
        return false;
    }
    if(!q.latitude){
        return false;
    }
    return true;
}