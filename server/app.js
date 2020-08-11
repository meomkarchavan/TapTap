const Express = require('express');
const app = Express();
const Http = require('http').Server(app);
const Socketio = require('socket.io')(Http);
// var cookie = require('cookie');

function createUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
var path = require('path');

var serveStatic = require('serve-static');
app.use(serveStatic(path.join(__dirname, '../client/dist')));

// this * route is to serve project on different page routes except root `/`
app.get(/.*/, function (req, res) {
	res.sendFile(path.join(__dirname, './dist/index.html'));
});
const clients = {};
const gameServers = {};

Socketio.on('connection', (socket) => {
	// get client id
	clients[socket.id] = {
		connection: socket,
	};
	console.log(socket.id, 'Connected');

	const con = clients[socket.id].connection;
	//send client his id
	con.emit('clientId', socket.id);
	// if user want to create a new game
	con.on('leave', (data) => {
		try {
			gameServers[data.gameId].clients = gameServers[
				data.gameId
			].clients.filter((client) => client.clientId != data.clientId);
		} catch (error) {
			console.log(error);
		}
	});
	con.on('end', (gameId) => {
		console.log('gameOver');
		// gameServers[gameId].gameOver = true;
	});
	con.on('create', (data) => {
		// console.log(data.time);
		const gameId = createUUID();
		gameServers[gameId] = {
			gameId: gameId,
			balls: data.balls,
			ownerName: data.playerName,
			ownerid: data.clientId,
			clients: [],
			gameOver: false,
			counter: data.time,
			started: false,
		};
		// console.log(gameServers);
		con.emit('create', gameServers[gameId]);
	});
	con.on('join', (data) => {
		// console.log(data.gameId);
		// console.log(gameServers);
		if (gameServers[data.gameId]) {
			const clientId = data.clientId;
			const game = gameServers[data.gameId];
			if (game.clients.length >= 3) {
				//sorry max players reach
				const error = {
					message: 'Max 3 Players Allowed',
				};
				con.emit('_error', error);
				return;
			}
			// check if client already in server
			p = false;
			game.clients.forEach((c) => {
				if (c.clientId == clientId) {
					p = true;
				}
			});
			if (p) {
				const error = {
					message: 'Already Connected',
				};
				con.emit('_error', error);
			} else {
				const color = { '0': 'red', '1': 'green', '2': 'blue' }[
					game.clients.length
				];

				if (!data.playerName) {
					var playerName = 'Player ' + (game.clients.length + 1);
				} else {
					var playerName = data.playerName;
				}
				game.clients.push({
					playerName: playerName,
					clientId: clientId,
					score: 0,
					color: color,
				});
				game.clients.forEach((client) => {
					clients[client.clientId].connection.emit('join', game);
				});
			}
		} else {
			const error = {
				message: 'Room Not Found',
			};
			con.emit('_error', error);
		}
	});

	con.on('play', (data) => {
		// const clientId = data.clientId;
		const gameId = data.gameId;
		const ballId = data.ballId;
		var state = gameServers[gameId].state;
		const color = data.color;
		if (!state) {
			state = {};
		}
		state[ballId] = color;
		gameServers[gameId].state = state;
	});
	con.on('start', (game) => {
		gameServers[game.gameId].started = true;
		game.clients.forEach((client) => {
			if (client.clientId != game.owner) {
				clients[client.clientId].connection.emit('start', game);
			}
		});
		updateGameState();
	});

	function updateGameState() {
		for (const g of Object.keys(gameServers)) {
			const game = gameServers[g];
			if (game.gameOver == false && game.started == true) {
				game.clients.forEach((client) => {
					if (game.state) {
						score = {};
						score = findScore(Object.values(game.state));
						for (const color of Object.keys(score)) {
							if (client.color == color) {
								client.score = score[color];
							}
						}
						clients[client.clientId].connection.emit('gameState', game);
					}
				});
			}
		}
		setTimeout(updateGameState, 200);
	}
	function findScore(stateArray) {
		result = {
			red: 0,
			green: 0,
			blue: 0,
		};

		for (let i = 0; i < stateArray.length; ++i) {
			// loop over array
			if (!result[stateArray[i]]) {
				// if no key for that number yet
				result[stateArray[i]] = 0; // then make one
			}
			++result[stateArray[i]]; // increment the property for that number
		}
		return result;
	}
	//if client disconnects
	con.on('disconnect', function () {
		console.log(socket.id + ' Disconnected');
	});
});

const port = process.env.PORT || 3000;

Http.listen(port, '0.0.0.0', function () {
	console.log('listing at 3000');
});
