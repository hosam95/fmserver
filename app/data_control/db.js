const config = require('config');
const MongoClient = require('mongodb').MongoClient;
const crypto = require('crypto');

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

/**
 * @typedef {Object} id_counter
 * @property {string} obj the object you are setting a counter for.
 * @property {Int32Array} last the last id you have assigned.
 */

const dbHost = config.get('db.host');
const dbPort = config.get('db.port');
const dbName = config.get('db.name');
const dbUri = `mongodb://${dbHost}:${dbPort}`;
const tokenExpiry = config.get('auth.tokenExpiry'); // Expiry in minutes

const get_date=()=>{
  let ts = Date.now();

  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();

  // prints date & time in YYYY-MM-DD format
  return year.toString() + "-" + month.toString() + "-" + date.toString();
}



const get_time=()=>{
  let ts = Date.now();
  let date_ob = new Date(ts);

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  // current seconds
  let seconds = date_ob.getSeconds();

  return hours.toString()+":"+minutes.toString()+":"+seconds.toString();
}


class Database {
  #lines = new Map();
  #buses = new Map();

  /**
   * Gets the current lines
   * 
   * @returns {Line[]}
   *  The current lines
   */
  lines() {
    return this.#lines;
  }

  /**
   * Gets the current buses
   * 
   * @returns {Bus[]}
   *  The current buses
   */
  buses() {
    return this.#buses;
  }

