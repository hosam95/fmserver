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
   * @returns {Bus[]}
   *  The current buses
   */
  get buses() {
    return this.#buses;
  }

  constructor() {
    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("lines").find({}, { projection: { _id: 0 } }).toArray((err, result) => {
        if (err) throw err;

        this.#lines = result;
        db.close();
      });
    });

    MongoClient.connect(dbUri, (err, db) => {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("buses").find({}, { projection: { _id: 0 } }).toArray((err, result) => {
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
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("lines").insertOne(line, function (err, res) {
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
    MongoClient.connect(dbUri, function (err, db) {
      if (err) throw err;

      var dbo = db.db(dbName);
      dbo.collection("buses").insertOne(bus, function (err, res) {
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
    var idx = this.#lines.findIndex(x => x.name == line.name);
    this.#lines[idx] = line;
  }

  /**
   * Updates the line info if a line with existing name
   * 
   * @param {string} name The Line name
   */
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
    var idx = this.#buses.findIndex(x => x.imei == bus.imei);
    this.#buses[idx] = bus;
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

        db.close();
      });
    });
    var idx = this.#buses.findIndex(x => x.imei == imei);
    this.#buses[idx] = { ...this.#buses[idx], ...bus };
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
    var idx = this.#lines.findIndex(x => x.name == line.name);
    this.#lines.splice(idx, 1);
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
    var idx = this.#buses.findIndex(x => x.imei == bus.imei);
    this.#buses.splice(idx, 1);
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