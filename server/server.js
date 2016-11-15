//Node Server for Handling Device Connections for Ultimate Laser Shot

var express = require('express');
var sockjs  = require('sockjs');
var http    = require('http');
var $ = require('jquery');

// 1. Echo sockjs server
var clients = {};
var equipmentStates = {"1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [], "10": []};
var equipmentIds = {
	"pistola": ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
	"chaleco": ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
	"dispositivo": ['Linux; Android 5.1; Lenovo A2010l36 Build/LMY47D; wv', '2', '3', '4', '5', 'Linux; Android 5.1; XT1032 Build/LPBS23.13-56-2; wv', 'Linux; Android 6.0.1; SM-A310M Build/MMB29K; wv', '8', '9', '10']
};
var sockjs_opts = {sockjs_url: "./sockjs.min.js"};
var sockjs_echo = sockjs.createServer(sockjs_opts);

sockjs_echo.on('connection', function(conn) {
    clients[conn.id] = conn;
    var equipment = getEquipment(conn);

    /*conn.on('data', function(message) {
        conn.write(message);
    });*/

    conn.on('close', function() {
        delete clients[conn.id];
        //removeDevice(equipment[1]);
        console.log("Usuario "+equipment[1]+" DESCONECTADO");
    });

    console.log("Usuario "+equipment[1]+" {"+equipment[0]+"} CONECTADO");
});

// 2. Express server
var app = express(); /* express.createServer will not work here */
var server = http.createServer(app);
sockjs_echo.installHandlers(server, {prefix:'/echo'});

console.log(' [*] Listening on 0.0.0.0:3030' );
server.listen(3030, '0.0.0.0');

app.get('/start_match/:match_id', function (req, res) {
	var msg = '{"event": "start_match", "match_id": "'+req.params.match_id+'"}';
    broadcast(msg);
    console.log('start_match '+req.params.match_id);
    res.send('ok');
});

app.get('/receive_shot/:match_id/:shooted_id', function (req, res) {
	var msg = '{"event": "receive_shot", "match_id": "'+req.params.match_id+'", "shooted_id": "'+req.params.shooted_id+'"}';
	broadcast(msg);
    console.log('receive_shot '+req.params.match_id+' '+req.params.shooted_id);
    res.send('ok');
});

app.get('/player_die/:player_id', function (req, res) {
	var msg = '{"event": "player_die", "player_id": "'+req.params.player_id+'"}';
	broadcast(msg);
    res.send('ok');
    console.log('player_die '+req.params.player_id);
});

app.get('/heal_user/:match_id/:player_id', function (req, res) {
	var msg = '{"event": "heal_user", "match_id": "'+req.params.match_id+'", "player_id": "'+req.params.player_id+'"}';
	broadcast(msg);
    console.log('heal_user '+req.params.player_id);
    res.send('ok');
});

app.get('/add_vest/:match_id/:player_id', function (req, res) {
	var msg = '{"event": "add_vest", "match_id": "'+req.params.match_id+'", "player_id": "'+req.params.player_id+'"}';
	broadcast(msg);
    console.log('add_vest '+req.params.player_id);
    res.send('ok');
});

app.get('/planting_bomb/:match_id/:player_id', function (req, res) {
	var msg = '{"event": "planting_bomb", "match_id": "'+req.params.match_id+'", "player_id": "'+req.params.player_id+'"}';
	broadcast(msg);
    console.log('planting_bomb '+req.params.player_id);
    res.send('ok');
});

app.get('/defusing_bomb/:match_id/:player_id', function (req, res) {
	var msg = '{"event": "defusing_bomb", "match_id": "'+req.params.match_id+'", "player_id": "'+req.params.player_id+'"}';
	broadcast(msg);
    console.log('defusing_bomb '+req.params.player_id);
    res.send('ok');
});

app.get('/device_on/:equipment_id/:type', function (req, res) {
	addDevice(req.params.equipment_id, req.params.type);

    console.log('dispositivo ON '+req.params.equipment_id+'-'+req.params.type);
    res.send('ok');
});

app.get('/device_off/:equipment_id/:type', function (req, res) {
	removeDevice(req.params.equipment_id, req.params.type);
    
    console.log('dispositivo OFF '+req.params.equipment_id+'-'+req.params.type);
    res.send('ok');
});

app.get('/device_state/:equipment_id', function (req, res) {
    res.send(equipmentStates[req.params.equipment_id]);

});

function addDevice(equipment_id, device){
	if (equipmentStates[equipment_id] != null)
		equipmentStates[equipment_id].push(device);
	else
		equipmentStates[equipment_id] = [device];
}

function removeDevice(equipment_id, device){
	var index = equipmentStates[equipment_id].indexOf(device);
	equipmentStates[equipment_id].splice(index, 1);
}

function getEquipment(conn){
	var useragent, aux;
    aux = conn.headers['user-agent'].split("(");
    aux = aux[1].split(")");
    useragent = aux[0];

    for (x in equipmentIds){
    	if (equipmentIds[x].indexOf(useragent) != -1)
    		var result = equipmentIds[x].indexOf(useragent) + 1;
    }
    
    return [useragent, result];
}

function broadcast(msg){
	for (client in clients){
		clients[client].write(msg);
	}
}