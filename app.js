var express = require('express');
var path = require('path');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3001;


			
var options = { 
	dotfiles: 'ignore', 
	etag: false,
	extensions: ['htm', 'html'],
	index: false
};

var directoryOptions = { 
	"root": path.join(__dirname, 'public')
};

app.use(express.static(path.join(__dirname, 'public') , options));
console.log('directoryOptions: ',directoryOptions)

app.get('/', function(req, res){
	res.sendFile("index.html", directoryOptions);
});

/***
Stores the score of the game by user
**/
app.get('/gameboard', function(req, res){
  res.sendFile("gameboard.html", directoryOptions);
});

/***
Stores the score of the game by user
**/
app.get('/dashboard', function(req, res){
  res.sendFile("dashboard.html", directoryOptions);
});

//Stores all the players details
var players={}; 
var admins = {};
var gamepin = "1234";

//reduce logging
io.set('log level', 1); 
io.on('connection', function (socket) {
	
	/***
	update score.
	**/
	socket.on('update-score', function (scores) {
		console.log("scores: ", scores);
		//Iterate players
		player = players[socket.id];
		player['score'] = scores;
		players[socket.id] = player;
		
		console.log(players);
        socket.broadcast.to('admin').emit('player-joined', players);
	});
	
	/***
		on new game creation.
	**/
	socket.on('new-game', function (game_info) {
		gamepin = game_info["gamepin"];
		console.log("game pin changed: ",  gamepin);
		
		admin = {'id': socket.id, 'adminname' : 'admin', 'gamepin': gamepin};
		admins[socket.id] = admin;
		
		console.log("New Admin connected: ", admin);	
		socket.join('admin');
	});
	
	/***
		start game.
	**/
	socket.on('start-game', function (message) {
		console.log("start called..")
		socket.broadcast.to('player').emit('start-game', {'msg': 'start'});
	});
	
	
	/***
		stop game.
	**/
	socket.on('stop-game', function (message) {
		console.log("stop called..")
		socket.broadcast.to('player').emit('stop-game', {'msg': 'stop'});
	});
	
	/****
		io.sockets.emit will send to all the clients
		socket.broadcast.emit will send the message to all the other clients except the newly created connection
	**/
	socket.on('update-server', function(data){
		var message = data['message'];
		var payload = data['payload'];
		
		if (message == "update-score"){
			console.log("payload score: ", payload);
			
			player = players[socket.id];
			player['on'] = payload;
			players[socket.id] = player;
			
			console.log('udpated player score: ', players);
			socket.broadcast.to('admin').emit('player-joined', players);		
		}
		else if (message == "join-game"){
			
			playername = payload['playername']
			playerpin = payload['playerpin']
		
			//check if the playerpin is gamepin 
			if(playerpin == gamepin){
				var id = socket.id.toString();
				
				player = {'id':  socket.id, 'playername' : playername, 'playerpin': playerpin, 'on': {games: 0,wins: 0,loses: 0,ties: 0,scores: 0}};
				players[socket.id] = player;
				console.log("New player connected: ", player);
				socket.join('player');
				
				//Updates current player with waiting screen.
				socket.emit('player-waiting', players[socket.id]);
	
				//io.sockets.in(Object.keys(admins)).emit('player-joined', players);
				socket.broadcast.to('admin').emit('player-joined', players);
			}
			else{
				console.log("Inside else: ", payload);
				socket.emit('player-join', {'id':  socket.id, 'playername' : playername, 'playerpin': playerpin});
			}
		}
		
	});



	/****
		On disconnect.
	**/
	socket.on('disconnect', function(){
		//socket.emit("pvt",socket.username,data+socket.username); // This works
        //io.sockets.socket(socket.username).emit("pvt",socket.username,data+socket.username); // THIS DOESNOT
		
        // remove the username from global usernames list
        delete players[socket.id];
		
        // echo globally that this client has left
        console.log(socket.id + ' has disconnected');		
		
		//io.sockets.in(Object.keys(admins)).emit('player-joined', players);
		socket.broadcast.to('admin').emit('player-joined', players);
			
    });
});

http.listen(port, function(){
  console.log('TicTocToe running on *: ' + port);
});
