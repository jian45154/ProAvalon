//sockets
var avalonRoom = require("../gameplay/avalonRoom");

var savedGameObj = require("../models/savedGame");
var modAction = require("../models/modAction");
var currentModActions = [];

var User  = require("../models/user");

const JSON = require('circular-json');


var modsArray = require("../modsadmins/mods");
var adminsArray = require("../modsadmins/admins");







const dateResetRequired = 1531125110385;

var currentPlayersUsernames = [];
var allSockets = [];

var rooms = [];

//retain only 5 mins.
var allChatHistory = [];
var allChat5Min = [];

var nextRoomId = 1;


savedGameObj.find({}).exec(function(err, foundSaveGameArray){
	if(err){console.log(err);}
	else{
		for(var key in foundSaveGameArray){
			if(foundSaveGameArray.hasOwnProperty(key)){
				// console.log(foundSaveGameArray);

				var foundSaveGame = foundSaveGameArray[key];

				if(foundSaveGame){
					// console.log("Parsed:");
					// console.log(JSON.parse(foundSaveGame.room));
			
					var storedData = JSON.parse(foundSaveGame.room);
			
					
			
					rooms[storedData["roomId"]] = new avalonRoom();
			
			
			
			
					for(var key in storedData){
						if(storedData.hasOwnProperty(key)){
							// console.log("typeof: " + typeof(key))
							rooms[storedData["roomId"]][key] = storedData[key];
							// console.log("copied over: " + key);
							// console.log(storedData[key]);
						}
					}
			
					rooms[storedData["roomId"]].restartSaved = true;
					rooms[storedData["roomId"]].frozen = true;
					rooms[storedData["roomId"]].playersInRoom = [];
		
					rooms[storedData["roomId"]].someCutoffPlayersJoined = "no";
					rooms[storedData["roomId"]].socketsOfSpectators = [];
			
			
					// console.log("New room");
					// console.log(rooms[storedData["roomId"]]);
			
					console.log("Game loaded");
					// console.log(storedData.gameStarted);
			
					// console.log("sockets");
					// console.log(rooms[storedData["roomId"]].sockets[1]);
			
			
			
					
					// console.log(rooms[storedData["roomId"]]["sockets"].find("request"));
			
					
					// foundSaveGame.remove();
				}
			}
		}
	}
});


//load up all the modActions that are not released yet
modAction.find({whenRelease: {$gt: new Date()}, type: "mute"}, function(err, allModActions){
	
	for(var i = 0; i < allModActions.length; i++){
		currentModActions.push(allModActions[i]);
	}
	console.log("mute");
	console.log(currentModActions);
});






var userCommands = {
	commandA: {
		command: "commandA",
		help: "/commandA: Just some text for commandA",
		run: function (data) {
			//do stuff
			return {message: "commandA has been run.", classStr: "server-text"};
		}
	},

	help: {
		command: "help",
		help: "/help: ...shows help",
		run: function (data) {
			//do stuff

			var dataToReturn = [];
			var i = 0;

			//starting break in the chat
			// data[i] = {message: "-------------------------", classStr: "server-text"};

			// var str = [];
			// str[i] = "-------------------------";

			i++;

			for (var key in userCommands) {
				if (userCommands.hasOwnProperty(key)) {
					if(!userCommands[key].modsOnly){
						// console.log(key + " -> " + p[key]);
						dataToReturn[i] = {message: userCommands[key].help, classStr: "server-text"};
						// str[i] = userCommands[key].help;
						i++;
						//create a break in the chat
						// data[i] = {message: "-------------------------", classStr: "server-text"};
						// i++;
					}
				}
			}
			// return "Commands are: commandA, help";
			// return str;
			return dataToReturn;
		}
	},

	buzz: {
		command: "buzz",
		help: "/buzz <playername>: Buzz a player. <playername> must all be in lower case. (until I upgrade this)",
		run: function (data, senderSocket) {
			var args = data.args;

			var buzzSocket = allSockets[args[1]];
			if (buzzSocket) {
				buzzSocket.emit("buzz", senderSocket.request.user.username);
			return {message: "You have buzzed player " + args[1] + ".", classStr: "server-text"};
			}
			else {
				// console.log(allSockets);
				return {message: "There is no such player.", classStr: "server-text"};
			}
		}
	},

	slap: {
		command: "slap",
		help: "/slap <playername>: Slap a player for fun. <playername> must all be in lower case. (until I upgrade this)",
		run: function (data, senderSocket) {
			var args = data.args;			

			var slapSocket = allSockets[args[1]];
			if (slapSocket) {
				slapSocket.emit("slap", senderSocket.request.user.username);
			return {message: "You have slapped player " + args[1] + "!", classStr: "server-text"};
			}
			else {
				// console.log(allSockets);
				return {message: "There is no such player.", classStr: "server-text"};
				
			}
		}
	},

	roomChat: {
		command: "roomChat",
		help: "/roomChat: Get a copy of the chat for the current game.",
		run: function (data, senderSocket) {
			var args = data.args;
			//code
			if(rooms[senderSocket.request.user.inRoomId]){
				return rooms[senderSocket.request.user.inRoomId].getChatHistory();

			}
			else{
				return {message: "The game hasn't started yet. There is no chat to display.", classStr: "server-text"}
			}
		}
	},

	allChat: {
		command: "allChat",
		help: "/allChat: Get a copy of the last 5 minutes of allChat.",
		run: function (data, senderSocket) {
			//code
			var args = data.args;
			return allChat5Min;
		}
	},

	roll: {
		command: "roll",
		help: "/roll <optional number>: Returns a random number between 1 and 10 or 1 and optional number.",
		run: function (data, senderSocket) {
			var args = data.args;
			
			//code
			if(args[1]){
				if(isNaN(args[1]) === false){
					return {message: (Math.floor(Math.random() * args[1]) + 1).toString(), classStr: "server-text"}
				}
				else{
					return {message: "That is not a valid number!", classStr: "server-text"}	
				}
			}
			
			else{
				return {message: (Math.floor(Math.random() * 10) + 1).toString(), classStr: "server-text"}
			}
			
		}
	}

};


