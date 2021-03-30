'use strict';

// memanggil module mysql
const mysql = require('mysql');

// membuat keneksi ke database
const connection = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	password : 'root',
	database : 'irigasi'
});

// mengecek koneksi database
connection.connect((err)=>{
	if (err) {
		console.log('Err connectiong '+ err.stack);
		return;
	}
	console.log('Database connected...')
});

module.exports = connection;