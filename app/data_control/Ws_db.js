const CRUD=require('./CRUD')

class Ws_db extends CRUD {

    constructor(){
        super();
    }

    async new_ride_id(){
        const db=await MongoClient.connect(dbUri)
        var dbo = db.db(dbName);

        let count=await dbo.collection("users").countDocuments(query);
        return count;
    }

    queue(id,str,opject,role){
        let q={
            id:id,
            str:str,
            opject:opject,
            role:role
        }

        this.create('queue',q)
    }

}

module.exports =Ws_db