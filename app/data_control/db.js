const config = require('config');
const MongoClient = require('mongodb').MongoClient;
const crypto = require('crypto');

/**
 * @typedef {Object} Line
 * @property {string} name Line name
 * @property {{long: Number, lat: Number}[]} map Line defining points
 * @property {Int32Array} index Line index
 * @property {{name:string, long: Number, lat: Number}[]} map Line defining points
 */

/**
 * @typedef {Object} Bus
 * @property {boolean} active The status of the bus
 * @property {string} driver The driver name
 * @property {string} imei A bus identifier
 * @property {string} line The name of the line the bus in
 * @property {{long: Number, lat: Number}} loc The current location of the bus
 */

const dbHost = config.get('db.host');
const dbPort = config.get('db.port');
const dbName = config.get('db.name');
const dbUri = `mongodb://${dbHost}:${dbPort}`;
const tokenExpiry = config.get('auth.tokenExpiry'); // Expiry in minutes

class Database {
    #lines = [];
    #buses = [];

    /**
     * Gets the current lines
     * 
     * @returns {Line[]}
     *  The current lines
     */
    get lines() {
        return this.#lines;
    }

    /**
     * Gets the current buses
     * 
     * @returns {object[]}
     *  The current buses
     */
    get buses() {
        return this.#buses;
    }

    constructor () {
        MongoClient.connect(dbUri, (err, db) => {
            if (err) throw err;

            var dbo = db.db(dbName);
            dbo.collection("lines").find({}, { projection: { _id: 0} }).toArray((err, result) => {
                if (err) throw err;

                this.#lines = result;
                db.close();
              });
            });
              
        MongoClient.connect(dbUri, (err, db) => {
            if (err) throw err;

            var dbo = db.db(dbName);
            dbo.collection("buses").find({}, { projection: { _id: 0} }).toArray((err, result) => {
                if (err) throw err;
                
                this.#buses = result;
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
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;

            var dbo = db.db(dbName);
            dbo.collection("lines").insertOne(line, function(err, res) {
              if (err) throw err;

              db.close();
            });
          });
        this.#lines.push(line);
    }

    /**
     * Adds a bus to the database
     * 
     * @param {Bus} bus The bus data
     */
    addBus(bus) {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;

            var dbo = db.db(dbName);
            dbo.collection("buses").insertOne(bus, function(err, res) {
              if (err) throw err;

              db.close();
            });
          });
        this.#buses.push(bus);
    }

    /**
     * Updates the line info if a line with existing name
     * 
     * @param {Line} line The Line data
     */
    updateLineInfo(line) {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;

            var dbo = db.db(dbName);
            var lineQuery = {name: line.name};
            var newLine = { $set: line };
            dbo.collection("lines").updateOne(lineQuery, newLine, function(err, res) {
              if (err) throw err;

              db.close();
            });
          });
        var idx = this.#lines.findIndex(x => x.name == line.name);
        this.#lines[idx] = line;
    }

    /**
     * Updates the bus info if a bus with existing IMEI
     * 
     * @param {Bus} bus The bus data
     */
    updateBusInfo(bus) {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;

            var dbo = db.db(dbName);
            var busQuery = {imei: bus.imei};
            var newBus = { $set: bus };
            dbo.collection("buses").updateOne(busQuery, newBus, function(err, res) {
              if (err) throw err;

              db.close();
            });
          });
          var idx = this.#buses.findIndex(x => x.imei == bus.imei);
          this.#buses[idx] = bus;
    }

    /**
     * Removes a line from the database
     * 
     * @param {Line} line The Line data
     */
    removeLine(line) {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;

            var dbo = db.db(dbName);
            var lineQuery = {name: line.name};
            dbo.collection("lines").deleteOne(lineQuery, function(err, res) {
              if (err) throw err;

              db.close();
            });
          });
        var idx = this.#lines.findIndex(x => x.name == line.name);
        this.#lines.splice(idx, 1);
    }

    /**
     * Removes a bus from the database
     * 
     * @param {Bus} bus The bus data
     */
    removeBus(bus) {
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;

            var dbo = db.db(dbName);
            var busQuery = {imei: bus.imei};
            dbo.collection("buses").deleteOne(busQuery, function(err, res) {
              if (err) throw err;

              db.close();
            });
          });
          var idx = this.#buses.findIndex(x => x.imei == bus.imei);
          this.#buses.splice(idx, 1);
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
                if(result == null){
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

                        dbo.collection("tokens").createIndex( { "createdAt": 1 }, { expireAfterSeconds: tokenExpiry * 60 } );
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
    checkToken(token, callback, errorCallback){
        MongoClient.connect(dbUri, (err, db) => {
            if (err) throw err;

            var dbo = db.db(dbName);
            var query = { token: token };
            dbo.collection("tokens").findOne(query, (err, result) => {
                if (err) throw err;
                if(result == null){
                    errorCallback();
                }
                else {
                    MongoClient.connect(dbUri, (err, db) => {
                        if (err) throw err;
            
                        var dbo = db.db(dbName);
                        var query = { _id: result.userId };

                        dbo.collection("users").findOne(query, { projection: { _id: 0, password: 0}}, (err, result) => {
                            db.close();
                            callback(result);
                        });
                    });
                }
                
                db.close();
              });
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