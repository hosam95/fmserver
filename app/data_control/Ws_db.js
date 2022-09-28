const CRUD=require('./CRUD')

class Ws_db extends CRUD {
    async new_ride_id(){
        const db=await MongoClient.connect(dbUri)
        var dbo = db.db(dbName);

        let count=await dbo.collection("users").countDocuments(query);
        return count;
    }

}

module.exports =Ws_db