var modCommands = {
	m: {
		command: "m",
		help: "/m: displays /mhelp",
		run: function (data, senderSocket) {

			return modCommands["mhelp"].run(data, senderSocket);
		}
	},
	mban: {
		command: "mban",
		help: "/mban: Open the ban interface",
		run: function (data, senderSocket) {

			// console.log(senderSocket.request.user.username);
			if(modsArray.indexOf(senderSocket.request.user.username.toLowerCase()) !== -1){
				senderSocket.emit("openModModal");
				return {message: "May your judgement bring peace to all!", classStr: "server-text"};
			}
			else{
				//add a report to this player.
				return {message: "You are not a mod. Why are you trying this...", classStr: "server-text"};
			}
		}
	},

	modtest: {
		command: "modtest",
		help: "/modtest: Testing that only mods can access this command",
		run: function (data) {
			var args = data.args;
			//do stuff
			return {message: "modtest has been run.", classStr: "server-text"};
		}
	},
	mhelp: {
		command: "mhelp",
		help: "/mhelp: show commands.",
		run: function (data, senderSocket) {
			var args = data.args;
			//do stuff
			var dataToReturn = [];
			var i = 0;
			i++;

			for (var key in modCommands) {
				if (modCommands.hasOwnProperty(key)) {
					if(!modCommands[key].modsOnly){
						// console.log(key + " -> " + p[key]);
						dataToReturn[i] = {message: modCommands[key].help, classStr: "server-text"};
						// str[i] = userCommands[key].help;
						i++;
						//create a break in the chat
						// data[i] = {message: "-------------------------", classStr: "server-text"};
						// i++;
					}
				}
			}
			return dataToReturn;
			
		}
	},
	munban: {
		command: "munban",
		help: "/munban <player name>: Removes ALL existing bans OR mutes on a player's name.",
		run: async function (data, senderSocket) {
			var args = data.args;

			if(!args[1]){
				return {message: "Specify a username.", classStr: "server-text"}
			}

			modAction.find({'bannedPlayer.username': args[1]}, function(err, foundModAction){
				console.log("foundmodaction");
				console.log(foundModAction);
				if(foundModAction.length !== 0){
					modAction.remove({'bannedPlayer.username': args[1]},function(err, foundModAction){
						if(err){
							console.log(err);
							senderSocket.emit("messageCommandReturnStr", {message: "Something went wrong.", classStr: "server-text"});
						}
						else{
							console.log("Successfully unbanned " + args[1] + ".");
							senderSocket.emit("messageCommandReturnStr", {message: "Successfully unbanned " + args[1] + ".", classStr: "server-text"});					
						}
					});
				}
				else{
					senderSocket.emit("messageCommandReturnStr", {message: args[1] + " does not have a ban.", classStr: "server-text"});
				}
			});
			
		}
	},

	mcurrentbans: {
		command: "mcurrentbans",
		help: "/mcurrentbans: Show a list of currently active bans.",
		run: function (data, senderSocket) {
			var args = data.args;
			//do stuff
			var dataToReturn = [];
			var i = 0;
			i++;

			modAction.find({}, function(err, foundModActions){
				foundModActions.forEach(function(modActionFound){
					var message = modActionFound.bannedPlayer.username + " was banned for " + modActionFound.reason + " by " + modActionFound.modWhoBanned.username + ": '" + modActionFound.descriptionByMod + "' until: " + modActionFound.whenRelease.toString();

					dataToReturn[dataToReturn.length] = {message: message, classStr: "server-text"};
				});

				if(dataToReturn.length === 0){
					senderSocket.emit("messageCommandReturnStr", {message: "No one is banned! Yay!", classStr: "server-text"});
				}
				else{
					senderSocket.emit("messageCommandReturnStr", dataToReturn);
				}

			});




			// for (var key in modCommands) {
			// 	if (modCommands.hasOwnProperty(key)) {
			// 		if(!modCommands[key].modsOnly){
			// 			// console.log(key + " -> " + p[key]);
			// 			dataToReturn[i] = {message: modCommands[key].help, classStr: "server-text"};
			// 			// str[i] = userCommands[key].help;
			// 			i++;
			// 			//create a break in the chat
			// 			// data[i] = {message: "-------------------------", classStr: "server-text"};
			// 			// i++;
			// 		}
			// 	}
			// }
			// return dataToReturn;
			
		}
	},




	
}

