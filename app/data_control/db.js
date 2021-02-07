const config = require('config');
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert');

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

//create connection.
module.exports.create_connection = () => {
    newdb.connect((err) => {
        if (err) throw err;
        console.log('connection create.')
    });
}

//create database.
module.exports.create_db = () => {
    newdb.query('CREATE DATABASE IF NOT EXISTS FMdb', (err, result) => {
        if (err) throw err;
        console.log('DataBase Criated')
    })
}

//create tables.
module.exports.create_tables = () => {
    table1 = 'CREATE TABLE IF NOT EXISTS data (id INT PRIMARY KEY AUTO_INCREMENT,time DATETIME(2) NOT NULL DEFAULT NOW(), lines VARCHAR(1000) NOT NULL,buses VARCHAR(1000) NOT NULL )'
    sql(table1);
    /*
    teble2='' 

    sql(table2);
    */
}


//insert into *data table*.
module.exports.insert_in_data = (lines, buses) => {
    statmint = "INSERT INTO data (lines,buses) VALUES (\'" + lines + "\',\'" + buses + "\');";
    sql(statmint);
}

const dbHost = config.get('db.host');
const dbPort = config.get('db.port');
const dbName = config.get('db.name');
const dbUri = `mongodb://${dbHost}:${dbPort}`;

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

            var db = this.#mongoClient.db(dbName);
            db.collection("lines").find({}).toArray((err, result) => {
                if (err) throw err;

                delete result._id
                this.#lines = result;
                db.close();
              });
            });
              
        MongoClient.connect(dbUri, (err, db) => {
            if (err) throw err;

            db.collection("buses").find({}).toArray((err, result) => {
                if (err) throw err;
                
                delete result._id
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
            var dbLine = { ...line, _id: line.name };
            dbo.collection("lines").insertOne(dbLine, function(err, res) {
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
            var dbBus = { ...bus, _id: bus.imei };
            dbo.collection("buses").insertOne(dbBus, function(err, res) {
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

    }

    /**
     * Updates the bus info if a bus with existing IMEI
     * 
     * @param {Bus} bus The bus data
     */
    updateBusInfo(bus) {

    }

    /**
     * Removes a line from the database
     * 
     * @param {Line} line The Line data
     */
    removeLine(line) {

    }

    /**
     * Removes a bus from the database
     * 
     * @param {Bus} bus The bus data
     */
    removeBus(bus) {

    }
}


class Singleton {

    constructor() {
        if (!Singleton.instance) {
            Singleton.instance = new Database();
        }
    }
  
    getInstance() {
        return Singleton.instance;
    }
  
  }
  
  module.exports = Singleton;