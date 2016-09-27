var railsServer = "http://uls2016.herokuapp.com";
var nodeServer = "http://192.168.0.12:3030";

var placas = [-1, 54355, 1184463, 762964, -1, -1, -1, -1, -1, -1, -1];

var match_id = 1;

var startValue = 60000; //Number of milliseconds
var time = new Date(startValue);
var interv;

var estadoPartida = 1;
var buttonActive = {idButton: '', state: 0};
$.ajaxSetup({
    scriptCharset: "utf-8", //or "ISO-8859-1"
    contentType: "application/json; charset=utf-8"
});

$(function(){
	handleGetItem('medikit');
	/* BOTONES */
	$('#buttonBomb').on('click', function(){
		if (estadoPartida == 1){
			buttonActive.idButton = 'buttonBomb';
			buttonActive.state = $(this).attr('button-state');
			if (buttonActive.state == 0){
				buttonActive.state = 1;
				$(this).attr('button-state', 1);
				$(this).addClass('active');
			}
			else if (buttonActive.state == 1){
				buttonActive.state = 0;
				$(this).attr('button-state', 0);
				$(this).removeClass('active');
			}
		}
	});

	$('#buttonMedikit').on('click', function(){
		if (estadoPartida == 1){
			buttonActive.idButton = 'buttonMedikit';
			buttonActive.state = $(this).attr('button-state');
			if (buttonActive.state == 0){
				buttonActive.state = 1;
				$(this).attr('button-state', 1);
				$(this).addClass('active');
			}
			else if (buttonActive.state == 1){
				buttonActive.state = 0;
				$(this).attr('button-state', 0);
				$(this).removeClass('active');
			}
		}
	});

	$('#buttonVest').on('click', function(){
		if (estadoPartida == 1){
			buttonActive.idButton = 'buttonVest';
			buttonActive.state = $(this).attr('button-state');
			if (buttonActive.state == 0){
				buttonActive.state = 1;
				$(this).attr('button-state', 1);
				$(this).addClass('active');
			}
			else if (buttonActive.state == 1){
				buttonActive.state = 0;
				$(this).attr('button-state', 0);
				$(this).removeClass('active');
			}
		}
	});

	$('.playerStatus, .partner').on('click', function(){
		if (estadoPartida == 1){
			var player_id = $(this).attr('player-id');
			
			//Activate Medikit
			if (buttonActive.state == 1 && buttonActive.idButton == 'buttonMedikit'){
				//$.post(railsServer+'/matches/heal_user?match_id='+match_id+'&player_id='+player_id, function(res){});
				$.get(nodeServer+'/heal_user/'+match_id+'/'+player_id, function(res){
					//alert(res);
				});
				
				$('#buttonMedikit').hide();
				$('#buttonVest').hide();
				$('#buttonTakeItem').show();
			}

			//Activate Vest
			else if (buttonActive.state == 1 && buttonActive.idButton == 'buttonVest'){
				//$.post(railsServer+'/matches/add_vest?match_id='+match_id+'&player_id='+player_id, function(res){});
				$.get(nodeServer+'/add_vest/'+match_id+'/'+player_id, function(res){
					//alert(res);
				});

				$('#buttonMedikit').hide();
				$('#buttonVest').hide();
				$('#buttonTakeItem').show();
			}

			//Activate Bomb
			else if (buttonActive.state == 1 && buttonActive.idButton == 'buttonBomb'){
				//$.post(railsServer+'/matches/planting_bomb?match_id='+match_id+'&player_id='+player_id, function(res){});
				$.get(nodeServer+'/planting_bomb/'+match_id+'/'+player_id, function(res){
					//alert(res);
				});

				$('#buttonBomb').hide();
				$('#buttonTakeBomb').show();
			}

			$('#'+buttonActive.idButton).attr('button-state',0);
			$('#'+buttonActive.idButton).removeClass('active');
			buttonActive.idButton = '';
			buttonActive.state = 0;
		}
	});

	//Node Server Connection
	var socket = io.connect(nodeServer);

	socket.on('receive_shot', function(msg){
		if (estadoPartida == 1){
			var idPlayer = msg.shooted_id;
			var damage = 10;
			$.post(railsServer+'/matches/get_player?match_id='+match_id+'&player_id='+msg.shooted_id, function(res){
				alert(res.toString());
			}, 'json');
			var shieldBar = $('div[player-id="'+idPlayer+'"] .shield-bar');
	      	var totalShield = parseInt(shieldBar.parent().css('width').substring(0,shieldBar.parent().css('width').lastIndexOf("px")));
	      	var shieldPoints = parseInt(shieldBar.css('width').substring(0,shieldBar.css('width').lastIndexOf("px")));
	      	var finalShield = shieldPoints-(totalShield*damage/100);

	      	if (finalShield <= 0){
	      		finalShield = 0;
	      		diff = shieldBar.attr('aria-valuenow')-damage;
	      	}
	      	else
	      		diff = 0;
	      	
	      	shieldBar.attr('aria-valuenow', finalShield/totalShield*100);
	      	shieldBar.css('width', finalShield);
	      	shieldBar.change();

	      	if (finalShield == 0){
	      		if (diff != 0) damage = Math.abs(diff);

	      		var healthBar = $('div[player-id="'+idPlayer+'"] .health-bar');
		      	var totalHealth = parseInt(healthBar.parent().css('width').substring(0,healthBar.parent().css('width').lastIndexOf("px")));
		      	var healthPoints = parseInt(healthBar.css('width').substring(0,healthBar.css('width').lastIndexOf("px")));
		      	var finalHealth = healthPoints-(totalHealth*damage/100);

		      	if (finalHealth <= 0) finalHealth = 0;

		      	healthBar.attr('aria-valuenow', finalHealth/totalHealth*100);
		      	healthBar.css('width', finalHealth);
		      	healthBar.change();
	      	}
	    }
	});

    socket.on('heal_user', function(msg){
    	if (estadoPartida == 1){
	      	var healthBar = $('div[player-id="'+msg.player_id+'"] .health-bar');
	      	var totalHealth = parseInt(healthBar.parent().css('width').substring(0,healthBar.parent().css('width').lastIndexOf("px")));
	      	var healthPoints = parseInt(healthBar.css('width').substring(0,healthBar.css('width').lastIndexOf("px")));
	      	var finalHealth = healthPoints+(totalHealth*0.2);
	      	if (finalHealth >= totalHealth) finalHealth = totalHealth;
	      	healthBar.attr('aria-valuenow', finalHealth/totalHealth*100);
	      	healthBar.css('width', finalHealth);
	      	healthBar.change();
	    }
    });

    socket.on('add_vest', function(msg){
    	if (estadoPartida == 1){
	      	var shieldBar = $('div[player-id="'+msg.player_id+'"] .shield-bar');
	      	var totalShield = parseInt(shieldBar.parent().css('width').substring(0,shieldBar.parent().css('width').lastIndexOf("px")));
	      	var shieldPoints = parseInt(shieldBar.css('width').substring(0,shieldBar.css('width').lastIndexOf("px")));
	      	var finalShield = shieldPoints+(totalShield*0.2);
	      	if (finalShield >= totalShield) finalShield = totalShield;
	      	shieldBar.attr('aria-valuenow', finalShield/totalShield*100);
	      	shieldBar.css('width', finalShield);
	      	shieldBar.change();
	    }
    });

    socket.on('planting_bomb', function(msg){
    	if (estadoPartida == 1){
    		//TODO: bomb activation
    	}
    });

    //Mensaje cuando muere un jugador
    $('.health-bar').on('change', function(){
    	if ($(this).attr('aria-valuenow') <= 0){
			var container = $(this).parents('div[player-id]');
			var player_id = container.attr('player-id');
			container.hide();
    		$('.messages span').html('Jugador '+player_id+' ha muerto');
    		$('.messages span').fadeIn(1500).fadeOut(1500);
    	}
    });

    /* TIMER */
	function done(){
		estadoPartida = 0;
	    $('.messages span').html('Partida Terminada');
    	$('.messages span').fadeIn(1500);
	}
	function displayTime(){
	    $(".time").text(fillZeroes(time.getMinutes()) + ":" + fillZeroes(time.getSeconds()));
	}
	displayTime();
    var interv = setInterval(function(){
        time = new Date(time - 1000);
        if(time<=0){
            done();
            clearInterval(interv);
        }
        displayTime();
    }, 1000);
    
    /*$(".pause").on("click", function(){
        clearInterval(interv);
    });
    $(".reset").on("click", function(){
        time = new Date(startValue);
        displayTime();
    });*/

    function handleGetItem(res){
    	if (res == 'medikit'){
			$('#buttonTakeItem').hide();
    		$('#buttonMedikit').show();
    	}
    	else if (res == 'vest'){
    		$('#buttonTakeItem').hide();
    		$('#buttonVest').show();

    	}
    	else if (res == 'bomb'){
    		$('#buttonTakeBomb').hide();
    		$('#buttonBomb').show();
    	}
    }
});

function fillZeroes(t){
    t = t+"";
    if(t.length==1)
        return "0" + t;
    else
        return t;
}

