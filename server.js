var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path')
var express = require('express');

app.use(express.static(path.join(__dirname, 'public')));

var routes = require('./routes').configure(app, io);

io.on('connection', function(socket){
	console.log('Un usuario se ha conectado.');
	
	socket.on('receive_shot', function(msg){
		console.log("Match "+msg.match+": Disparo en jugador con placa"+msg.chip_id);
	});

	socket.on('heal_user', function(msg){
		console.log("Match "+msg.match+": Medikit usado en jugador "+msg.player);
	});

	socket.on('add_vest', function(msg){
		console.log("Match "+msg.match+": Chaleco usado en jugador "+msg.player);
	});

	socket.on('planting_bomb', function(msg){
		console.log("Match "+msg.match+": Bomba plantada por jugador "+msg.player);
	});
});

var port = 3030;
http.listen(port, function(){
  console.log('listening on *'+port+':');
});
