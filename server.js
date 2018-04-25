//---------------------------------------------------------------------------Imports
//node built in
var http 			= require("http");
//npm required, defined in package.json
var WebSocketIO		= require("websocketio");
//var json5 		= require("json5"); //for later

var httpServer   	= require("./src/httpServer");
var utils			= require("./src/utils");
var gcSetup 		= require("./src/globalsAndConstants");

//---------------------------------------------------------------------------WebServer variables
var webVars			= {};
	webVars.port 		= 9001;
	webVars.httpServer 	= new httpServer("public");
	webVars.mainServer 	= null;
	webVars.wsioServer 	= null;
	webVars.clients 	= []; //used to contain the wsio connections
	webVars.infoClients = [];
	webVars.ccInformation = {
		totalCores: 0,
		usedCores: 0
	};
	webVars.isProcessingJob = false;

var clientData		= []; //any additional data as necessary for clients.

//---------------------------------------------------------------------------debug options setup
gcSetup.initialize(); //check the file for specific debug options.

//--------------------------------------------------------------------------------------------------------------------------Start webserver
//create http listener
webVars.mainServer = http.createServer( webVars.httpServer.onrequest ).listen( webVars.port );
utils.debugPrint("Server started, listening on port:" + webVars.port, "http"); //only print if http debug is enabled.

//create ws listener
webVars.wsioServer = new WebSocketIO.Server( { server: webVars.mainServer } );
webVars.wsioServer.onconnection(openWebSocketClient);
//At this point the basic web server is online.















//--------------------------------------------------------------------------------------------------------------------------WebSocket(ws) related functions 
//If there is no websocket communication, the rest can be ignored.

/*
Called whenever a connection is made.
This happens on first contact through webpage entry. Regardless of if the client sends a packet.
*/
function openWebSocketClient(wsio) {
	utils.debugPrint( ">Connection from: " + wsio.id + " (" + wsio.clientType + " " + wsio.clientID+ ")", "wsio");
	wsio.onclose(closeWebSocketClient);
	wsio.on("addClient", wsAddClient);
}

/*
Cleanup for when a connection closes.
TODO
This isnt complete. The necessary effects change depending on what types of services the server is for.
*/
function closeWebSocketClient(wsio) {
	utils.debugPrint( ">Disconnect" + wsio.id + " (" + wsio.clientType + " " + wsio.clientID+ ")", "wsio");

	utils.removeArrayElement(webVars.clients, wsio);
} //end closeWebSocketClient

/*
The "addClient" packet is the first packet that the client must send in order to be recognized by this server.
@param wsio is the websocket that was used.
@param data is the sent packet, in json format.
TODO
Additional effects may be needed, again depending on the services.
*/
function wsAddClient(wsio, data) {
	utils.debugPrint("addClient packet received", "wsio");
	webVars.clients.push(wsio); 		// Good to remember who is connected.
	setupListeners(wsio); 				// setup the other wsio packets necessary for the services.
	wsio.emit("serverAccepted", {} ); 	// generally need to confirm that the server OKd the wsio connection
	clientInformationUpdate(wsio, data);
}

/*
When receiving a packet of the named type, call the function.
*/
function setupListeners(wsio) {
	wsio.on("consoleLog",				wsConsoleLog); //basic tester packet
	wsio.on("juliaJobSubmit", 			wsJuliaJobSubmit);
	wsio.on("juliaComputeUpdate", 		wsJuliaComputeUpdate);
} //end setupListeners

function wsConsoleLog(wsio, data) {
	utils.consolePrint(data.message); //assumes there is a message property in the packet.
	data.message = "Server confirms:" + data.message;
	wsio.emit("serverConfirmCL", data);
}








/*
After client connects update available information.
*/
function clientInformationUpdate(wsio, data) {
	if (data.type === "compute") {
		wsio.cores = [];
		if (data.cores && (data.cores > 0)) {
			wsio.cores = Array(data.cores).fill(false); // false means not in use
		}
	}
	if (!data.type) {
		console.log("ERROR unknown client connection type:" + data.type);
	}
	wsio.type = data.type;
	utils.debugPrint("client type " + wsio.type + " connected", "wsio");

	updateCcInformation();
} //end clientInformationUpdate

/*
After client connects update available information.
*/
function updateCcInformation() {
	webVars.infoClients = [];
	webVars.ccInformation.totalCores = 0;
	webVars.ccInformation.usedCores = 0;
	webVars.ccInformation.isProcessingJob = webVars.isProcessingJob;

	for (let i = 0; i < webVars.clients.length; i++) {
		console.log("erase me, updating cc");
		if (webVars.clients[i].type === "job") {
			webVars.infoClients.push(webVars.clients[i]);
			console.log("erase me, job ");
		} else if (webVars.clients[i].type === "compute") {
			for (let c = 0; c < webVars.clients[i].cores.length; c++) {
				webVars.ccInformation.totalCores++;
				if (webVars.clients[i].cores[c]) {
					webVars.ccInformation.usedCores++;
				}
			}
		}
	}
	for (let i = 0; i < webVars.infoClients.length; i++) {
		utils.debugPrint("sending to job page", "wsio");
		webVars.infoClients[i].emit("coreInfo", webVars.ccInformation);
	}
} //end updateCcInformation
















//--------------------------------------------------------------------------------------------------------------------------WebSocket(ws) related functions 
// Julia


// When getting a job, need to chop up the space into portions, filling the job queue
// Then dispatch to each, setup a handler for responses


function wsJuliaJobSubmit (wsio, data) {
	webVars.juliaJobInfo = data;
	data.jobQueue = Array(data.height).fill(false);
	// webVars.isProcessingJob = true;
	data.nextJobId = 0;

	// Send first batch
	for (let i = 0; i < webVars.clients.length; i++) {
		if (webVars.clients[i].type === "compute") {
			for (let c = 0; c < webVars.clients[i].cores.length; c++) {
				utils.debugPrint("Sending work for julia line " + data.nextJobId);
				webVars.clients[i].emit("juliaJobCompute", {
					id: data.nextJobId,
					width: data.width,
					height: data.height,
					newJob: true
				});
				data.nextJobId++;
				if (data.nextJobId >= data.jobQueue.length) {
					// if more cores than jobs, stop sending
					return;
				}
			}
		}
	}
}

function wsJuliaComputeUpdate(wsio, data) {
	// Mark this line as done
	webVars.juliaJobInfo.jobQueue[data.id] = true;

	// First pass off the line ot job page
	for (let i = 0; i < webVars.infoClients.length; i++) {
		utils.debugPrint("sending calculated julia line " + data.id + " to to job page", "wsio");
		webVars.infoClients[i].emit("juliaLineCompleted", data);
	}

	// Tell this client to do another line if available
	if (webVars.juliaJobInfo.nextJobId < webVars.juliaJobInfo.jobQueue.length) {
		utils.debugPrint("Sending work for julia line " + webVars.juliaJobInfo.nextJobId, "wsio");
		wsio.emit("juliaJobCompute", {
			id: webVars.juliaJobInfo.nextJobId,
			width: webVars.juliaJobInfo.width,
			height: webVars.juliaJobInfo.height
		});
		webVars.juliaJobInfo.nextJobId++;

	}
}