var adminCommands = {
	a: {
		command: "a",
		help: "/a: ...shows mods commands",
		run: function (data) {
			var args = data.args;
			//do stuff
			var dataToReturn = [];
			var i = 0;
			i++;

			for (var key in adminCommands) {
				if (adminCommands.hasOwnProperty(key)) {
					if(!adminCommands[key].modsOnly){
						// console.log(key + " -> " + p[key]);
						dataToReturn[i] = {message: adminCommands[key].help, classStr: "server-text"};
						// str[i] = userCommands[key].help;
						i++;
						//create a break in the chat
						// data[i] = {message: "-------------------------", classStr: "server-text"};
						// i++;
					}
				}
			}
			return dataToReturn;
		}
	},

	admintest: {
		command: "admintest",
		help: "/admintest: Testing that only the admin can access this command",
		run: function (data) {
			var args = data.args;
			//do stuff
			return {message: "admintest has been run.", classStr: "server-text"};
		}
	},

	aServerRestartWarning: {
		command: "aServerRestartWarning",
		help: "/aServerRestartWarning: Only for the admin to use :)",
		run: function (data, senderSocket) {
			var args = data.args;
			// console.log(allSockets);
			//code
			if(senderSocket.request.user.username === "ProNub"){

				for(var key in allSockets){
					if(allSockets.hasOwnProperty(key)){
						allSockets[key].emit("serverRestartWarning")
					}
				}

				var numOfGamesSaved = 0;
				var numOfGamesEncountered = 0;
				var promises = [];

				//save the games
				for(var i = 0; i < rooms.length; i++){
					if(rooms[i] && rooms[i].gameStarted === true){
						console.log("rooms");
						console.log(rooms[i]);
						
						savedGameObj.create({room: JSON.stringify(rooms[i])}, function(err, savedGame){
							if(err){
								console.log(err);
							}
							console.log(savedGame);
							numOfGamesSaved++;

							console.log("created");
							console.log(numOfGamesSaved >= numOfGamesEncountered);
							console.log(numOfGamesSaved);
							console.log(numOfGamesEncountered);

							if(numOfGamesSaved >= numOfGamesEncountered){
								var data = {message: "Successful. Saved " + numOfGamesSaved + " games.", classStr: "server-text"};
								senderSocket.emit("messageCommandReturnStr", data);
							}

						});
						numOfGamesEncountered++;
					}
				}

				console.log(numOfGamesEncountered);
				
				if(numOfGamesEncountered === 0){
					return {message: "Successful. But no games needed to be saved.", classStr: "server-text"};
				}
				else{
					return {message: "Successful. But still saving games.", classStr: "server-text"};
				}

			}
			else{
				return {message: "You are not the admin...", classStr: "server-text"};
			}
		}
	}
}



