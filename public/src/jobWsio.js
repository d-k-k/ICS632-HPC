//--------------------------------------------------------------------------------------------------------------------------Global vars
var debug = true;
var wsio;


var coresDetected = navigator.hardwareConcurrency;
var canSubmitJobs = true;

var juliaCanvas;
var juliaFullData = [];
var juliaInfo = {
	startTime: 0,
	totalLines: 0,
	completedLines: 0
}

//--------------------------------------------------------------------------------------------------------------------------actions


juliaSubmitButton.addEventListener("click", function() {
	if (!canSubmitJobs || coresDetected <= 0) {
		log("Cannot submit a job yet.");
		return;
	}
	var width = parseInt(juliaWidth.value);
	var height = parseInt(juliaHeight.value);
	// var chunk = parseInt(juliaChunk.value);

	console.log("Detected values for julia submission: %d, %d", width, height);
	if (width <= 0 || 0 >= height) {
		log("Unable to submit job " + width + " or " + height + " is <= 0");
		return;
	}

	juliaCanvas = document.createElement("canvas");
	juliaCanvas.width = width;
	juliaCanvas.height = height;
	juliaWorkspace.innerHTML = "";
	juliaWorkspace.appendChild(juliaCanvas);

	for (let i = 0; i < height; i++) {
		juliaFullData.push("");
	}

	juliaInfo.startTime = Date.now();
	juliaInfo.totalLines = height;
	juliaInfo.completedLines = 0;

	// clear out the log to reduce memory burden
	logDiv.innerHTML = "";

	wsio.emit("juliaJobSubmit", { width, height});
});



//--------------------------------------------------------------------------------------------------------------------------Start wsio communcation

function initializeWS() {
	log("Initializing");

	// Create a connection to server
	wsio = new WebsocketIO();
	log("Attempting connection to:" + wsio.url);
	wsio.open(function() {
		log("Websocket opened, emitting addClient");
		
		wsio.emit('addClient', {
			type: "job"
		});

		titleDiv.textContent = "Job Submission";

		setupListeners(); 
	});

	wsio.on('close', function (evt) {
		log('Lost connection');
	});


} //end initialize


//--------------------------------------------------------------------------------------------------------------------------Start wsio communcation
// Communication handlers
function setupListeners() {
	wsio.on('serverAccepted', function(data) {
		log("Server has accepted connection");
	});

	wsio.on('serverConfirmCL', function(data) {
		log("Server confirms message:" + data.message);
	});

	wsio.on('coreInfo', function(data) {
		// data.usedCores, data.totalCores
		log("Server core info update: " + data.usedCores + " used out of " + data.totalCores + " available");
		if (data.isProcessingJob) {
			log("System currently in usage");
		}
		if (data.isProcessingJob) {
			titleDiv.textContent = "Job Submission [UNAVAILABLE]";
			canSubmitJobs = false;
		} else {
			titleDiv.textContent = "Job Submission [" + data.totalCores + " cores available]";
		}
	});

	wsio.on('juliaLineCompleted',		wsJuliaLineCompleted);

}


// data shoudl contain: id, line
function wsJuliaLineCompleted(data) {
	log("Received line " + data.id + " for updating");

	// Removing line status as it seems to eat ram really fast on some computers
	// var line = document.createElement("canvas");
	// line.width = data.line.length;
	// line.height = 1;
	// var ctx = line.getContext('2d');

	// for (let x = 0; x < data.line.length; x++) {
	// 	ctx.fillStyle = "rgb("
	// 		+ data.line[x][0] + ","
	// 		+ data.line[x][1] + ","
	// 		+ data.line[x][2] + ")"; // 1 is alpha
	// 	ctx.fillRect( x, 0, 1, 1 );
	// }

	// statusDiv.appendChild(line);
	// logDiv.appendChild(line);

	ctx = juliaCanvas.getContext('2d');
	for (let x = 0; x < data.line.length; x++) {
		ctx.fillStyle = "rgb("
			+ data.line[x][0] + ","
			+ data.line[x][1] + ","
			+ data.line[x][2] + ")"; // 1 is alpha
		ctx.fillRect( x, data.id, 1, 1 );
	}

	

	juliaInfo.completedLines++;
	if (juliaInfo.completedLines === juliaInfo.totalLines) {
		var dTime = Date.now() - juliaInfo.startTime;
		log("Completed, time taken: " + (dTime/1000) + " seconds");
	}
}





//--------------------------------------------------------------------------------------------------------------------------Start wsio communcation
function log(s) {
	statusDiv.textContent = s;
	logDiv.innerHTML += "<br>" + s;

}

