var railsServer = "http://uls2016.herokuapp.com";
var nodeServer = "http://190.100.245.161:3030";

var placas = [54355, 1184463, 762964, -1, -1, -1, -1, -1, -1, -1];
var placas_jugador = {54355: 1, 1184463: 2, 762964: 3};

var buttonActive = {idButton: '', state: 0};

var match_id = 1;
$(function(){
	/* BOTONES */
	$('#buttonBomb').on('click', function(){
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
	});

	$('#buttonMedikit').on('click', function(){
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
	});

	$('#buttonVest').on('click', function(){
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
	});

	$('.playerStatus, .partner').on('click', function(){
		var player_id = $(this).attr('player-id');
		
		//Activate Medikit
		if (buttonActive.state == 1 && buttonActive.idButton == 'buttonMedikit'){
			//$.post(railsServer+'/matches/heal_user?match_id='+match_id+'&player_id='+player_id, function(res){});
			$.get(nodeServer+'/heal_user/'+match_id+'/'+player_id, function(res){
				//alert(res);
			});
		}

		//Activate Vest
		else if (buttonActive.state == 1 && buttonActive.idButton == 'buttonVest'){
			//$.post(railsServer+'/matches/add_vest?match_id='+match_id+'&player_id='+player_id, function(res){});
			$.get(nodeServer+'/add_vest/'+match_id+'/'+player_id, function(res){
				//alert(res);
			});
		}

		//Activate Bomb
		else if (buttonActive.state == 1 && buttonActive.idButton == 'buttonBomb'){
			//$.post(railsServer+'/matches/planting_bomb?match_id='+match_id+'&player_id='+player_id, function(res){});
			$.get(nodeServer+'/planting_bomb/'+match_id+'/'+player_id, function(res){
				//alert(res);
			});
		}

		$('#'+buttonActive.idButton).attr('button-state',0);
		$('#'+buttonActive.idButton).removeClass('active');
		buttonActive.idButton = '';
		buttonActive.state = 0;
	});

	//Node Server Connection
	var socket = io.connect(nodeServer);

	socket.on('receive_shot', function(msg){
		var idPlayer = 0;
		/*$.post(railsServer+'/matches/get_player?match_id='+match_id+'&player_id='+msg.shooted_id, function(res){
			alert(res.toString());
		}, 'json');*/
		var shieldBar = $('div[player-id="'+idPlayer+'"] .shield-bar');
      	var totalShield = parseInt(shieldBar.parent().css('width').substring(0,shieldBar.parent().css('width').lastIndexOf("px")));
      	var shieldPoints = parseInt(shieldBar.css('width').substring(0,shieldBar.css('width').lastIndexOf("px")));
      	var finalShield = shieldPoints-(totalShield*0.10);
      	
      	if (finalShield <= 0){
      		finalShield = 0;
      		diff = shieldBar.attr('aria-valuenow')-10;
      	}
      	else
      		diff = 0;
      	
      	shieldBar.attr('aria-valuenow', finalShield/totalShield*100);
      	shieldBar.css('width', finalShield);
      	shieldBar.change();

      	if (finalShield == 0){
      		var damage;
      		if (diff != 0) damage = Math.abs(diff)/100;
      		else damage = 0.05;

      		var healthBar = $('div[player-id="'+idPlayer+'"] .health-bar');
	      	var totalHealth = parseInt(healthBar.parent().css('width').substring(0,healthBar.parent().css('width').lastIndexOf("px")));
	      	var healthPoints = parseInt(healthBar.css('width').substring(0,healthBar.css('width').lastIndexOf("px")));
	      	var finalHealth = healthPoints-(totalHealth*damage);

	      	if (finalHealth <= 0) finalHealth = 0;

	      	healthBar.attr('aria-valuenow', finalHealth/totalHealth*100);
	      	healthBar.css('width', finalHealth);
	      	healthBar.change();
      	}
	});

    socket.on('heal_user', function(msg){
      	var healthBar = $('div[player-id="'+msg.player_id+'"] .health-bar');
      	var totalHealth = parseInt(healthBar.parent().css('width').substring(0,healthBar.parent().css('width').lastIndexOf("px")));
      	var healthPoints = parseInt(healthBar.css('width').substring(0,healthBar.css('width').lastIndexOf("px")));
      	var finalHealth = healthPoints+(totalHealth*0.2);
      	if (finalHealth >= 100) finalHealth = 100;
      	healthBar.attr('aria-valuenow', finalHealth/totalHealth);
      	healthBar.css('width', finalHealth);
      	healthBar.change();
    });

    socket.on('add_vest', function(msg){
      	var shieldBar = $('div[player-id="'+msg.player_id+'"] .shield-bar');
      	var totalShield = parseInt(shieldBar.parent().css('width').substring(0,shieldBar.parent().css('width').lastIndexOf("px")));
      	var shieldPoints = parseInt(shieldBar.css('width').substring(0,shieldBar.css('width').lastIndexOf("px")));
      	var finalShield = shieldPoints+(totalShield*0.2);
      	if (finalShield >= 100) finalShield = 100;
      	shieldBar.attr('aria-valuenow', finalShield/totalShield);
      	shieldBar.css('width', finalShield);
      	shieldBar.change();
    });

    socket.on('planting_bomb', function(msg){
      //TODO: bomb activation
    });

    //Mensaje cuando muere un jugador
    $('.health-bar').on('change', function(){
    	if ($(this).attr('aria-valuenow') <= 0.00){
			var container = $(this).parents('div[player-id]');
			var player_id = container.attr('player-id');
			container.hide();
    		$('.messages span').html('Jugador '+player_id+' ha muerto');
    		$('.messages span').fadeIn(1500).fadeOut(1500);
    	}
    });

    /* TIMER */
	var startValue = 600000; //Number of milliseconds
	var time = new Date(startValue);
	var interv;

	function done(){
	    $('.messages span').html('Partida Terminada');
    	$('.messages span').fadeIn(1500).fadeOut(1500);
	}
	function displayTime(){
	    $(".time").text(fillZeroes(time.getMinutes()) + ":" + fillZeroes(time.getSeconds()));
	}
	displayTime();
    interv = setInterval(function(){
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
});

function fillZeroes(t){
    t = t+"";
    if(t.length==1)
        return "0" + t;
    else
        return t;
}