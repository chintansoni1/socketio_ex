(function() {
    var socket = io.connect('http://10.182.241.109:3001');
	//var socket = io.connect('http://192.168.1.4:3001');
	//var socket = io.connect('http://localhost:3001');
	
	var $content = $.query('.login');	
	var $player_join = $.query('#player-join');
	var $text_pin = $.query('.upin');
	
	var $pin_1 = $.query('#pin_1');
	var $pin_2 = $.query('#pin_2');
	var $pin_3 = $.query('#pin_3');
	var $pin_4 = $.query('#pin_4');
	
	var pin = "";

	$player_join.on("click", function (e) {
		e.preventDefault();
		var playername = $('.uname').val();
		var payload = {'playername' : playername, "playerpin" : pin};
		socket.emit('update-server',{'message': 'join-game', 'payload' : payload});
    });	
	
	/****
		on the document keyup.
	**/
	$text_pin.on('keyup', function (e) {
		if (e.keyCode != 8 && e.keyCode != 46 && e.keyCode != 9) {
			e.preventDefault();
			
			console.log("pin checker", e.target.id);
			var $current_pin = $.query('#'+e.target.id);
			pin += $current_pin.val();
			var current_pin_id = e.target.id.toString();
			
			
			var current_pin_array = current_pin_id.split('_');
			var current_pin_int = parseInt(current_pin_array[current_pin_array.length -1]);
			var next_pin = (current_pin_int+1).toString();
			console.log("next pin : ", next_pin);
			var $next_pin = $.query('#pin_'+next_pin);
			$next_pin.focus();
		}
	});

	/****
		on the document keydown.
	**/
	$text_pin.on('keydown', function (e) {
		if (e.keyCode == 8) {
			console.log('BACKSPACE handler');
			e.preventDefault();
			
			console.log("pin checker", e.target.id);
			var $current_pin = $.query('#'+e.target.id);
			var current_pin_id = e.target.id.toString();
			var current_pin_array = current_pin_id.split('_');
			var current_pin_int = parseInt(current_pin_array[current_pin_array.length -1]);
			
			var previous_pin = (current_pin_int-1).toString();
			console.log("previous pin : ", previous_pin);
			var $previous_pin = $.query('#pin_'+previous_pin);
			$current_pin.val("");
			$previous_pin.focus();
		
		}
		if (e.keyCode == 46) {
			console.log('DELETE was pressed');
			e.preventDefault();
		}
	});
	
	/***
		load waiting screen.
	**/
	socket.on('player-waiting', function(player){
		$content.html("");
		var waiting_content = $("<div></div>");		
		var h1 = $("<h1>Waiting for others!!.</h1>");
		var img = $("<img>")
				.attr("class", "waiting")
				.attr("src","/assets/img/wait3.gif")
				.attr("alt","Smiley face")
		waiting_content.append(h1)
		waiting_content.append(img)
		$content.html(waiting_content)
    });
	
	
	/***
		join game
	**/
	socket.on('player-join', function(player){
		pin ="";
		
		//clears the wrong password and user and allow to join again.
		$('.uname').val("");
		
		$pin_1.val("");
		$pin_2.val("");
		$pin_3.val("");
		$pin_4.val("");
		
		$('.uname').focus();
    });
	
			
	/***
		shows game grid
	**/
	socket.on('start-game', function(message){		
		console.log("started: ", message);
		$('#ttgameboard').css("display", "block");
		$('#ttlogin').css("display", "none");
    });

	/***
		shows game grid
	**/
	socket.on('stop-game', function(message){		
		console.log("stopped: ", message);
		
		$('#ttgameboard').css("display", "none");
		$('#ttlogin').css("display", "block");
    });
	
	
	var ui = {
        board: document.querySelector('.board'),
        squares: document.querySelectorAll('.square'),
        restart: document.querySelector('.restart'),
        mute: document.querySelector('.mute'),
        scores: {
            scores: document.querySelector('.scores'),
            swap: document.querySelector('.swap'),
            player1: document.querySelector('.player1 .score'),
            player2: document.querySelector('.player2 .score'),
            ties: document.querySelector('.ties .score'),
            turn1: document.querySelector('.player1'),
            turn2: document.querySelector('.player2'),
            turnTies: document.querySelector('.ties')
        }
    },
	
	scoresByState ={
		win: 200,
		lose: 100,
		tie: 50
	},
	
	scoreAnalysis = {
		games: 0,
		wins: 0,
		loses: 0,
		ties: 0,
		scores: 0
	},
	
    computerScores = {
        player1: 0,
        player2: 0,
        ties: 0
    },
    twoPlayerScores = {
        player1: 0,
        player2: 0,
        ties: 0
    },
    player1 = 'x',
    player2 = 'o',
    audio = {},
    context , totalSquares = 9,
    hasLocalStorage, muted, playing, turn = true,
    firstTurn = true,
    twoPlayer = false,
    delay = 300,
    playerChance = 0.75,
    board, win = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    function loadAudio(name) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/assets/audio/' + name + '.wav', true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
            context.decodeAudioData(xhr.response, function(buffer) {
                audio[name] = buffer;
            }, function() {});
        };
        xhr.send();
    }

    function playAudio(name) {
        if (muted || !audio[name]) {
            return;
        }
        var source = context.createBufferSource();
        source.buffer = audio[name];
        source.connect(context.destination);
        if (source.start) {
            source.start(0);
        } else {
            source.noteOn(0);
        }
    }

    function updateMuteIcon() {
        var muteSoundWaves = ui.mute.querySelectorAll('path');
        for (var i = muteSoundWaves.length; i--;) {
            muteSoundWaves[i].style.display = muted ? 'none' : '';
        }
    }

    function toggleMute() {
        muted = !muted;
        if (hasLocalStorage) {
            try {
                localStorage.setItem('muted', muted.toString());
            } catch (e) {}
        }
        updateMuteIcon();
        //ga('send', 'event', 'Mute', muted ? 'muted' : 'unmuted');
    }

    function toggleTwoPlayer() {
        twoPlayer = !twoPlayer;
        var t = ui.scores.scores.classList;
        if (twoPlayer) {
            t.remove('p1');
            t.add('p2');
            firstTurn = true;
        } else {
            t.remove('p2');
            t.add('p1');
            firstTurn = false;
        }
        //ga('send', 'event', 'Mode', twoPlayer ? 'players' : 'computer');
        ui.scores.player1.innerHTML = (twoPlayer ? twoPlayerScores.player1 : computerScores.player1);
        ui.scores.player2.innerHTML = (twoPlayer ? twoPlayerScores.player2 : computerScores.player2);
        ui.scores.ties.innerHTML = (twoPlayer ? twoPlayerScores.ties : computerScores.ties);
        playing = false;
        start();
    }

    function updateBoard(player, index) {
        ui.squares[index].querySelector('div').classList.add(player);
    }

    function updateTurn() {
        var t1 = ui.scores.turn1.classList,
            t2 = ui.scores.turn2.classList,
            ties = ui.scores.turnTies.classList;
        if (twoPlayer && ui.restart.style.display === 'none') {
            if (turn) {
                t2.remove('turn');
                t1.add('turn');
            } else {
                t1.remove('turn');
                t2.add('turn');
            }
            ties.add('turn');
        } else {
            t1.remove('turn');
            t2.remove('turn');
            ties.remove('turn');
        }
    }

    function selectSquare(index) {
        if (board[index] !== 0 || isGameOver() || (!twoPlayer && turn)) {
            return;
        }
        if (twoPlayer) {
            turn = !turn;
            board[index] = turn ? -1 : 1;
            updateBoard(turn ? player1 : player2, index);
            playAudio('note-' + (turn ? 'low' : 'high'));
            isGameOver();
        } else {
            board[index] = -1;
            updateBoard(player1, index);
            turn = true;
            playAudio('note-low');
            setTimeout(computerPlay, delay);
        }
        updateTurn();
    }

    function initSquare(index) {
        ui.squares[index].onmousedown = function(event) {
            event.preventDefault();
            selectSquare(index);
        };
        ui.squares[index].ontouchstart = function(event) {
            event.preventDefault();
            updateBoard(player1, index);
        };
        ui.squares[index].ontouchend = function(event) {
            event.preventDefault();
            if (audio['note-low']) {
                for (var i = totalSquares; i--;) {
                    var sq = ui.squares[i];
                    sq.ontouchstart = sq.onmousedown;
                    sq.ontouchend = undefined;
                }
            }
            selectSquare(index);
        };
    }

    function start() {
        if (playing) {
            return;
        }
        playing = true;
        ui.restart.style.display = 'none';
        board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (var i = totalSquares; i--;) {
            ui.squares[i].querySelector('div').className = '';
        }
        ui.scores.ties.classList.remove('appear');
        ui.scores.player1.classList.remove('appear');
        ui.scores.player2.classList.remove('appear');
        ui.board.classList.remove('blink');
        turn = firstTurn = !firstTurn;
        updateTurn();
        if (firstTurn && !twoPlayer) {
            setTimeout(computerPlay, delay);
        }
    }

    function init() {
        try {
            hasLocalStorage = 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            hasLocalStorage = false;
        }
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (window.AudioContext) {
            context = new AudioContext();
            loadAudio('note-high');
            loadAudio('note-low');
            loadAudio('game-over');
            loadAudio('game-over-tie');
            if (hasLocalStorage) {
                try {
                    muted = localStorage.getItem('muted') === 'true';
                } catch (e) {
                    muted = false;
                }
            }
            updateMuteIcon();
            ui.mute.ontouchstart = ui.mute.onclick = function(event) {
                event.preventDefault();
                toggleMute();
            };
        } else {
            ui.mute.style.display = 'none';
        }
        for (var i = totalSquares; i--;) {
            initSquare(i);
        }
        ui.restart.ontouchstart = ui.scores.scores.ontouchstart = function(event) {
            event.preventDefault();
        };
        ui.scores.scores.ontouchend = ui.scores.scores.onclick = function(event) {
            event.preventDefault();
            toggleTwoPlayer();
        };
        ui.restart.ontouchend = ui.restart.onclick = function(event) {
            event.preventDefault();
            start();
        };
    }

    function endGame(winner, sq) {
        ui.restart.style.display = 'block';
        setTimeout(function() {
            var action = 'Game',
                label = (twoPlayer ? 'players ' : 'computer ');
            setTimeout(function() {
                playing = false;
            }, delay);
            if (sq) {
                for (var i = 3; i--;) {
                    ui.squares[sq[i]].querySelector('div').classList.add('blink');
                }
            }
			
			scoreAnalysis.games +=1;
			
			console.log('winner: ', winner);
			if (winner == player1){
				console.log("Human owned!!!");
				scoreAnalysis.scores += scoresByState.win;
				scoreAnalysis.wins +=1;
			}
			else if(winner == player2){
				console.log("Computer owned!!!");
				scoreAnalysis.scores -= scoresByState.lose;
				scoreAnalysis.loses +=1;
			}
			else{
				console.log("Tie!!");
				scoreAnalysis.scores -= scoresByState.tie;
				scoreAnalysis.ties +=1;
			}
			console.log('socket: ', socket.id);
			socket.emit('update-server',{'message': 'update-score', 'payload' : scoreAnalysis});
			console.log("print score: ",scoreAnalysis)
			
            switch (winner) {
                case player1:
                    ui.scores.player1.innerHTML = (twoPlayer ? ++twoPlayerScores.player1 : ++computerScores.player1);
                    ui.scores.player1.classList.add('appear');
                    playAudio('game-over');
                    //ga('send', 'event', action, label + (twoPlayer ? player1 : 'lose'));
                    break;
                case player2:
                    ui.scores.player2.innerHTML = (twoPlayer ? ++twoPlayerScores.player2 : ++computerScores.player2);
                    ui.scores.player2.classList.add('appear');
                    playAudio('game-over');
                    //ga('send', 'event', action, label + (twoPlayer ? player2 : 'win'));
                    break;
                default:
                    ui.scores.ties.innerHTML = (twoPlayer ? ++twoPlayerScores.ties : ++computerScores.ties);
                    ui.scores.ties.classList.add('appear');
                    ui.board.classList.add('blink');
                    playAudio('game-over-tie');
                    //ga('send', 'event', action, label + 'tie');
                    break;
            }
        }, (turn && !twoPlayer) ? 100 : delay + 100);
    }

    function isGameOver() {
        for (var i = win.length; i--;) {
            var sq = win[i],
                line = board[sq[0]] + board[sq[1]] + board[sq[2]];
            if (line === 3 || line === -3) {
                endGame(line === 3 ? player2 : player1, sq);
                return true;
            }
        }
        var count = 0;
        for (i = totalSquares; i--;) {
            if (board[i] !== 0) {
                count++;
            }
        }
        if (count === 9) {
            endGame();
            return true;
        }
        return false;
    }

    function computerPlay() {
        if (isGameOver()) {
            return;
        }
        var i, j, k, max, chosen, firstSquare, count = 0;
        turn = false;
        updateTurn();
        playAudio('note-high');
        for (i = totalSquares; i--;) {
            if (board[i] !== 0) {
                count++;
                if (count === 1) {
                    firstSquare = i;
                }
            }
        }
        if (count < 2 && Math.random() > 0.2) {
            do {
                chosen = Math.floor(Math.random() * totalSquares);
            } while (chosen === firstSquare);
        } else {
            for (i = totalSquares; i--;) {
                for (j = totalSquares; j--;) {
                    if (board[j] !== 0) {
                        continue;
                    }
                    board[j] = 1;
                    if (isGameOver()) {
                        updateBoard(player2, j);
                        return;
                    }
                    board[j] = 0;
                }
                if (board[i] !== 0) {
                    continue;
                }
                board[i] = 1;
                var min = null,
                    temp = board.concat();
                for (j = totalSquares; j--;) {
                    if (temp[j] !== 0) {
                        continue;
                    }
                    temp[j] = -1;
                    for (k = win.length; k--;) {
                        if (temp[win[k][0]] + temp[win[k][1]] + temp[win[k][2]] === -3 && Math.random() > playerChance) {
                            board[i] = 0;
                            board[j] = 1;
                            updateBoard(player2, j);
                            isGameOver();
                            return;
                        }
                    }
                    var max2 = 0,
                        min2 = 0,
                        tempMax = temp.concat(),
                        tempMin = temp.concat();
                    for (k = totalSquares; k--;) {
                        if (tempMax[k] === 0) {
                            tempMax[k] = 1;
                        }
                        if (tempMin[k] === 0) {
                            tempMin[k] = -1;
                        }
                    }
                    for (k = win.length; k--;) {
                        if (tempMax[win[k][0]] + tempMax[win[k][1]] + tempMax[win[k][2]] === 3) {
                            max2++;
                        }
                        if (tempMin[win[k][0]] + tempMin[win[k][1]] + tempMin[win[k][2]] === -3) {
                            min2++;
                        }
                    }
                    var d = max2 - min2;
                    min = min == null ? d : (min > d ? d : min);
                    temp[j] = 0;
                }
                if (max == null || max < min) {
                    max = min;
                    chosen = i;
                }
                board[i] = 0;
            }
        }
        board[chosen] = 1;
        updateBoard(player2, chosen);
        isGameOver();
    }
    init();
    start();
	
	
})(jQuery);