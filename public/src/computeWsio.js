//--------------------------------------------------------------------------------------------------------------------------Global vars
var debug = true;
var wsio;


var coresDetected = navigator.hardwareConcurrency;
var workers = [];

var memoryEater = [];
var memoryEaterString = "";

//--------------------------------------------------------------------------------------------------------------------------actions

// create workers equal to number of cores
for (let i = 0; i < coresDetected; i++) {
	workers.push(new Worker("src/computeWorker.js"));
	workers[i].isComputing = false;
	workers[i].onmessage = function(e) {
		var data = e.data
		if (data.type === "julia") {
			// Hiding line status to prevent massive ram consumption seen on some computers
			// log("Julia line calculated " + data.id + " with length: " + data.line.length);
			// var juliaCanvas = document.createElement("canvas");
			// juliaCanvas.width = data.line.length;
			// juliaCanvas.height = 2;
			// juliaCanvas.style.border = "1px solid black";
			// juliaCanvas.id = "jc" + data.id;
			// var ctx = juliaCanvas.getContext('2d');

			// if (data.id === 50) {
			// 	console.log(data.line);
			// } else if (data.id === 0) {
			// 	console.log(data.line);
			// }

			// for (let x = 0; x < data.line.length; x++) {
			// 	ctx.fillStyle = "rgb("
			// 		+ data.line[x][0] + ","
			// 		+ data.line[x][1] + ","
			// 		+ data.line[x][2] + ")"; // 1 is alpha
			// 	ctx.fillRect( x, 0, 1, 1);
			// }

			// // statusDiv.appendChild(juliaCanvas);
			// logDiv.appendChild(juliaCanvas);

			wsio.emit("juliaComputeUpdate", {id: data.id, line: data.line});
		} else if (data.type === "message") {
			log(data.message);
		}
		this.isComputing = false;
	};
}

//--------------------------------------------------------------------------------------------------------------------------Start wsio communcation

function initializeWS() {
	log("Initializing");

	// Create a connection to server
	wsio = new WebsocketIO();
	log("Attempting connection to:" + wsio.url);
	wsio.open(function() {
		log("Websocket opened, emitting addClient");
		
		wsio.emit('addClient', {
			type: "compute",
			cores: coresDetected
		});

		titleDiv.textContent = "Compute Node (" + coresDetected + " cores)"

		setupListeners(); 
	});

	wsio.on('close', function (evt) {
		log('Lost connection');
	});


} //end initialize


//--------------------------------------------------------------------------------------------------------------------------
// Communication handlers
function setupListeners() {
	wsio.on('serverAccepted', function(data) {
		log("Server has accepted connection");
	});

	wsio.on('serverConfirmCL', function(data) {
		log("Server confirms message:" + data.message);
	});
	
	wsio.on('juliaJobCompute', wsJuliaJobCompute);
}


//--------------------------------------------------------------------------------------------------------------------------

// data should have properties: id, width, height
// id corresponds to which height line
function wsJuliaJobCompute(data) {
	var wi = findInactiveWorkerIndex();
	if (data.newJob) {
		logDiv.innerHTML = "";
		log("Starting new Julia job");
	}
	log("Processing julia line " + data.id
	+ " of length "+ data.width
	+ " out of height " + data.height
	+ ". Assigning to " + wi);
	if (wi < 0) {
		log("Over  workers");
		return;
	}

	// found inactive worker, submit
	workers[wi].postMessage(data);
	workers[wi].isComputing = true;
}

function findInactiveWorkerIndex() {
	for(let i = 0; i < workers.length; i++) {
		if (!workers[i].isComputing) {
			return i;
		}
	}
	return -1;
}


//--------------------------------------------------------------------------------------------------------------------------
function log(s) {
	statusDiv.textContent = s;
	logDiv.innerHTML += "<br>" + s;

}


//--------------------------------------------------------------------------------------------------------------------------
function startWebWorkerConsumingMemory(amount, wid = 0, total, cycle) {
	if (!total) {
		total = 0;
	}
	if (!cycle) {
		cycle = 0;
	}
	var data = {};
	data.type = "consumeMemory";
	data.amount = amount;
	// tell worker to consume memory
	workers[wid].postMessage(data);
	total += amount;
	cycle++;
	// log("Cycle " + cycle + ", consumed " + total);

	setTimeout(() => {
		startWebWorkerConsumingMemory(amount, wid, total, cycle);
	}, 1000);
}

function startPageConsumingMemory(amount, total, cycle) {
	if (!total) {
		total = 0;
	}
	if (!cycle) {
		cycle = 0;
	}
	total += amount;
	cycle++;
	// log("Cycle " + cycle + ", consumed " + total);
	var mem = [];
	memoryEater.push(mem);

	for (let i = 0; i < amount; i++) {
		mem.push(parseInt(Math.random() * 100)); // push random integers 0-99
	}
	log("Page memory consumption:" + total);
	setTimeout(() => {
		startPageConsumingMemory(amount, total, cycle);
	}, 1000);
}

function startPageConsumingMemoryStringBased(amount, total, cycle) {
	if (!total) {
		total = 0;
	}
	if (!cycle) {
		cycle = 0;
	}
	total += amount;
	cycle++;
	// log("Cycle " + cycle + ", consumed " + total);

	for (let i = 0; i < amount; i++) {
		memoryEaterString += String.fromCharCode(97 + Math.random() * 26);
	}
	log("Page memory consumption:" + total);
	setTimeout(() => {
		startPageConsumingMemoryStringBased(amount, total, cycle);
	}, 1000);
}
