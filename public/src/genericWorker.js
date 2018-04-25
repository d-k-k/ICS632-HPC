


// e.data contains the values passed from caller
onmessage = function(e) {
	var data = e.data;
	var line = [];
	for(let i = 0; i < data.width; i++) {
		line.push([1,2,3]);
	}
	var y = data.id;
	console.log("worker sees: %d, %d, %d",  data.id, data.width, data.height);
	for (let x = 0; x < data.width; x++) {
		compute_julia_pixel(x, y, data.width, data.height, 1, line[x]);
		line[x][0] = parseInt(line[x][0]);
		line[x][1] = parseInt(line[x][1]);
		line[x][2] = parseInt(line[x][2]);
	}

	// after finishing post message back containing line
	postMessage({id: e.data.id, line, type:"julia"});
}


/*
Generic worker
	Why
		For future purposes need a way to have a generic worker class that can just perform work or be able to have common functionality
		Without this each worker has to have a dedicated file defining its properties
		While the purpose of this makes sense, it doesn't makes sense to continuously activate / remove workers to do potentially generic jobs
	
There are various things that need to be created:



Create a generic function handler
	There is only one entry point for workers, the onmessage function
	To specify a function makes more sense for the message to it work for many cases than handle each case
	Easier to add function in the future
	Reduces burden of having to remember to handle the case


Timer



*/
var generic = {



	// ---------------------------------------------------------------------------------------------------------------------------------------
	// ---------------------------------------------------------------------------------------------------------------------------------------
	// Functions

	printCheck: function(s) {
		console.log(s);
	},

	addCheck: function() {

	},

	// ----------------------------------------------------------------
	// 3d matrix functions
	createIdentityMatrix: function() {
		return[
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1
		];
	},
	createTranslationMatrix: function(x, y, z) {
		if (typeof x !== "number"
			|| typeof y !== "number"
			|| typeof z !== "number") {
			throw "Error, a paramter was not a number";
		}
		return [
			1,    0,    0,   0,
			0,    1,    0,   0,
			0,    0,    1,   0,
			x,    y,    z,   1
		];
	},
	// width (x), height (y), depth(z)
	createScaleMatrix: function(x, y, z) {
		if (typeof x !== "number"
			|| typeof y !== "number"
			|| typeof z !== "number") {
			throw "Error, a paramter was not a number";
		}
		return [
			x,    0,    0,   0,
			0,    y,    0,   0,
			0,    0,    z,   0,
			0,    0,    0,   1
		];
	},
	radiansToDegrees: function (r) {
		return r * (180 / Math.PI);
	},
	degreesToRadians: function (d) {
		return d * (Math.PI / 180);
	},
	// rotation around z index, angle in degrees
	createRotateXMatrix: function(angle) {
		createRotationMatrix(angle, "x");
	},
	createRotateYMatrix: function(angle) {
		createRotationMatrix(angle, "y");
	},
	createRotateZMatrix: function(angle) {
		createRotationMatrix(angle, "z");
	},
	createRotationMatrix: function(angle, axis) {
		if (typeof angle !== "number") {
			throw "Error, a paramter was not a number";
		}
		if (!axis) {
			throw "Error, axis was not defined";
		}
		var sin = Math.sin;
		var cos = Math.cos;

		switch(axis) {
			case "x":
				return [
					1,	0,		0,			0,
					0,	cos(a),	-sin(a),	0,
					0,	sin(a),	cos(a),		0,
					0,	 0,		0,			1
			   ];
				break;
			case "y":
				return [
					cos(a), 	0, sin(a),	0,
					0,			1, 0,		0,
					-sin(a), 	0, cos(a),	0,
					0,			0, 0,		1
				];
				break;
			case "z":
				return [
					cos(angle), -sin(angle),	0,	0,
					sin(angle),  cos(angle),	0,	0,
					0,			0,				1,	0,
					0,			0,				0,	1
				];
				break;
		}
	},
	// Multiply two 4x4 matricies together
	multiplyMatrices: function (matrixA, matrixB) {
		// Slice the second matrix up into columns
		var column0 = [matrixB[0], matrixB[4], matrixB[8], matrixB[12]];
		var column1 = [matrixB[1], matrixB[5], matrixB[9], matrixB[13]];
		var column2 = [matrixB[2], matrixB[6], matrixB[10], matrixB[14]];
		var column3 = [matrixB[3], matrixB[7], matrixB[11], matrixB[15]];

		// Multiply each column by the matrix
		var result0 = multiplyMatrixAndPoint(matrixA, column0);
		var result1 = multiplyMatrixAndPoint(matrixA, column1);
		var result2 = multiplyMatrixAndPoint(matrixA, column2);
		var result3 = multiplyMatrixAndPoint(matrixA, column3);

		// Turn the result columns back into a single matrix
		return [
		result0[0], result1[0], result2[0], result3[0],
		result0[1], result1[1], result2[1], result3[1],
		result0[2], result1[2], result2[2], result3[2],
		result0[3], result1[3], result2[3], result3[3]
		];
	}

};

