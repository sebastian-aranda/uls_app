document.addEventListener('deviceready', function() {
	var nodeServer = 'http://localhost:3030';
	//var nodeServer = 'http://192.168.0.102:3030';
	var railsServer = 'http://192.168.0.102:3000';
	//var railsServer = 'http://uls2016.herokuapp.com';
	
	var socketServer = 'ws://'+nodeServer.substring(7)+'/echo/websocket';

	//var placas = [54355, 9171109, 762964, 0, 0, 0, 0, 0, 0, 0];
	var placas = [54355, 0, 0, 0, 0, 9171109, 762964, 0, 0];
	
	//var duenios = ['Edo','Enzo','3','4','5', 'Seba','Marco','8','9','10']
	//var dispositivos = ['93cc5f1b1a3a8ca0', '55c9689c7200138e', '3', '4', '5', '59971d75d4fd1252', 'a8feb38a3117c721', '8', '9', '10'];
	var dispositivos = ['ffff1f36d06358a3', '55c9689c7200138e', '3', '4', '5', '59971d75d4fd1252', 'a8feb38a3117c721', '8', '9', '10'];

	var matchTimerValue = 10*60*1000; //Number of milliseconds
	var bombTimerValue = 1*60*1000;

	var match_id, team_id;
	var bomb_state = 0;
	getMatchId();
	
	var estadoPartida = 1;
	var time, originalTime;
	
	var buttonActive = {idButton: '', state: 0};
	var hpAlertInterval;
	
	//Configurando Partida
	if (dispositivos.indexOf(getDeviceId()) < 5){
		selectTeam(1);
	}
	else{
		selectTeam(2);
	}
	$.get(nodeServer+'/device_on/'+(dispositivos.indexOf(getDeviceId())+1)+'/d', function(res){});
	
	/*handleGetItem('medikit');
	handleGetItem('bomb');*/

	/* BOTONES */
	$('#buttonBombActive').on('click', function(){
		if (estadoPartida == 1 && bomb_state == 0){
			scan();
		}
	});

	$('#buttonBombInactive').on('click', function(){
		if (estadoPartida == 1 && bomb_state == 1){
			scan();
		}
	});

	$('#buttonGetItem').on('click', function(){
		if (estadoPartida == 1){
			scan();
		}
	});

	$('#buttonMedikitInactive').on('click', function(){
		if (estadoPartida == 1){
			buttonActive.idButton = 'buttonMedikit';
			buttonActive.state = 1;
			
			$(this).hide();
			$('#buttonMedikitActive').show();
		}
	});

	$('#buttonMedikitActive').on('click', function(){
		if (estadoPartida == 1){
			buttonActive.idButton = '';
			buttonActive.state = 0;
			
			$(this).hide();
			$('#buttonMedikitInactive').show();

		}
	});

	$('#buttonVestInactive').on('click', function(){
		if (estadoPartida == 1){
			buttonActive.idButton = 'buttonVest';
			buttonActive.state = 1;
			
			$(this).hide();
			$('#buttonVestActive').show();

		}
	});

	$('#buttonVestActive').on('click', function(){
		if (estadoPartida == 1){
			buttonActive.idButton = '';
			buttonActive.state = 0;
			
			$(this).hide();
			$('#buttonVestInactive').show();

		}
	});

	$('.playerStatus, .partner').on('click', function(){
		if (estadoPartida == 1){
			var player_id = $(this).attr('player-id');
			var player_hp = $(this).find('.health-bar').attr('aria-valuenow');
			var player_shield = $(this).find('.shield-bar').attr('aria-valuenow');
			
			//Activate Medikit
			if (buttonActive.state == 1 && buttonActive.idButton == 'buttonMedikit'){
				if (player_hp == 0 || player_hp == 100)
					return;
				$.post(railsServer+'/matches/heal_user?match_id='+match_id+'&player_id='+player_id, function(res){});
				$.get(nodeServer+'/heal_user/'+match_id+'/'+player_id, function(res){});

				$('#buttonMedikitInactive').hide();
				$('#buttonMedikitActive').hide();
				$('#buttonVestInactive').hide();
				$('#buttonVestActive').hide();
				$('#buttonGetItem').show();

				buttonActive.idButton = '';
				buttonActive.state =  0;
			}

			//Activate Vest
			else if (buttonActive.state == 1 && buttonActive.idButton == 'buttonVest'){
				if (player_hp == 0 || player_shield == 100)
					return;
				$.post(railsServer+'/matches/add_vest?match_id='+match_id+'&player_id='+player_id, function(res){});
				$.get(nodeServer+'/add_vest/'+match_id+'/'+player_id, function(res){});

				$('#buttonMedikitInactive').hide();
				$('#buttonMedikitActive').hide();
				$('#buttonVestInactive').hide();
				$('#buttonVestActive').hide();
				$('#buttonGetItem').show();

				buttonActive.idButton = '';
				buttonActive.state =  0;
			}
		}
	});

	//Node Server Connection
	var ws = new WebSocket(socketServer);

    ws.onopen = function () {
        //this.send('hello');
    };

    ws.onmessage = function (event) {
        var data = JSON.parse(event.data);
        switch(data.event){
        	case 'start_match':
        		if (team_id == 1)
        			configureMatch([1,2,3,4,5]);
        		else
        			configureMatch([6,7,8,9,10]);
        		startMatch(data.match_id);
        		break;
        	case 'receive_shot':
        		handleReceiveShot(data.match_id, data.shooted_id);
        		break;
        	case 'heal_user':
        		handleHealUser(data.player_id);
        		break;
        	case 'add_vest':
        		handleAddVest(data.player_id);
        		break;
        	case 'planting_bomb':
        		handlePlantingBomb(data.player_id);
        		break;
        	case 'defusing_bomb':
        		handleDefusingBomb(data.player_id);
        		break;	
        	case 'player_die':
        		handlePlayerDie(data.player_id);
        		break;
        }
    };

    ws.onerror = function () {
        console.log('error occurred!');
    };

    ws.onclose = function (event) {
        //console.log('close code=' + event.code);
    };

    function startMatch(resId){
    	if (estadoPartida == 1 && resId == match_id){
    		$("#wait_page").hide();
			$("#matchstatus_page").fadeIn(1000);
			startTimer();
    	}
    	else if (estadoPartida == 0 && resId == match_id)
    		setTimeout(startMatch(resId), 200);
    }

	function handleReceiveShot(match_id, shooted_id){
		var player_id = $('.playerStatus').attr('player-id');
		
		var shooted_hp = $('[player-id="'+shooted_id+'"] .health-bar').attr('aria-valuenow');
		if (shooted_hp == 0)
			return;
		
		if (player_id == shooted_id) 
			navigator.vibrate(500);
		
		var damage = 25;

		var shieldBar = $('div[player-id="'+shooted_id+'"] .shield-bar');
      	var totalShield = parseInt(shieldBar.parent().css('width').substring(0,shieldBar.parent().css('width').lastIndexOf("px")));
      	var shieldPoints = parseInt(shieldBar.css('width').substring(0,shieldBar.css('width').lastIndexOf("px")));
      	
      	var finalShield = parseInt(shieldPoints-(totalShield*damage/100));
      	if (finalShield < 0){
      		finalShield = 0;
      		diff = shieldBar.attr('aria-valuenow')-damage;
      	}
      	else
      		diff = 0;
      	
      	shieldBar.attr('aria-valuenow', parseInt(finalShield/totalShield*100));
      	shieldBar.css('width', finalShield);
      	shieldBar.change();

      	if (finalShield == 0){
      		damage = Math.abs(diff);

      		var healthBar = $('div[player-id="'+shooted_id+'"] .health-bar');
	      	var totalHealth = parseInt(healthBar.parent().css('width').substring(0,healthBar.parent().css('width').lastIndexOf("px")));
	      	var healthPoints = parseInt(healthBar.css('width').substring(0,healthBar.css('width').lastIndexOf("px")));
	      	
	      	var finalHealth = parseInt(healthPoints-(totalHealth*damage/100));
	      	if (finalHealth < 0) finalHealth = 0;

	      	healthBar.attr('aria-valuenow', finalHealth/totalHealth*100);
	      	healthBar.css('width', finalHealth);
	      	healthBar.change();
      	}
	}

    function handleHealUser(player_id){
      	var healthBar = $('div[player-id="'+player_id+'"] .health-bar');
      	var totalHealth = parseInt(healthBar.parent().css('width').substring(0,healthBar.parent().css('width').lastIndexOf("px")));
      	var healthPoints = parseInt(healthBar.css('width').substring(0,healthBar.css('width').lastIndexOf("px")));
      	var finalHealth = parseInt(healthPoints+(totalHealth*0.5));
      	if (finalHealth >= totalHealth) finalHealth = totalHealth;
      	healthBar.attr('aria-valuenow', finalHealth/totalHealth*100);
      	healthBar.css('width', finalHealth);
      	healthBar.change();
    }

    function handleAddVest(player_id){
      	var shieldBar = $('div[player-id="'+player_id+'"] .shield-bar');
      	var totalShield = parseInt(shieldBar.parent().css('width').substring(0,shieldBar.parent().css('width').lastIndexOf("px")));
      	var shieldPoints = parseInt(shieldBar.css('width').substring(0,shieldBar.css('width').lastIndexOf("px")));
      	//var finalShield = shieldPoints+(totalShield*0.2);
      	var finalShield = parseInt(totalShield);

      	shieldBar.attr('aria-valuenow', finalShield/totalShield*100);
      	shieldBar.css('width', finalShield);
      	shieldBar.change();
    }

    function handlePlantingBomb(msg){
		navigator.vibrate(500);
		bombTime = new Date(bombTimerValue);
		if (time > bombTime){
			time = new Date(bombTimerValue);
			$('.messages span').html('La bomba ha sido plantada!');
			$('.messages span').fadeIn(1500).fadeOut(1500);
			bomb_state = 1;
		}
    }

    function handleDefusingBomb(msg){
    	estadoPartida = 0;
    	//TODO: bomb_state = 1;

		$.get(railsServer+'/matches/resume_match?match_id='+match_id, function(res){
			configureBattleResume(res);
		});

		navigator.vibrate(500);
	    $('.messages span').html('Partida Terminada');
    	$('.messages span').fadeIn(1500);
    	
    	setTimeout(function(){
    		$("#matchstatus_page").hide();
    		$("#battleresume_page").fadeIn(1000);
    	}, 5000);
    }

    function handlePlayerDie(id){
    	var currentPlayer_id = $('.playerStatus').attr('player-id');
    	if (id != currentPlayer_id){
    		$('.messages span').html('Jugador '+id+' ha muerto');
			$('.messages span').fadeIn(1500).fadeOut(1500);
    	}
    }

    //Accion cuando muere un jugador
    $('.health-bar').on('change', function(){
    	var currentPlayer_id = $('.playerStatus').attr('player-id');
    	var container = $(this).parents('div[player-id]');
		var player_id = container.attr('player-id');
		var eliminated;
		var hp = $(this).attr('aria-valuenow');


    	if (hp <= 0 && player_id != currentPlayer_id){
    		eliminated = container.find('.eliminated').show();
    		navigator.vibrate(500);			
			playerDieAlert(player_id);
    	}
    	else if (hp <= 0 && player_id == currentPlayer_id){
    		eliminated = container.find('.eliminated').show();
			navigator.vibrate(500);	
			$('.messages span').html('Has perdido');
			$('.messages span').fadeIn(1500).fadeOut(1500);

			estadoPartida = 0;
			clearInterval(hpAlertInterval);

			playerDieAlert(player_id);
    	}
    	else if (hp > 0 && player_id == currentPlayer_id){
    		hpAlert(hp, $(this), true);
    	}
    	else if (hp > 0 && player_id != currentPlayer_id){
    		hpAlert(hp, $(this), false);
    	}
    });

    function playerDieAlert(id){
    	$.get(nodeServer+'/player_die/'+id, function(res){});
    }

    /* TIMER */
    function startTimer(){
    	time = new Date(matchTimerValue);
		displayTime();
	    var interv = setInterval(function(){
	        time = new Date(time - 1000);
	        if (originalTime != null) originalTime = new Date(originalTime-1000);
	        if(time<=0){
	        	clearInterval(interv);
	            matchEnd();
	        }
	        displayTime();
	    }, 1000);
    }
    

    function matchEnd(){
		estadoPartida = 0;
		clearInterval(hpAlertInterval);

		$("#battleresume_page .team").hide();
		$("#battleresume_page .loader").show();

		$.get(railsServer+'/matches/resume_match?match_id='+match_id, function(res){
			configureBattleResume(res);
			$("#battleresume_page .loader").hide();
		});

		navigator.vibrate(500);
	    $('.messages span').html('Partida Terminada');
    	$('.messages span').fadeIn(1500);

    	setTimeout(function(){
    		$("#matchstatus_page").hide();
    		$("#battleresume_page").fadeIn(1500);
    		
    	}, 2500);

	}
	
	function displayTime(){
	    $(".timer").text(fillZeroes(time.getMinutes()) + ":" + fillZeroes(time.getSeconds()));
	}

	function fillZeroes(t){
	    t = t+"";
	    if(t.length==1)
	        return "0" + t;
	    else
	        return t;
	}

    function handleBomb(){
    	var player_id = $('.playerStatus').attr('player-id');
    	
    	if (team_id == 1){
    		$.post(railsServer+'/matches/planting_bomb?match_id='+match_id+'&player_id='+player_id, function(res){});
			$.get(nodeServer+'/planting_bomb/'+match_id+'/'+player_id, function(res){});
    	}
    	else{
    		$.post(railsServer+'/matches/defusing_bomb?match_id='+match_id+'&player_id='+player_id, function(res){});
			$.get(nodeServer+'/defusing_bomb/'+match_id+'/'+player_id, function(res){});
    	}
    }

    function handleGetItem(res){
    	if (res == 'medikit'){
			$('#buttonGetItem').hide();
			$('#buttonMedikitInactive').show();
			$('#buttonMedikitActive').hide();
			$('#buttonVestInactive').hide();
			$('#buttonVestActive').hide();
    	}
    	else if (res == 'vest'){
    		$('#buttonGetItem').hide();
			$('#buttonMedikitInactive').hide();
			$('#buttonMedikitActive').hide();
			$('#buttonVestInactive').show();
			$('#buttonVestActive').hide();
    	}
    	else if (res == 'bomb'){
    		$('#buttonBombInactive').hide();
			$('#buttonBombActive').show();
    	}
    }

    //QR Scanning
    function scan(){
        cordova.plugins.barcodeScanner.scan(function (result) {
	        if(!result.cancelled){
	            if(result.format == "QR_CODE"){
	                if (result.text == 'bomb')
	                	handleBomb();
	                else if(result.text == 'medikit')
	                	handleGetItem('medikit');
	                else if (result.text == 'vest')
	                	handleGetItem('vest');
	            }
	        }
		}, function (error) {
            alert("Scanning failed: " + error);
        });
	}

	function configureBattleResume(res){
		var data = res;
		
		var winnerTeam = data[0].winner;
		if (winnerTeam == 0)
			$('.battleResume-team').append('<span>Empate</span>');
		else if (winnerTeam == 1){
			$('.team.alpha .battleResume-team').append('<span>Ganador</span>');
			$(".team.alpha").show();
		}
		else{
			$('.team.bravo .battleResume-team').append('<span>Ganador</span>');
			$(".team.bravo").show();
		}

		$(".team").each(function(){
			if ($(this).hasClass("alpha"))
				var team = data[1].alpha_team;
			else if ($(this).hasClass("bravo"))
				var team = data[1].bravo_team;

			$(this).find('[player-id]').each(function(index){
				var playerId = $(this).attr('[player-id]');
				var player = team[index];
				
				//battleResume-player
				$(this).children().eq(0).html('<img src="'+playerImage(player.image.image.url)+'" class="playerPhotoResume"/><span>'+player.nickname+'</span>');

				//battleResume-kills
				$(this).children().eq(1).html(player.kills);

				//battleResume-accuracy
				var accuracy = 0;
				if (player.sent_shoots > 0)
					accuracy =  player.successful_shoots/player.sent_shoots*100;
				$(this).children().eq(2).html(accuracy.toString()+"%");

				//battleResume-items
				$(this).children().eq(3).html(player.health+player.vest);

				//battleResume-ranking
				$(this).children().eq(4).html(player.ranking);
			});
		});
	}

	function configureMatch(team){
    	var dispositivo = getDeviceId();
    	var currentPlayer_equipmentId = dispositivos.indexOf(dispositivo)+1;
    	team.splice(team.indexOf(currentPlayer_equipmentId),1);
    	
    	var counter = 0;
    	$('div[player-id]').each(function(index){
    		counter++;
    		if (counter == 1){
    			$(this).attr('player-id', currentPlayer_equipmentId);

    			$.get(railsServer+'/matches/get_player?match_id='+match_id+'&player_id='+currentPlayer_equipmentId, function(res){
    				//var image = '<img src="'+playerImage(res.player.image.url)+'" class="playerPhoto"/><span>'+playerImage(res.player.image.url)+'</span>';
    				var image = '<img src="'+playerImage(res.player.image.url)+'" class="playerPhoto"/>';
    				alert(image);
					$(".playerImg").children().eq(1).remove();
    				$(".playerImg").prepend(image);

    				$(".team-flag-game span").html(res.team.name);
    			});
    		}
    		else{
    			var playerId = team.shift();
    			$(this).attr('player-id', playerId);

    			var selector = $(this);
    			$.get(railsServer+'/matches/get_player?match_id='+match_id+'&player_id='+playerId, function(res){
    				var image = '<img src="'+playerImage(res.player.image.url)+'" class="playerPhoto"/>';
    				selector.children().eq(1).remove();
    				selector.prepend(image);
    			});
    			
    		}
    	});

    	estadoPartida = 1;
    }

	function selectTeam(teamId){
		if (teamId == 1){
			$("html").css("background", "url(img/background_blue.png) no-repeat center center fixed");
			$("html").css("background-size", "cover");
			$(".team-flag.bravo").hide();
			$(".team-flag.alpha").show();

			$("#buttonBombInactive").hide();
			$("#buttonBombActive").show();
		}
		else{
			$("html").css("background", "url(img/background_red.png) no-repeat center center fixed");
			$("html").css("background-size", "cover");
			$(".team-flag.alpha").hide();
			$(".team-flag.bravo").show();

			$("#buttonBombActive").hide();
			$("#buttonBombInactive").show();
		}
		team_id = teamId;
	}

	//Get Device Unique ID
    function getDeviceId(){
    	return device.uuid;
    }

    //Get Last Match Id -> match a empezar = ultimo match + 1
	function getMatchId(){
		$.get(railsServer+"/matches/get_last_match", function(res){
			var id = res != null ? res.id : 0;			
			match_id = id+1;
			alert(match_id);
		});

		//match_id = 1;
		//alert(match_id);
	}

	function hpAlert(hpPercentage, bar, vibration){
		if (hpPercentage <= 50){

			if (hpPercentage >= 25){
				bar.addClass('medium');
				bar.removeClass('low');
			}
			else{
				bar.removeClass('medium');
				bar.addClass('low');	
			}

			if (vibration){
				var seconds = parseInt((hpPercentage*2.5)/50*1000);
				var timer_seconds = parseInt(hpPercentage/50*500+200);
				clearInterval(hpAlertInterval);
				hpAlertInterval = setInterval(function(){
					navigator.vibrate(timer_seconds);
				},seconds);
			}
		}
		else{
			clearInterval(hpAlertInterval);
			bar.removeClass('medium');
			bar.removeClass('low');
		}
	}

	function playerImage(url){
		//alert(url);
		var array = url.split('/');
		var img = array.pop();
		if (img != "player.png")
			return railsServer+url;
		else
			return './img/player_placeholder.png';
	}

	//setInterval(deviceStates, 5000);
	//deviceStates();
	/*function deviceStates(){
		$('[id-equipamiento]').each(function(index){
			var children = $(this).children();

			$.get(nodeServer+'/device_state/'+(index+1), function(res){
				
				children.eq(1).html("Desconectado");
				children.eq(1).addClass("text-danger");
				children.eq(1).removeClass("text-success");
				children.eq(2).html("Desconectado");
				children.eq(2).addClass("text-danger");
				children.eq(2).removeClass("text-success");
				children.eq(3).html("Desconectado");
				children.eq(3).addClass("text-danger");
				children.eq(3).removeClass("text-success");

				if (res != ''){
					var equipments = res;

					if (equipments.indexOf('p') != -1){
						children.eq(1).html("Conectado");
						children.eq(1).toggleClass("text-danger");
						children.eq(1).toggleClass("text-success");
					}
					if (equipments.indexOf('c') != -1){
						children.eq(2).html("Conectado");
						children.eq(2).toggleClass("text-danger");
						children.eq(2).toggleClass("text-success");
					}
					if (equipments.indexOf('d') != -1){
						children.eq(3).html("Conectado");
						children.eq(3).toggleClass("text-danger");
						children.eq(3).toggleClass("text-success");	
					}
				}
			});
		});
	}*/

	$(".team").on("click", function(){
		$(".team").toggle();
	});

	/**** PARA index_device.html -> obtiene el device.uuid ****/
	$('#device_id').html(device.uuid);
});