module.exports = function (io) {
	//SOCKETS for each connection
	io.sockets.on("connection", function (socket) {

		if (socket.request.isAuthenticated()) {
			console.log("User is authenticated");

		} else {
			console.log("User is not authenticated");
			socket.emit("alert", "You are not authenticated.");
			return;
		}

		//check if they have a ban or a mute

		for(var i = 0; i < currentModActions.length; i++){
			if(currentModActions[i].bannedPlayer.id && socket.request.user.id.toString() === currentModActions[i].bannedPlayer.id.toString()){
				if(currentModActions[i].type === "mute"){
					
					
					
				}

			}
		}






		//if user is already logged in, destroy their last session
		//compare the new username that is lowercased to the list of current usernames lowercased
		var loweredCurrentPlayersUsernames = [];
		for (var i = 0; i < currentPlayersUsernames.length; i++) {
			loweredCurrentPlayersUsernames[i] = currentPlayersUsernames[i].toLowerCase();
		}

		var i = loweredCurrentPlayersUsernames.indexOf(socket.request.user.username.toLowerCase());
		if (i !== -1) {
			//kick the old socket
			allSockets[socket.request.user.username.toLowerCase()].emit("alert", "You've been disconnected");
			allSockets[socket.request.user.username.toLowerCase()].disconnect();
			currentPlayersUsernames.splice(i, 1);
			console.log("User was logged in already, killed last session and socket.")
		}
		console.log(socket.request.user.username + " has connected under socket ID: " + socket.id);

		//automatically join the all chat
		socket.join("allChat");
		//push the new user into our list of players
		currentPlayersUsernames.push(socket.request.user.username);
		currentPlayersUsernames.sort();
		//push the new socket into our list of sockets
		allSockets[socket.request.user.username.toLowerCase()] = socket;

		//send a notif to the user saying logged in
		// socket.emit("success-alert", "Successfully logged in! Welcome, " + socket.request.user.username + "!");

		//socket sends to all players
		var data = {
			message: socket.request.user.username + " has joined the lobby.",
			classStr: "server-text"
		}
		sendToAllChat(io, data);


		//io sends to everyone in the site, including the current user of this socket
		var newCurrentPlayersUsernames = [];
		//get a new updated list of lowered usernames
		for (var i = 0; i < currentPlayersUsernames.length; i++) {
			loweredCurrentPlayersUsernames[i] = currentPlayersUsernames[i].toLowerCase();
		}

		if(allSockets.length !== currentPlayersUsernames.length){
			for(var key in allSockets){
				if(allSockets.hasOwnProperty(key)){

					//if the username doesn't exist in the curerntplayerusernames,
					//then make them refresh
					// console.log(loweredCurrentPlayersUsernames);
					if(loweredCurrentPlayersUsernames.indexOf(key) === -1){
						allSockets[key].emit("refresh");
						console.log("MADE THEM REFRESH!!! SUCCESS");
					}

				}
			}
		}

		for(var key in allSockets){
			if(allSockets.hasOwnProperty(key)){
				newCurrentPlayersUsernames.push(key);
			}
		}
		io.in("allChat").emit("update-current-players-list", currentPlayersUsernames);

		updateCurrentGamesList(io);

		//send the user its ID to store on their side.
		socket.emit("username", socket.request.user.username);
		//send the user the list of commands
		socket.emit("commands", userCommands);

		//if the mods name is inside the array
		if(modsArray.indexOf(socket.request.user.username.toLowerCase()) !== -1 ){
			//send the user the list of commands
			socket.emit("modCommands", modCommands);
		}

		//if the admin name is inside the array
		if(adminsArray.indexOf(socket.request.user.username.toLowerCase()) !== -1 ){
			//send the user the list of commands
			socket.emit("adminCommands", adminCommands);
		}



		socket.emit("checkSettingsResetDate", dateResetRequired);
		

		// router.post("/modAction", function(req, res){
		// 	console.log("modAction!");
		
		// 	console.log(req.body);
		
		// 	res.send("received");
		// });

		socket.on("modAction", async function(data){

			if(modsArray.indexOf(socket.request.user.username.toLowerCase()) !== -1){
				// var parsedData = JSON.parse(data);
				console.log(data);

				var newModAction = {};

				console.log("a");

				var leave = false;

				data.forEach(async function(item){
					console.log("b");
					if(item.name === "banPlayerUsername"){
						console.log("b(a)");
						await User.find({username: item.value}, function(err, foundUser){
							if(err){console.log(err);}
							else{
								foundUser = foundUser[0];
								console.log("b(b)");
								if(!foundUser){
									socket.emit("messageCommandReturnStr", {message: "User not found. Please check spelling and caps.", classStr: "server-text"});
									leave = true;
									return;
								}
								// console.log(foundUser);
								newModAction.bannedPlayer = {};
								newModAction.bannedPlayer.id = foundUser._id;
								newModAction.bannedPlayer.username = foundUser.username;
							}
						});
					}
					else if(item.name === "typeofmodaction"){
						newModAction.type = item.value;
					}
					else if(item.name === "reasonofmodaction"){
						newModAction.reason = item.value;
					}
					else if(item.name === "durationofmodaction"){
						var oneSec = 1000;
						var oneMin = oneSec*60;
						var oneHr = oneMin*60;
						var oneDay = oneHr*24;
						var oneMonth = oneDay*30;
						//30 min, 3hr, 1 day, 3 day, 7 day, 1 month
						var durations = [
							oneMin*30,
							oneHr*3,
							oneDay,
							oneDay*3,
							oneDay*7,
							oneMonth
						];
						newModAction.durationToBan = new Date(durations[item.value]);
					}
					else if(item.name === "descriptionByMod"){
						newModAction.descriptionByMod = item.value;
					}



				// [ { name: 'banPlayerUsername', value: '123' },
				//   { name: 'typeofmodaction', value: 'ban' },
				//   { name: 'reasonofmodaction', value: 'griefing' },
				//   { name: 'durationofmodaction', value: '4' },
				//   { name: 'descriptionByMod', value: 'asdfa' } ]


				});

				

				console.log("c");

				if(leave === true){
					return;
				}
				
				await User.findById(socket.request.user.id, function(err, foundUser){
					if(err){console.log(err);}
					else{
						newModAction.modWhoBanned = {};
						newModAction.modWhoBanned.id = foundUser._id;
						newModAction.modWhoBanned.username = foundUser.username;
						console.log("1");
					}
				});

				console.log("2");

				newModAction.whenMade = new Date();
				newModAction.whenRelease = newModAction.whenMade.getTime() + newModAction.durationToBan.getTime();

				console.log(newModAction);
				if(leave === false){
					console.log("****************");
					modAction.create(newModAction,function(err, newModActionCreated){
						console.log(newModActionCreated);
						//push new mod action into the array of currently active ones loaded.
						currentModActions.push(newModActionCreated);
						//if theyre online
						if(allSockets[newModActionCreated.bannedPlayer.username.toLowerCase()]){
							allSockets[newModActionCreated.bannedPlayer.username.toLowerCase()].disconnect(true);
						}

						socket.emit("messageCommandReturnStr", {message: newModActionCreated.bannedPlayer.username + " has received a " + newModActionCreated.type + " modAction. Thank you :).", classStr: "server-text"});
						
					});
				}
				else{
					
				}
				
			}

			else{
				//create a report. someone doing something bad.
			}
			

		});

		//=======================================
		//COMMANDS
		//=======================================

		socket.on("messageCommand", function (data) {
			console.log("data0: " + data.command);
			console.log("mod command exists: " + modCommands[data.command]);
			console.log("Index of mods" + modsArray.indexOf(socket.request.user.username.toLowerCase()));
			
			

			if (userCommands[data.command]) {
				var dataToSend = userCommands[data.command].run(data, socket);
				socket.emit("messageCommandReturnStr", dataToSend);
			}
			else if(modCommands[data.command] && modsArray.indexOf(socket.request.user.username.toLowerCase()) !== -1){
				var dataToSend = modCommands[data.command].run(data, socket);
				socket.emit("messageCommandReturnStr", dataToSend);
			}
			else if(adminCommands[data.command] && adminsArray.indexOf(socket.request.user.username.toLowerCase()) !== -1){
				var dataToSend = adminCommands[data.command].run(data, socket);
				socket.emit("messageCommandReturnStr", dataToSend);
			}
			else {
				var dataToSend = {
					message: "Invalid command.",
					classStr: "server-text"
				}

				socket.emit("messageCommandReturnStr", dataToSend);
			}
		});

		//when a user tries to send a message to all chat
		socket.on("allChatFromClient", function (data) {
			//socket.emit("danger-alert", "test alert asdf");
			//debugging
			console.log("allchat: " + data.message + " by: " + socket.request.user.username);
			//get the username and put it into the data object
			data.username = socket.request.user.username;
			//send out that data object to all other clients (except the one who sent the message)

			data.message = textLengthFilter(data.message);
			//no classStr since its a player message

			sendToAllChat(io, data);
		});

		//when a user tries to send a message to room
		socket.on("roomChatFromClient", function (data) {
			// socket.emit("danger-alert", "test alert asdf");
			//debugging
			console.log("roomchat: " + data.message + " by: " + socket.request.user.username);
			//get the username and put it into the data object
			data.username = socket.request.user.username;

			data.message = textLengthFilter(data.message);

			if (data.roomId) {
				//send out that data object to all clients in room
				
				sendToRoomChat(io, data.roomId, data);
				// io.in(data.roomId).emit("roomChatToClient", data);
			}
		});


		//when a user disconnects/leaves the whole website
		socket.on("disconnect", function (data) {
			//debugging
			console.log(socket.request.user.username + " has left the lobby.");
			//get the index of the player in the array list
			var i = currentPlayersUsernames.indexOf(socket.request.user.username);
			//in case they already dont exist, dont crash server
			if (i === -1) { return; }
			//remove that single player who left
			currentPlayersUsernames.splice(i, 1);
			//send out the new updated current player list
			socket.in("allChat").emit("update-current-players-list", currentPlayersUsernames);
			//tell all clients that the user has left
			var data = {
				message: socket.request.user.username + " has left the lobby.",
				classStr: "server-text"
			}
			sendToAllChat(io, data);

			//Note, by default when socket disconnects, it leaves from all rooms. 
			//If user disconnected from within a room, the leave room function will send a message to other players in room.

			//if they are in a room, say they're leaving the room.
			var data = {
				message: socket.request.user.username + " has left the room.",
				classStr: "server-text"
			}
			sendToRoomChat(io, socket.request.user.inRoomId, data);
			// io.in(socket.request.user.inRoomId).emit("player-left-room", socket.request.user.username);

			removePlayerFromRoomAndCheckDestroy(socket, io);
		});


		//when a new room is created
		socket.on("newRoom", function () {
			//while rooms exist already (in case of a previously saved and retrieved game)
			while(rooms[nextRoomId]){
				nextRoomId++;
			}
			rooms[nextRoomId] = new avalonRoom(socket.request.user.username, nextRoomId, io);
			console.log("new room request");
			//broadcast to all chat
			var data = {
				message: socket.request.user.username + " has created room " + nextRoomId + ".",
				classStr: "server-text"
			}			
			sendToAllChat(io, data);

			console.log(data.message);

			//send to allChat including the host of the game
			// io.in("allChat").emit("new-game-created", str);
			//send back room id to host so they can auto connect
			socket.emit("auto-join-room-id", nextRoomId);

			//increment index for next game
			nextRoomId++;

			updateCurrentGamesList(io);
		});

		//when a player joins a room
		socket.on("join-room", function (roomId) {
			// console.log(roomId);
			// console.log(rooms[roomId]);

			//if the room exists
			if (rooms[roomId]) {
				console.log("room id is: ");
				console.log(roomId);
				console.log(roomId);
				console.log(roomId);

				//set the room id into the socket obj
				socket.request.user.inRoomId = roomId;

				//set them to a spectator
				socket.request.user.spectator = true;

				//join the room chat
				socket.join(roomId);

				//join the room
				rooms[roomId].playerJoinRoom(socket);

				//emit to the new spectator the players in the game.
				socket.emit("update-room-players", rooms[roomId].getPlayers());

				//update the room players
				io.in(roomId).emit("update-room-players", rooms[roomId].getPlayers());

				
				//emit to say to others that someone has joined
				var data = {
					message: socket.request.user.username + " has joined the room.",
					classStr: "server-text"
				}			
				sendToRoomChat(io, roomId, data);

				// io.in(roomId).emit("player-joined-room", socket.request.user.username);

				//if the game has started, and the user who is joining
				//is part of the game, give them the data of the game again
				usernamesInGame = rooms[roomId].getUsernamesInGame();
				if (usernamesInGame.indexOf(socket.request.user.username) !== -1) {

					distributeGameData(socket, io);
					socket.request.user.spectator = false;
				}
				//if game has started, give them a copy of spectator data
				else if (rooms[roomId].getStatus() !== "Waiting") {
					giveGameDataToSpectator(socket, io);
				}

				updateCurrentGamesList(io);


			} else {
				console.log("Game doesn't exist!");
			}
		});

		socket.on("join-game", function (roomId) {
			if (rooms[roomId]) {
				socket.request.user.spectator = false;
				//if the room has not started yet, throw them into the room
				console.log("Game status is: " + rooms[roomId].getStatus());
				if (rooms[roomId].getStatus() === "Waiting") {
					var ToF = rooms[roomId].playerJoinGame(socket);
					console.log(socket.request.user.username + " has joined room " + roomId + ": " + ToF);

					//update the room players
					io.in(roomId).emit("update-room-players", rooms[roomId].getPlayers());
				}
				else {
					console.log("Game has started, player " + socket.request.user.username + " is not allowed to join.");
				}
			}

			updateCurrentGamesList(io);
		});

		//when a player leaves a room
		socket.on("leave-room", function () {
			if (rooms[socket.request.user.inRoomId]) {
				console.log(socket.request.user.username + " is leaving room: " + socket.request.user.inRoomId);
				//broadcast to let others know

				var data = {
					message: socket.request.user.username + " has left the room.",
					classStr: "server-text"
				}
				sendToRoomChat(io, socket.request.user.inRoomId, data);

				// io.in(socket.request.user.inRoomId).emit("player-left-room", socket.request.user.username);

				//remove player from room and check destroy
				removePlayerFromRoomAndCheckDestroy(socket, io);
				//leave the room chat
				socket.leave(socket.request.user.inRoomId);

				//remove from spectators list
				if(rooms[socket.request.user.inRoomId]){
					io.in(socket.request.user.inRoomId).emit("update-room-players", rooms[socket.request.user.inRoomId].getPlayers());
				}
				


				updateCurrentGamesList(io);

			}
		});

		socket.on("player-ready", function (username) {
			if (rooms[socket.request.user.inRoomId]) {

				var data = {
					message: username + " is ready.",
					classStr: "server-text"
				}
				sendToRoomChat(io, socket.request.user.inRoomId, data);
				// io.in(socket.request.user.inRoomId).emit("player-ready", username + " is ready.");

				if (rooms[socket.request.user.inRoomId].playerReady(username) === true) {
					//game will auto start if the above returned true
					distributeGameData(socket, io);
					updateRoomPlayers(io, socket);
				}
			}
		});

		socket.on("player-not-ready", function (username) {
			if (rooms[socket.request.user.inRoomId]) {
				rooms[socket.request.user.inRoomId].playerNotReady(username);
				var data = {
					message: username + " is not ready.",
					classStr: "server-text"
				}
				sendToRoomChat(io, socket.request.user.inRoomId, data);

				// io.in(socket.request.user.inRoomId).emit("player-not-ready", username + " is not ready.");
			}
		});

		socket.on("startGame", function (data) {
			//start the game
			if (rooms[socket.request.user.inRoomId]) {
				if (socket.request.user.inRoomId && socket.request.user.username === rooms[socket.request.user.inRoomId].getHostUsername()) {

					rooms[socket.request.user.inRoomId].hostTryStartGame(data);

					//socket.emit("update-room-players", rooms[roomId].getPlayers());
				} else {
					console.log("Room doesn't exist or user is not host, cannot start game");
					socket.emit("danger-alert", "You are not the host. You cannot start the game.")
					return;
				}
			}

			updateCurrentGamesList(io);
		});

		socket.on("kickPlayer", function (username) {
			console.log("received kick player request: " + username);
			if (rooms[socket.request.user.inRoomId]) {
				rooms[socket.request.user.inRoomId].kickPlayer(username, socket);
				updateRoomPlayers(io, socket);
			}
		});

		//when a player picks a team
		socket.on("pickedTeam", function (data) {
			if (rooms[socket.request.user.inRoomId]) {
				rooms[socket.request.user.inRoomId].playerPickTeam(socket, data);
				distributeGameData(socket, io);
			}
		});

		socket.on("pickVote", function (data) {
			if (rooms[socket.request.user.inRoomId]) {
				rooms[socket.request.user.inRoomId].pickVote(socket, data);
				distributeGameData(socket, io);
			}

		});

		socket.on("missionVote", function (data) {
			if (rooms[socket.request.user.inRoomId]) {
				rooms[socket.request.user.inRoomId].missionVote(socket, data);
				distributeGameData(socket, io);
			}
			//update all the games list (also including the status because game status changes when a mission is voted for)
			updateCurrentGamesList(io);
		});

		socket.on("assassinate", function (data) {
			if (rooms[socket.request.user.inRoomId]) {
				rooms[socket.request.user.inRoomId].assassinate(socket, data);
				distributeGameData(socket, io);
			}
			//update all the games list (also including the status because game status changes when a mission is voted for)
			updateCurrentGamesList(io);
		});

		socket.on("lady", function (data) {
			if (rooms[socket.request.user.inRoomId]) {
				rooms[socket.request.user.inRoomId].useLady(socket, data);
				distributeGameData(socket, io);
			}
		});

		socket.on("claim", function(data){
			if (rooms[socket.request.user.inRoomId]) {
				rooms[socket.request.user.inRoomId].claim(socket);
				updateRoomPlayers(io, socket);
			}
		});

	});
}

