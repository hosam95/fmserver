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

const dbHost = config.get('db.host');
const dbPort = config.get('db.port');
const dbName = config.get('db.name');
const dbUri = `mongodb://${dbHost}:${dbPort}`;
const tokenExpiry = config.get('auth.tokenExpiry'); // Expiry in minutes

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

  addTicketIfNew(ticket){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);

      let driver_id=ticket.d_id;
      let day_id=driver_id + ticket.date.toString();

      let day=dbo.collection("tdays").findOne({ id: day_id })
      let session_id=day_id+day.session_count.toString();

      let bus_id=session_id+ticket.b_id;
      let price_id=bus_id+ticket.price.toString();
      ticket.t_p_id=price_id;


      if(dbo.collection("tickets").find({ id: ticket.id }).count()==0){

        dbo.collection("tickets").insertOne(ticket, function(err, res) {
          if (err) throw err;
        });

        db.tdrivers.updateOne(
          { id: driver_id },
          { $inc: { total: ticket.price} }
        )

        db.tsessions.updateOne(
          { id: session_id },
          { $inc: { total: ticket.price} }
        )

        db.tdays.updateOne(
          { id: day_id },
          { $inc: { total: ticket.price} }
        )

        db.tbuss.updateOne(
          { id: bus_id },
          { $inc: { total: ticket.price} }
        )

        db.tprices.updateOne(
          { id: price_id },
          { $inc: { count: 1} }
        )

      }else{
        db.close();
        return{state:false,error:"ticket is already saved"}
      }
      db.close();
      return{state:true};
    });
  }

  get_tdrivers(only_active){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      let query={}
      if(only_active){
        query={is_active:true}
      }
      dbo.collection("tdrivers").find(query).toArray((err, result) => {
        if (err) throw err;

        db.close();
        return result;
      });
    });
  }

  get_tday_by_date(date){
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      let query={date:date}
      if(date==null){
        query={finished:false}
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
      if(dbo.collection("tdrivers").find({ id: d_id }).count()==0){
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
          session_count:0,
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
        id:dy_id+day.session_count.toString(),
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


module.exports. get_date=()=>{
  let ts = Date.now();

  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();

  // prints date & time in YYYY-MM-DD format
  return year.toString() + "-" + month.toString() + "-" + date.toString();
}



module.exports. get_time=()=>{
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

