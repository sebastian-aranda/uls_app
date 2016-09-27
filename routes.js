module.exports = {
	configure: function(app, io){
		//Root
		app.get('/', function(req, res){
			res.sendFile(__dirname + '/index.html');
		});

		//Recibir Disparo
		app.get('/receive_shot/:match_id/:shooted_id', function(req, res){
			io.emit('receive_shot', {match_id: req.params.match_id, shooted_id: req.params.shooted_id}); //aviso a demas dispositivos
			res.send("ok"); //mensaje de respuesta
		});

		//Activar Medikit
		app.get('/heal_user/:match_id/:player_id', function(req, res){
			io.emit('heal_user', {match_id: req.params.match_id, player_id: req.params.player_id}); //aviso a demas dispositivos
			res.send("ok"); //mensaje de respuesta
		});

		//Activar Chaleco de proteccion
		app.get('/add_vest/:match_id/:player_id', function(req, res){
			io.emit('add_vest', {match_id: req.params.match_id, player_id: req.params.player_id}); //aviso a demas dispositivos
			res.send("ok"); //mensaje de respuesta
		});

		//Activar Bomba
		app.get('/planting_bomb/:match_id/:player_id', function(req, res){
			io.emit('planting_bomb', {match_id: req.params.match_id, player_id: req.params.player_id}); //aviso a demas dispositivos
			res.send("ok"); //mensaje de respuesta
		});

		//Notificar Muerte
		app.get('/die/:match_id/:player_id', function(req, res){
			io.emit('message', {event: 'die', match: req.params.match_id, player: req.params.player_id});
			res.send("ok");
		});

	}
};