function distributeGameData(socket, io) {
	//distribute roles to each player

	updateRoomPlayers(io, socket);

	if(rooms[socket.request.user.inRoomId].gameStarted === true){
		var gameData = rooms[socket.request.user.inRoomId].getGameData();

		var roomId = socket.request.user.inRoomId;

		for (var i = 0; i < Object.keys(gameData).length; i++) {
			gameData[i].roomId = roomId;
		}


		console.log("roomId distribute: " + roomId);

		for (var i = 0; i < Object.keys(gameData).length; i++) {
			//send to each individual player
			console.log("send out game data to player: " + gameData[i].username);
			io.to(gameData[i].socketId).emit("game-data", gameData[i]);
			// console.log(gameData[i]);
			// console.log("Player " + gameData[i].username + " has been given role: " + gameData[i].role);
		}
	
		var gameDataForSpectators = rooms[socket.request.user.inRoomId].getGameDataForSpectators();
		//send out spectator data
		socketsOfSpectators = rooms[socket.request.user.inRoomId].getSocketsOfSpectators();
		console.log("sockets of spectators length: " + socketsOfSpectators.length);
	
		for (var i = 0; i < socketsOfSpectators.length; i++) {
			var socketId = socketsOfSpectators[i].id;
			console.log("Socket id: " + socketId);
			socket.to(socketId).emit("game-data", gameDataForSpectators);
			console.log("(for loop) Sent to spectator: " + socketsOfSpectators[i].request.user.username);
		}
	}
}

