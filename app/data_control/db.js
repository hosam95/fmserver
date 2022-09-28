const config = require('config');
const MongoClient = require('mongodb').MongoClient;
const crypto = require('crypto');
const Ws_db=require('./Ws_db');

/**
 * @typedef {Object} Line
 * @property {string} name Line name
 * @property {{long: Number, lat: Number}[]} map Line defining points
 * @property {Int32Array} index Line index
 * @property {{name:string, long: Number, lat: Number}[]} stops Line defining points
 */

/**
 * @typedef {Object} Bus
 * @property {boolean} active The status of the bus
 * @property {string} driver The driver name
 * @property {string} imei A bus identifier
 * @property {string} line The name of the line the bus in
 * @property {Int32Array} line_index the index of the line the bus in
 * @property {{long: Number, lat: Number}} loc The current location of the bus
 */

const dbHost = config.get('db.host');
const dbPort = config.get('db.port');
const dbName = config.get('db.name');
const dbUri = `mongodb://${dbHost}:${dbPort}`;
const tokenExpiry = config.get('auth.tokenExpiry'); // Expiry in minutes


class Database extends Ws_db{
  #lines = new Map();
  #buses = new Map();
  #categories=new Map();

  /**
   * Gets the current categories
   * 
   * @returns {Category Map}
   *  The current categories
   */
   categories() {
    return this.#categories;
  }

  /**
   * Gets the current lines
   * 
   * @returns {Line Map}
   *  The current lines
   */
  lines() {
    return this.#lines;
  }

  /**
   * Gets the current buses
   * 
   * @returns {Bus Map}
   *  The current buses
   */
  buses() {
    return this.#buses;
  }

