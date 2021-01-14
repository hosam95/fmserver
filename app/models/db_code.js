const mysql = require ('mysql');
const dbConfig = require("../config/db.config.js");

module.exports. create_db = () =>{

    let newdb = mysql.createConnection({
        host: dbConfig.HOST,
        user: dbConfig.USER,
        password: dbConfig.PASSWORD
    });

    newdb.connect ((err) =>{
        if(err) throw err;
        console.log('connection create.')
        newdb.query('CREATE DATABASE FMdb', (err,result) =>{
            if (err) throw err;
            console.log ('DataBase Criated')
        })
    });
}

//..................................................................

module.exports. new_month = () =>{
    //################################
}

//..................................................................

module.exports. get_db_month = () =>{
    //################################
}