function giveGameDataToSpectator(socket, io) {
	var gameDataForSpectators = rooms[socket.request.user.inRoomId].getGameDataForSpectators();
	//send out spectator data
	console.log("Spectator data sent to spectator: " + socket.request.user.username);
	socket.emit("game-data", gameDataForSpectators);
}

function removePlayerFromRoomAndCheckDestroy(socket, io) {
	//remove player from room if he/she is in one
	if (socket.request.user.inRoomId && rooms[socket.request.user.inRoomId]) {
		//leave the room
		rooms[socket.request.user.inRoomId].playerLeaveRoom(socket);
		//check if the room even exists, sometimes with fast refreshes
		//it might already have deleted the room
		//Check if the room needs destroying
		if (rooms[socket.request.user.inRoomId].toDestroyRoom() === true) {
			//destroy room
			rooms[socket.request.user.inRoomId] = undefined;
			//resend the current games list
			updateCurrentGamesList(io);
		}
		//otherwise update room players
		else {
			//update the room players
			updateRoomPlayers(io, socket);

			//also update gamedata for all players
			distributeGameData(socket, io);
		}
	}
}

var updateCurrentGamesList = function (io) {
	//prepare room data to send to players. 
	var gamesList = [];
	for (var i = 0; i < rooms.length; i++) {
		//If the game exists
		if (rooms[i]) {
			//create new array to send
			gamesList[i] = {};
			//get status of game
			gamesList[i].status = rooms[i].getStatus();
			//get room ID
			gamesList[i].roomId = rooms[i].getRoomId();
			gamesList[i].hostUsername = rooms[i].getHostUsername();
			gamesList[i].numOfPlayersInside = rooms[i].getNumOfPlayersInside();
			gamesList[i].numOfSpectatorsInside = rooms[i].getNumOfSpectatorsInside();
		}
	}
	io.in("allChat").emit("update-current-games-list", gamesList);
}



