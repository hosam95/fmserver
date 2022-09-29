 class CRUD{
    collections=["cars","endusers","c_drivers","rides","places","queue"]
    async create(collection,val){
        if(!this.#check_collection(collection)){
            return false
        }
        const db=await MongoClient.connect(dbUri)
        var dbo = db.db(dbName);
        
        await dbo.collection(collection).insertOne(val, function(err, res) {
        if (err) throw err;
        });

        db.close();
        return true;
    }

    async read(collection,query,page=1,limit=50){
        if(!this.#check_collection(collection)){
            return false
        }
        const db=await MongoClient.connect(dbUri)
        var dbo = db.db(dbName);
        
        let vals=await dbo.collection(collection).find(query)
        .skip( page > 0 ? ( ( page - 1 ) * limit ) : 0 )
        .limit( limit ).toArray()

        db.close();
        return vals;
    }

    async update(collection,query,val){
        if(!this.#check_collection(collection)){
            return false
        }
        const db=await MongoClient.connect(dbUri)
        var dbo = db.db(dbName);

        dbo.collection(collection).updateOne(query, {...val,id:query.id}, function (err, res) {
            if (err) throw err;
      
            db.close();
            return true
        });
    }

    async delete(collection,query){
        if(!this.#check_collection(collection)){
            return false
        }
        const db=await MongoClient.connect(dbUri)
        var dbo = db.db(dbName);

        dbo.collection(collection).deleteOne(query, function (err, res) {
            if (err) throw err;
    
            db.close();
            return true
        });
    }

    #check_collection(collection){
        if(collection in this.collections){
            return true
        }
        return false;
    }
}

module.exports =CRUD;