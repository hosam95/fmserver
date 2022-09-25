const CRUD=require('./CRUD')

module.exports.WS_db=class Ws_db extends CRUD {
    async new_ride_id(){
        const db=await MongoClient.connect(dbUri)
        var dbo = db.db(dbName);

        let count=await dbo.collection("users").countDocuments(query);
        return count;
    }

}