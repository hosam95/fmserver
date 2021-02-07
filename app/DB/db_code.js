const mongo = require('mongodb');


let newdb = mysql.createConnection({
    host: 'localhost',
    user: 'hosam',
    password: '952001'
});

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

/*
module.exports.*/

function sql(q) {
    newdb.query(q, (err, result) => {
        if (err) throw err;
        return result;
    })
}