  constructor() {
    super();
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("lines").find({}, { projection: { _id: 0 } }).toArray((err, result) => {
        if (err) throw err;

        for(let i=0;i<result.length;i++){
          this.#lines.set(result[i].index,result[i]);
        }
        
        db.close();
      });
    });

    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("buses").find({}, { projection: { _id: 0 } }).toArray((err, result) => {
        if (err) throw err;

        for(let i=0;i<result.length;i++){
          this.#buses.set(result[i].imei,result[i]);
        }
        db.close();
      });
    });

    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("categories").find({}, { projection: { _id: 0 } }).toArray((err, result) => {
        if (err) throw err;

        for(let i=0;i<result.length;i++){
          this.#categories.set(result[i].id,result[i]);
        }
        db.close();
      });
    });

    //add the initials categories if they doesn't exist.
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("categories").countDocuments({ id: "0" },(err, result) => {
        if (err) throw err;

        if(result==0){
          dbo.collection("categories").insertOne({id:"0",name:"hidden"}, function(err, res) {
            if (err) throw err;
          });
        }
        db.close();
      });
    });

    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("categories").countDocuments({ id: "1" },(err, result) => {
        if (err) throw err;

        if(result==0){
          dbo.collection("categories").insertOne({id:"1",name:"Badr city"}, function(err, res) {
            if (err) throw err;
          });
        }
        db.close();
      });
    });

    // create collections if thay doesn't exist.

    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.listCollections({name: "tickets"})
        .next(function(err, collinfo) {
          if (!collinfo) {
            MongoClient.connect(dbUri, (err, db) => {
              if (err) throw err;
              
              var dbo = db.db(dbName);
              dbo.createCollection("tickets");
            });
          }
      });
      db.close();
    });

    //create the ticket_id index
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("tickets").createIndex({"id":-1},{unique: true})
      db.close();
    });
  }

  /**
     * Adds a category to the database
     * 
     * @param {String} category_name The Line category
     */
  async addCategory(name) {

    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);
    
    let id= await dbo.collection("categories").countDocuments({});

    await dbo.collection("categories").insertOne({id:id.toString(),name:name}, function(err, res) {
      if (err) throw err;
    });

    db.close();
    this.#categories.set(id,{id:id,name:name});
    return id;
  }

  /**
   * Updates the category info if a category with existing name
   * 
   * @param {Category} category The category data
   */
   updateCategoryInfo(category) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      var categoryQuery = { id: category.id };
      var newCategory = { $set: category };
      dbo.collection("categories").updateOne(categoryQuery, newCategory, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    this.#categories.set(category.id,category);
  }

  
  /**
   * Removes a category from the database
   * 
   * @param {object} id The id of the category
   */
   removeCategory(query) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("categories").deleteOne(query, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    this.#categories.delete(query.id);
  }

  /**
   * Adds a line to the database
   * 
   * @param {Line} line The Line data
   */
  addLine(line) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("lines").insertOne(line, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    this.#lines.set(line.index,line);
  }

  /**
   * Adds a bus to the database
   * 
   * @param {Bus} bus The bus data
   */
  addBus(bus) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("buses").insertOne(bus, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    this.#buses.set(bus.imei,bus);
  }

  /**
   * Updates the line info if a line with existing name
   * 
   * @param {Line} line The Line data
   */
  updateLineInfo(line) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      var lineQuery = { index: line.index };
      var newLine = { $set: line };
      dbo.collection("lines").updateOne(lineQuery, newLine, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    this.#lines.set(line.index,line);
  }

  /**
   * Updates the line info if a line with existing name
   * 
   * @param {string} name The Line name
   */
  /**@todo:شوف هتعمل فيها ايه دي */
  updateLineInfoWithName(name, line) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      var lineQuery = { name: name };
      var newLine = { $set: line };
      dbo.collection("lines").updateOne(lineQuery, newLine, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    var idx = this.#lines.findIndex(x => x.name == name);
    this.#lines[idx] = line;
  }

  /**
   * Updates the bus info if a bus with existing IMEI
   * 
   * @param {Bus} bus The bus data
   */
  updateBusInfo(bus) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      var busQuery = { imei: bus.imei };
      var newBus = { $set: bus };
      dbo.collection("buses").updateOne(busQuery, newBus, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    this.#buses.set(bus.imei,{ ...this.#buses.get(bus.imei), ...bus});
  }

  /**
   * Updates the bus info if a bus with existing IMEI
   * 
   * @param {string} imei The Bus imei
   */
  updateBusInfoWithImei(imei, bus) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      var busQuery = { imei: imei };
      var newBus = { $set: bus };
      dbo.collection("buses").updateOne(busQuery, newBus, function (err, res) {
        if (err) throw err;

      });

      dbo.collection("buses").findOne(busQuery, function (err, res) {
        if (err) throw err;

        this.#buses.set(res.imei,res);
        db.close();
      });
    });
  }

  /**
   * Removes a line from the database
   * 
   * @param {Line} line The Line data
   */
  removeLine(line) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      var lineQuery = { name: line.name };
      dbo.collection("lines").deleteOne(lineQuery, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    this.#lines.delete(line.index);
  }

  /**
   * Removes a bus from the database
   * 
   * @param {Bus} bus The bus data
   */
  removeBus(bus) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      var busQuery = { imei: bus.imei };
      dbo.collection("buses").deleteOne(busQuery, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
    this.#buses.delete(bus.imei);
  }

  /**
   * Adds a out of bounds bus to the database
   * 
   * @param {Bus} bus The bus data
   */
  addOutOfBoundsBus(bus) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      var outOfBoundsBus = { bus: bus, time: new Date() };
      dbo.collection("outOfBoundsBuses").insertOne(outOfBoundsBus, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
  }

  /**
   * Callback for getting out of bounds buses
   * 
   * @callback getOutOfBoundsCallback
   * @param {object[]} result Out of bounds buses
   */

  /**
   * Gets out of bounds bus from the database
   * 
   * @param {getOutOfBoundsCallback} callback Callback for getting out of bounds buses
   */
  getOutOfBoundsBuses(callback) {
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);

      dbo.collection("outOfBoundsBuses").find({}, { projection: { _id: 0 } }).toArray((err, result) => {
        if (err) throw err;

        callback(result);
        db.close();
      });
    });
  }

  /**
   * Callback for login
   * 
   * @callback loginCallback
   * @param {string} token Security token
   */

  /**
   * Callback for login error
   * 
   * @callback loginErrorCallback
   */

  /**
   * Login function, takes username and password and returns a token if successful
   * 
   * @param {string} username Username
   * @param {string} password Password
   * @param {loginCallback} callback Callback function if login is successful, function takes a security token as an argument
   * @param {loginErrorCallback} errorCallback Callback function if login credentials were wrong
   */
  login(username, password, callback, errorCallback) {
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);

      var shasum = crypto.createHash('sha1')
      shasum.update(password)
      var hashedPassword = shasum.digest('hex')

      var query = { username: username, password: hashedPassword };
      dbo.collection("users").findOne(query, (err, result) => {
        if (err) throw err;
        if (result == null) {
          errorCallback();
        }
        else {
          let role=result.role;
          MongoClient.connect(dbUri, (err, db) => {
            if (err) throw err;

            var dbo = db.db(dbName);
            var buffer = crypto.randomBytes(48);
            var token = buffer.toString('hex');

            var tokenEntry = {
              token: token,
              userId: result._id,
              creationTime: new Date()
            };

            dbo.collection("tokens").createIndex({ "creationTime": 1 }, { expireAfterSeconds: tokenExpiry * 60 });
            dbo.collection("tokens").insertOne(tokenEntry, (err, result) => {
              db.close();
              callback(token,role);
            });
          });
        }

        db.close();
      });
    });
  }

  /**
   * Callback for token validation
   * 
   * @callback tokenCallback
   * @param {object} user User object
   * @param {string} user.username Username
   */

  /**
   * Callback for token validation error
   * 
   * @callback tokenErrorCallback
   */

  /**
   * Token validation function, takes a token and returns a user data if successful
   * 
   * @param {string} token Token string
   * @param {tokenCallback} callback Callback function if login is successful, function takes a security token as an argument
   * @param {tokenErrorCallback} errorCallback Callback function if login credentials were wrong
   */
  checkToken(token, callback, errorCallback) {
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      var query = { token: token };
      dbo.collection("tokens").findOne(query, (err, result) => {
        if (err) throw err;
        if (result == null) {
          errorCallback();
        }
        else {
          MongoClient.connect(dbUri, (err, db) => {
            if (err) throw err;

            var dbo = db.db(dbName);
            var query = { _id: result.userId };

            dbo.collection("users").findOne(query, { projection: { _id: 0, password: 0 } }, (err, result) => {
              db.close();
              callback(result);
            });
          });
        }

        db.close();
      });
    });
  }

  changeUserPassword(user, newPassword) {
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      var query = { username: user.username };

      var shasum = crypto.createHash('sha1')
      shasum.update(newPassword)
      var hashedPassword = shasum.digest('hex')

      var newValues = { $set: { password: hashedPassword } };
      dbo.collection("users").updateOne(query, newValues, (err, result) => {
        if (err) throw err;

        db.close();
      });
    });
  }

  
  addOrUpdateUser(user) {
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var hashedPassword = ''
      if (user.password) {
        var shasum = crypto.createHash('sha1')
        shasum.update(user.password)
        hashedPassword = shasum.digest('hex')
      }

      var dbo = db.db(dbName);
      var query = { username: user.username };

      dbo.collection("users").findOne(query, function (err, res) {
        if (err) throw err;

        if (!res) {
          MongoClient.connect(dbUri, function (err, db) {
            if (err) throw err;

            var dbo = db.db(dbName);
            dbo.collection("users").insertOne({ ...user, password: hashedPassword }, function (err, res) {
              if (err) throw err;

              db.close();
            });
          });
        }

        else {
          MongoClient.connect(dbUri, function (err, db) {
            if (err) throw err;

            var dbo = db.db(dbName);
            var newValues = { $set: {} }
            if (user.password) {
              newValues.$set.password = hashedPassword;
            }

            if (user.name) {
              newValues.$set.name = user.name;
            }

            if (user.phone_number) {
              newValues.$set.phone_number = user.phone_number;
            }

            if (user.role) {
              newValues.$set.role = user.role;
            }
            dbo.collection("users").updateOne(query, newValues, function (err, res) {
              if (err) throw err;

              db.close();
            });
          });
        }

        db.close();
      });
    });
  }

  async addUser(user) {
    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);

    var hashedPassword = ''
    if (user.password) {
      var shasum = crypto.createHash('sha1')
      shasum.update(user.password)
      hashedPassword = shasum.digest('hex')
    }

    var dbo = db.db(dbName);
    var query = { username: user.username };
    let count=await dbo.collection("users").countDocuments(query);

    if(count==0){
      MongoClient.connect(dbUri, function (err, db) {
        if (err) throw err;

        var dbo = db.db(dbName);
        dbo.collection("users").insertOne({ ...user, password: hashedPassword }, function (err, res) {
          if (err) throw err;

          db.close();
        });
      });
      return true;
    }
    else{
      return false;
    }

  }

  async UpdateUser(user) {
    var hashedPassword = ''
    if (user.password) {
      var shasum = crypto.createHash('sha1')
      shasum.update(user.password)
      hashedPassword = shasum.digest('hex')
    }

    var query = { username: user.username };

    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);

    let count=await dbo.collection("users").countDocuments(query);

    if(count==0){
      db.close();
      return true;
    }

    var dbo = db.db(dbName);
    var newValues = { $set: {} }
    if (user.password) {
      newValues.$set.password = hashedPassword;
    }

    if (user.name) {
      newValues.$set.name = user.name;
    }

    if (user.phone_number) {
      newValues.$set.phone_number = user.phone_number;
    }

    if (user.role) {
      newValues.$set.role = user.role;
    }
    dbo.collection("users").updateOne(query, newValues, function (err, res) {
      if (err) throw err;

      db.close();
    });
    return false;
  }


  removeUser(query) {
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);

      dbo.collection("users").deleteOne(query, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
  }

  async getUsers(query) {
    let p= new Promise(function(myresolve,myreject){
      MongoClient.connect(dbUri,async (err, db) => {
        if (err) throw err;

        var dbo = db.db(dbName);
        let result=await dbo.collection("users").find(query, { projection: { _id: 0, password: 0 } }).toArray();
        db.close()
        myresolve(result)
      });
    })
    p.then(function(val){
      return val;
    })
    return p    
  }

  async addTicketsIfNew(tickets){
    let new_ids=[];
    for (let i=0;i<tickets.length;i++ ){
      let ticket=tickets[i]
      ticket.checked=false;
      const db=await MongoClient.connect(dbUri)
      var dbo = db.db(dbName);
      
      let ticket_count= await dbo.collection("tickets").countDocuments({ id: ticket.id })

      if(ticket_count==0){
        await dbo.collection("tickets").insertOne(ticket, function(err, res) {
          if (err) throw err;
        });
        new_ids.push(ticket.id)
      }

      db.close();

      if(i+1==tickets.length){
        return new_ids;
      }
    }
    
  }

  async get_total(query){

    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);
    
    let total=await dbo.collection("tickets").aggregate([{
      $match:query,
    },{
      $group:{
        _id:null,
        total:{$sum:"$price"}
      }
    }
    ]).toArray()
    
    db.close();
    return total;
  }

  async get_tickets(query,page,limit){

    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);
    
    let tickets=await dbo.collection("tickets").find(query)
      .skip( page > 0 ? ( ( page - 1 ) * limit ) : 0 )
      .limit( limit ).toArray()

    let count=await dbo.collection("tickets").countDocuments(query)

    db.close();
    return {tickets:tickets,count:count};
  }


  async driver_checkout(driver_id){
   
    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);
    
    return await dbo.collection("tickets").updateMany({driver_id:driver_id,checked:false},{$set:{checked:true}},(err,res)=>{
      if (err){
        db.close();
        throw err
      } 
      db.close();
    });
  }

  async get_req_tickets(query,page,limit){

    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);
    
    let tickets=await dbo.collection("req_t").find(query)
      .skip( page > 0 ? ( ( page - 1 ) * limit ) : 0 )
      .limit( limit ).toArray()

    let count=await dbo.collection("req_t").countDocuments(query)

    db.close();
    return {tickets:tickets,count:count};
  }

  async add_req_tickets(tickets){
    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);
    
    await dbo.collection("req_t").insertOne(tickets, function(err, res) {
      if (err) throw err;
    });

    db.close();

  }

  async get_all_totals(id,query){

    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);
    
    let total=await dbo.collection("tickets").aggregate([{
      $match:query,
    },{
      $group:{
        _id:id,
        total:{$sum:"$price"}
      }
    }
    ]).toArray()
    
    db.close();
    return total;
  }
}


class Singleton {
  static #instance;

  /**
   * Gets instance of the database
   * 
   * @returns {Database}
   */
  static getInstance() {
    if (!this.#instance) {
      this.#instance = new Database();
    }
    return this.#instance;
  }

}

module.exports.Database = Singleton;


