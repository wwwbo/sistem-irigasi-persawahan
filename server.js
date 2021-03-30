const express = require('express');
const path = require('path');
const PORT = 3000;
const app = express();
const httpServer = require('http').Server(app);
const io = require('socket.io')(httpServer);
const flash = require('express-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const routes = require('./src/routes/routes');
const connection = require('./src/connection/connection');

// set session 
app.use(session({ 
  cookie: { 
    maxAge: 60000 
  },
  store: new session.MemoryStore,
  saveUninitialized: true,
  resave: 'true',
  secret: 'secret'
}));
app.use(flash());
app.use(cookieParser())

// set view for ui 
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// call function app in route
routes(app);


app.get('/irigasi', (req, res)=>{
 
    res.render('irigasi');

    var connectionsArray = [];
    var POLLING_INTERVAL = 5000;
    var pollingTimer;

    var pollingLoop = function() {

    var query = connection.query('SELECT * FROM ( SELECT id, ketinggian, kelembaban, keterangan, waktu_pompa, date_format(tanggal_waktu,"%d-%m-%Y, %h:%m:%s") as tanggal_waktu, tanggal, waktu FROM temp ORDER BY id DESC LIMIT 1 ) t ORDER BY id asc '),
    // hasil query akan dimasukan kedalam array
    lembab = []; 

    // set query
    query
      .on('error', function(err) {
        console.log(err);
        updateSockets(err);
      })
      .on('result', function(user) {
        lembab.push(user);
      })
      .on('end', function() {
        if (connectionsArray.length) {

          pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);

          updateSockets({
            lembab: lembab
          });
        } else {
          console.log('Server telah berhenti')
        }
      });
  };
  
  // membuat websocket baru untuk menjaga konten tetap diperbarui tanpa permintaan AJAX
  io.sockets.on('connection', function(socket) {

    console.log('Number of connections:' + connectionsArray.length);

    if (!connectionsArray.length) {
      pollingLoop();
    }

    socket.on('disconnect', function() {
      var socketIndex = connectionsArray.indexOf(socket);
      console.log('socketID = %s got disconnected', socketIndex);
      if (~socketIndex) {
        connectionsArray.splice(socketIndex, 1);
      }
    });

    console.log('A new socket is connected!');
    connectionsArray.push(socket);

  });

  var updateSockets = function(data) {
    data.time = new Date();
    connectionsArray.forEach(function(tmpSocket) {
      tmpSocket.volatile.emit('notification', data);
    });
  };

});

httpServer.listen(PORT, () => {
	console.log(`Server run on port ${PORT}`);
});
