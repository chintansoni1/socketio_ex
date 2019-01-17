(function() {
    var socket = io.connect('http://10.182.241.109:3001');
	//var socket = io.connect('http://192.168.1.4:3001');
	//var socket = io.connect('http://localhost:3001');	
	
	var $scoreboard = $.query('.scoreboard');
	
	var $new_game = $.query('#new-game');
	var $game_pin = $.query('#game-pin');
	
	var $start_game = $.query('#start-game');
	var $stop_game = $.query('#stop-game');
	
	/***
		get game pin
	**/
	function getPin() {
		return Math.floor((Math.random()*10)).toString();
	}
	
	$new_game.on("click", function (e) {
		var pin="";
		
		for(var pin_index=0; pin_index<=3; pin_index++){
			pin += getPin();
		}
		$game_pin.val(pin);
		
		socket.emit('new-game',{'gamepin' :  pin});
    });	
	
	$start_game.on("click", function (e) {
		socket.emit('start-game',{'msg' :  "start"});
    });	
	
	$stop_game.on("click", function (e) {
		socket.emit('stop-game',{'msg' :  "stop"});
    });	
	
	$(document).ready(function() {
		console.log("Ready dashboard ready..");
	});
	
	/***
		player joined screen.
	**/
	socket.on('player-joined', function(message){
		players = Object.values(message);
		
		$("#tbody").html("");
		
		var on = {
			games: 0,
			wins: 0,
			loses: 0,
			ties: 0,
			scores: 0
		};
		
		for(var player_index =0; player_index<= players.length-1; player_index++){
			var player = players[player_index];
			
			var player_record = $("<tr></tr>");
			
			//'score': {games: 0,wins: 0,loses: 0,ties: 0,scores: 0}
			//name
			player_record.append($("<td></td>").text(player.playername));
			
			//games
			player_record.append($("<td></td>").text(player.on.games));
			
			//wins
			player_record.append($("<td></td>").text(player.on.wins));
			
			//loses
			player_record.append($("<td></td>").text(player.on.loses));
				
			//ties
			player_record.append($("<td></td>").text(player.on.ties));
			
			//scores
			player_record.append($("<td></td>").text(player.on.scores));
			
			$("#tbody").append(player_record);
		}
    });

})(jQuery);