  constructor() {
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

    // create collections if thay doesn't exist.

    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.listCollections({name: "last_id_counter"})
        .next(function(err, collinfo) {
          if (!collinfo) {
            MongoClient.connect(dbUri, (err, db) => {
              if (err) throw err;
              
              var dbo = db.db(dbName);
              dbo.createCollection("last_id_counter");
            });
            MongoClient.connect(dbUri, (err, db) => {
              if (err) throw err;

              var dbo = db.db(dbName);
              dbo.collection("last_id_counter").insertOne({ obj:"users",last:1010 }, function (err, res) {
                if (err) throw err;
              });
              
            });
            
          }
      });
      db.close();
    });

    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.listCollections({name: "tdrivers"})
        .next(function(err, collinfo) {
          if (!collinfo) {
            MongoClient.connect(dbUri, (err, db) => {
              if (err) throw err;
              
              var dbo = db.db(dbName);
              dbo.createCollection("tdrivers");
            });
          }
      });
      db.close();
    });

    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.listCollections({name: "tdays"})
        .next(function(err, collinfo) {
          if (!collinfo) {
            MongoClient.connect(dbUri, (err, db) => {
              if (err) throw err;
              
              var dbo = db.db(dbName);
              dbo.createCollection("tdays");
            });
          }
      });
      db.close();
    });

    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.listCollections({name: "tsessions"})
        .next(function(err, collinfo) {
          if (!collinfo) {
            MongoClient.connect(dbUri, (err, db) => {
              if (err) throw err;
              
              var dbo = db.db(dbName);
              dbo.createCollection("tsessions");
            });
          }
      });
      db.close();
    });

    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.listCollections({name: "tbuss"})
        .next(function(err, collinfo) {
          if (!collinfo) {
            MongoClient.connect(dbUri, (err, db) => {
              if (err) throw err;
              
              var dbo = db.db(dbName);
              dbo.createCollection("tbuss");
            });
          }
      });
      db.close();
    });

    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.listCollections({name: "tprices"})
        .next(function(err, collinfo) {
          if (!collinfo) {
            MongoClient.connect(dbUri, (err, db) => {
              if (err) throw err;
              
              var dbo = db.db(dbName);
              dbo.createCollection("tprices");
            });
          }
      });
      db.close();
    });

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
      var lineQuery = { name: line.name };
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
    this.#buses.set(bus.imei,bus);
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
          MongoClient.connect(dbUri, (err, db) => {
            if (err) throw err;

            var dbo = db.db(dbName);
            var buffer = crypto.randomBytes(48);
            var token = buffer.toString('hex');

            var tokenEntry = {
              token: token,
              userId: result._id,
              createdAt: new Date()
            };

            dbo.collection("tokens").createIndex({ "createdAt": 1 }, { expireAfterSeconds: tokenExpiry * 60 });
            dbo.collection("tokens").insertOne(tokenEntry, (err, result) => {
              db.close();
              callback(token);
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

            let new_id;
            var dbo = db.db(dbName);
            dbo.collection("last_id_counter").findOne({obj:"users"}, function (err, res) {
              if (err) throw err;
              
              new_id=res.last.toString();
            });

            MongoClient.connect(dbUri, function (err, db) {
              if (err) throw err;
    
              var dbo = db.db(dbName);
              dbo.collection("last_id_counter").updateOne({obj:"users"},{$inc: { last: 1}});
              db.close();
            });
            MongoClient.connect(dbUri, function (err, db) {
              if (err) throw err;
    
              var dbo = db.db(dbName);
              dbo.collection("users").insertOne({ ...user, password: hashedPassword,id:new_id }, function (err, res) {
                if (err) throw err;

                MongoClient.connect(dbUri, function (err, db) {
                  if (err) throw err;
        
                  var dbo = db.db(dbName);
                  dbo.collection("tdrivers").insertOne({id:new_id,total:0,is_active:true,l_paycheck_date:get_date(),l_paycheck_time:get_time()}, function (err, res) {
                    if (err) throw err;
                  });
                  db.close();
                });
                
              });
              db.close();
            });
            
            db.close();
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

  removeUser(user) {
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      var query = { username: user.username };

      dbo.collection("users").deleteOne(query, function (err, res) {
        if (err) throw err;

        db.close();
      });
    });
  }

  getUsers(callback) {
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("users").find({}, { projection: { _id: 0, password: 0 } }).toArray((err, result) => {
        if (err) throw err;

        callback(result);
        db.close();
      });
    });
  }

  async check_ticket_tree(price_id,price,bus_id,b_id,session_id,t_dy_id,t_dr_id){

    const db=await MongoClient.connect(dbUri)
    var dbo = db.db(dbName);

    let price_c
    // check if price exists.
    price_c=await dbo.collection("tprices").countDocuments({ id: price_id })
    
    if(price_c){
      db.close();
      return
    }

    // create price.
    let price_demo={
      id:price_id,
      price:price,
      count:0,
      t_b_id:bus_id
    }
    dbo.collection("tprices").insertOne(price_demo)

    let bus_c
    // check if bus exists.
    bus_c=await dbo.collection("tbuss").countDocuments({ id: bus_id })
      
    if(bus_c){
      db.close();
      return
    }
    // create bus.
    let bus_demo={
      id:bus_id,
      b_id:b_id,
      total:0,
      t_s_id:session_id
    }
    dbo.collection("tbuss").insertOne(bus_demo)

    let session_c
    // check if session exists.
    session_c=await dbo.collection("tsessions").countDocuments({ id: session_id })

    if(session_c){
      db.close();
      return
    }
    // create session.
    let session_demo={
      id:session_id,
      finished:false,
      total:0,
      t_dr_id:t_dr_id,
      t_dy_id:t_dy_id
    }
    dbo.collection("tsessions").insertOne(session_demo)
    db.close();
  }

  async addTicketsIfNew(tickets){
    let errors=[];
    for (let i=0;i<tickets.length;i++ ){
      let ticket=tickets[i]
      const db=await MongoClient.connect(dbUri)
      var dbo = db.db(dbName);

      let driver_id=ticket.d_id;
      let day_id=driver_id + ticket.date.toString();
      let day=null;
      day=  await dbo.collection("tdays").findOne({ id: day_id })
      
      if(!day){
        day={
          id:day_id,
          date:ticket.date.toString(),
          finished:false,
          total:0,
          sessions_count:0,
          t_dr_id:driver_id
        }
        
        dbo.collection("tdays").insertOne(day)
      }

      let session_id=day_id+day.sessions_count.toString();

      let bus_id=session_id+ticket.b_id;
      let price_id=bus_id+ticket.price.toString();
      ticket.t_p_id=price_id;
      let re_ticket
      
      re_ticket= await dbo.collection("tickets").countDocuments({ id: ticket.id })

      if(re_ticket<1){

        this.check_ticket_tree(price_id,ticket.price,bus_id,ticket.b_id,session_id,day_id,driver_id);

        await dbo.collection("tickets").insertOne(ticket, function(err, res) {
          if (err) throw err;
        });

        /*dbo.collection("tdrivers").updateOne(
          { id: driver_id },
          { $inc: { total: ticket.price} }
        )

        dbo.collection("tsessions").updateOne(
          { id: session_id },
          { $inc: { total: ticket.price} }
        )

        dbo.collection("tdays").updateOne(
          { id: day_id },
          { $inc: { total: ticket.price} }
        )
        dbo.collection("tbuss").updateOne(
          { id: bus_id },
          { $inc: { total: ticket.price} }
        )*/

        await dbo.collection("tprices").updateOne(
          { id: price_id },
          { $inc: { count: 1} }
        )

        db.close();

      }else{
        errors.push({t_id:ticket.id,error:"ticket is already saved"})
      }
      if(i+1==tickets.length){
        return errors;
      }
    }
    
  }

  get_tdrivers(only_active,callback){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      let query={}
      if(only_active){
        query={is_active:true}
      }
      dbo.collection("tdrivers").find(query).toArray((err, result) => {
        if (err) throw err;

        callback(result)
        db.close();
      });
    });
  }

  get_tday_by_date(date,driver_id){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      let query={date:date ,t_dr_id:driver_id}
      if(date==null){
        query={finished:false,t_dr_id:driver_id}
      }
      dbo.collection("tdays").find(query).toArray((err, result) => {
        if (err) throw err;

        db.close();
        return result;
      });
    });
  }
  
  get_sessions_by_day_id(day_id){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("tsession").find({t_dy_id:day_id}).toArray((err, result) => {
        if (err) throw err;

        db.close();
        return result;
      });
    });
  }

  get_buss_by_session_id(session_id){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("tbuss").find({t_s_id:session_id}).toArray((err, result) => {
        if (err) throw err;

        db.close();
        return result;
      });
    });
  }

  get_prices_by_bus_id(bus_id){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("tprices").find({t_b_id:bus_id}).toArray((err, result) => {
        if (err) throw err;

        db.close();
        return result;
      });
    });
  }

  get_tickets_by_tprice_id(tprice_id){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("tickets").find({t_p_id:tprice_id}).toArray((err, result) => {
        if (err) throw err;

        db.close();
        return result;
      });
    });
  }

  has_drivr(d_id){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      if(dbo.collection("tdrivers").countDocuments({ id: d_id })==0){
        db.close();
        return false;
      }
      db.close();
      return true;     
    });
  }


  finish_session(dr_id){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);

      //create the new session first.
      let date=this.get_date;
      let dy_id=dr_id+date;
      let day =dbo.tdays.findOne({id:dy_id})
      if(day==null){
        day={
          id:dy_id,
          date:date,
          finished:false,
          total:0,
          sessions_count:0,
          t_dr_id:dr_id
        }
        dbo.tdays.insertOne(day, function(err, res) {
          if (err) throw err;
        });
      }
      let sessions;
      dbo.tsessions.find({finished:false,t_dr_id:dr_id}).toArray((err,res)=>{
        if(err)throw err

        sessions=res;
      })
      dbo.tsessions.insertOne({
        id:dy_id+day.sessions_count.toString(),
        finished:false,
        total:0,
        t_dr_id:dr_id,
        t_dy_id:dy_id
      })

      //finish current sessions.
      let sessions_ids=sessions.map((a)=>{return a.id})
      dbo.tsessions.update({id:{$in:sessions_ids}},{$set:{finished:true}});

      //finish all unfinished days exepte for the current day.
      let days
      dbo.tdays.find({finished:false,t_dr_id:dr_id}).toArray((err,res)=>{
        if(err)throw err

        days=res;
      })
      let days_ids=days.map((a)=>{if(a.id==day.id){return null};return a.id})
      dbo.tdays.update({id:{$in:days_ids}},{$set:{finished:true}});

      //get driver total.
      let d_total
      dbo.collection("tdrivers").findOne({id:dr_id}, function(err, res) {
        if (err) throw err;

        d_total=res.total;
      });
      //update driver.
      dbo.tdrivers.update({id:dr_id},{$set:{total:0 , l_paycheck_date:date ,l_paycheck_time:this.get_time()}});

      db.close();
      return d_total;
    });
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


