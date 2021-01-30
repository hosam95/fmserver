const mysql = require ('mysql');


let newdb = mysql.createConnection({
    host :'localhost',
    user :'hosam',
    password : '952001'
});

newdb.connect ((err) =>{
    if(err) throw err;
    console.log('connection create.')
    newdb.query('CREATE DATABASE FMdb', (err,result) =>{
        if (err) throw err;
        console.log ('DataBase Criated')
    })
});