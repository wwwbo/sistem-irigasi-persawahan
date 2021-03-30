'use strict';

// memanggil module yang dibutuhkan
const response = require('../res/rest');
const connection = require('../connection/connection');
const gpio = require('rpi-gpio');
const flash = require('express-flash');

// setting port/pin untuk on/off relay
const relay = 40;
gpio.setup(relay, gpio.DIR_OUT);


// module page home
exports.home = function(req, res){
	res.render('index.ejs');
};

// module page resutls
exports.results = function(req, res){
	connection.query('SELECT * FROM ( SELECT id, ketinggian, kelembaban, keterangan, waktu_pompa, date_format(tanggal_waktu,"%d-%m-%Y, %h:%m:%s") as tanggal_waktu, tanggal, waktu FROM temp ORDER BY id DESC LIMIT 7 ) t ORDER BY id asc ', (error, rows, fields)=>{
		if (error) {
			console.log(error);
		} else {
			response.ok(rows, res);
		}
	});
};

// get all data from temp
exports.getData = function(req, res){
	connection.query('SELECT * FROM temp', (error, rows, fields)=>{
		if (error) {
			console.log(error);
		} else {
			response.ok(rows, res);
		}
	})
};

// url for page details
exports.uiResult = ((req, res)=>{
	res.render('details.ejs');
});

// request on pomp
exports.relayOff = ((req, res) => {
    gpio.write(relay, true, (error)=>{
        if (error) {
            console.log(error)
        } else {
            console.log('pin on');
        }
        req.flash('status1', 'Mati');
        res.redirect('/irigasi');
    });
    console.log(req.flash);
});

// request off pomp
exports.relayOn = ((req, res) => {
    gpio.write(relay, false, (error)=>{
        if (error) {
            console.log(error)
        } else {
            console.log('pin off');
        }
        req.flash('status1', 'Menyala')
        res.redirect('/irigasi');
    });
});
