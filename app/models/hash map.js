const boundaries = 10;

class CarsMap{
    #map=new Map();
    #cars=new Map();
    #rounder=1000;

    set(car){

        let lat =Math.round(car.lat*this.#rounder)/this.#rounder;
        let long =Math.round(car.long*this.#rounder)/this.#rounder;

        //delete the car if it exist.
        if(this.#cars.has(car.id)){
            this.delete(car.id);
        }

        //add the car in its new position in the locations map.
        if(!this.#map.has(lat)){
            this.#map.set(lat,new Map())
        }
        if(!this.#map.get(lat).has(long)){
            this.#map.get(lat).set(long,new Map());
        }
        this.#map.get(lat).get(long).set(car.id,{lat:car.lat,long:car.long});

        //update the car in the cars map.
        this.#cars.set(car.id,{lat:car.lat,long:car.long})
    }

    delete(id){

        let coordinates=this.#cars.get(id);
        if(coordinates==undefined){
            return false;
        }
        let lat =Math.round(coordinates.lat*this.#rounder)/this.#rounder;
        let long =Math.round(coordinates.long*this.#rounder)/this.#rounder;

        //delete the car from #map.
        if(!this.#map.get(lat).get(long).delete(id)){
            console.log("error:\"HashMap/delete\" #cars & #map conflict!")
        }

        //delete empty cells
        if(this.#map.get(lat).get(long).size==0){
            this.#map.get(lat).delete(long);
        }
        if(this.#map.get(lat).size==0){
            this.#map.delete(lat);
        }

        //delete the car from #cars.
        this.#cars.delete(id);
    }
    
    search(loc,rejection_ids){
        if(this.#cars.size==0){
            return null;
        }

        let lat =Math.round(loc.lat*this.#rounder)/this.#rounder;
        let long =Math.round(loc.long*this.#rounder)/this.#rounder;
        //search in the 9 center cells.
        let nearest=this.#nearest_in_cell(lat,long,loc,rejection_ids);
        let r1=this.#nearest_in_radius(loc,1,rejection_ids);
        if(r1.distance<nearest.distance){
            nearest=r1;
        }

        //search wider if needed.
        if(nearest.id==null){
            return this.#nearest_in_radius(loc,2,rejection_ids).id;
        }

        return nearest.id;
    }

    #nearest_in_radius(loc,r,rejection_ids){
        let lat =Math.round(loc.lat*this.#rounder)/this.#rounder;
        let long =Math.round(loc.long*this.#rounder)/this.#rounder;
        let nearest={
            distance:1000000,
            id:null
        };
        let x=r,y=r,is_x=true,a=1;
        for(let i=0;i<r*8;i++){
            let nearest_c=this.#nearest_in_cell(lat+(x/this.#rounder),long+(y/this.#rounder),loc,rejection_ids);
            if(nearest_c.distance<nearest.distance){
                nearest=nearest_c;
            }
            if(Math.abs(x)==Math.abs(y)){
                is_x=!is_x;
                if(is_x){
                    a=x/Math.abs(x);
                }
                else{
                    a=y/Math.abs(y);
                }
            }
            if(is_x){
                x-=a;
            }
            else{
                y-=a;
            }
        }

        if (r==1||r>boundaries){
            return nearest;
        }
        if(nearest.id==null){
            return this.#nearest_in_radius(loc,r+1,rejection_ids)
        }
        return nearest
    }

    #nearest_in_cell(cell_lat,cell_long,loc,rejection_ids){
        let nearest={
            distance:1000000,
            id:null
        };
        cell_lat=Math.round(cell_lat*this.#rounder)/this.#rounder
        cell_long=Math.round(cell_long*this.#rounder)/this.#rounder

        if(!this.#map.has(cell_lat)){
            return nearest;
        }
        if(!this.#map.get(cell_lat).has(cell_long)){
            return nearest;
        }
        this.#map.get(cell_lat).get(cell_long).forEach((value,key)=>{
            if(drivers.get(drivers_sockets.get(key)).free){
                if(!rejection_ids.ids.has(key)){
                    let a=((value.lat-loc.lat)*(value.lat-loc.lat))+((value.long-loc.long)*(value.long-loc.long));
                    if(a<nearest.distance){
                        nearest.distance=a;
                        nearest.id=key;
                    }
                }
            }
        })
        return nearest;
    }
}

module.exports =CarsMap;