function updateRoomPlayers(io, socket) {
	io.in(socket.request.user.inRoomId).emit("update-room-players", rooms[socket.request.user.inRoomId].getPlayers());
}

function textLengthFilter(str) {
	var lengthLimit = 500;

	if (str.length > lengthLimit) {
		return str.slice(0, lengthLimit);
	}
	else{
		return str;
	}
}


var fiveMinsInMillis = 1000 * 60 * 5;
// var fiveMinsInMillis = 10000; //10 seconds just for testing


function sendToAllChat(io, data){
	io.in("allChat").emit("allChatToClient", data);

	var date = new Date();
	data.dateCreated = date;

	allChatHistory.push(data);

	allChat5Min.push(data);

	
	var i = 0;
	

	while(date - allChat5Min[i].dateCreated > fiveMinsInMillis){
		if(i >= allChat5Min.length){
			break;
		}
		i++;
	}

	if(i !== 0){
		//console.log("Messages older than 5 mins detected. Deleting old ones. index: " + i);
		//starting from index 0, remove i items.
		allChat5Min.splice(0, i);
	}

}

function sendToRoomChat(io, roomId, data){
	io.in(roomId).emit("roomChatToClient", data);
	// io.in(socket.request.user.inRoomId).emit("player-ready", username + " is ready.");

	if(rooms[roomId]){
		rooms[roomId].addToChatHistory(data);
	}
}