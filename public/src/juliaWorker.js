


/*
 * compute_julia_pixel(): compute RBG values of a pixel in a
 *                        particular Julia set image.
 *
 *  In:
 *      (x,y):            pixel coordinates
 *      (width, height):  image dimensions
 *      tint_bias:        a float to "tweak" the tint (1.0 is "no tint")
 *  Out:
 *      rgb: an already-allocated 3-byte array into which R, G, and B
 *           values are written.
 *
 *  Return:
 *      0 in success, -1 on failure
 *
 */

function compute_julia_pixel(x, y, width, height, tint_bias, rgb) {
	
	// Check coordinates
	if ((x < 0) || (x >= width) || (y < 0) || (y >= height)) {
		console.log("julia error, invalid pixel coodinates(%d, %d) in an image (%d x %d) ", x, y, width, height);
		return -1;
	}

	// "Zoom in" to a pleasing view of the Julia set
	var X_MIN = -1.6, X_MAX = 1.6, Y_MIN = -0.9, Y_MAX = +0.9;
	var float_y = (Y_MAX - Y_MIN) * y / height + Y_MIN ;
	var float_x = (X_MAX - X_MIN) * x / width  + X_MIN ;

	// Point that defines the Julia set
	var julia_real = -.79;
	var julia_img = .15;

	// Maximum number of iteration
	var max_iter = 300;

	// Compute the complex series convergence
	var real=float_y, img=float_x;
	var num_iter = max_iter;
	while (( img * img + real * real < 2 * 2 ) && ( num_iter > 0 )) {
		var xtemp = img * img - real * real + julia_real;
		real = 2 * img * real + julia_img;
		img = xtemp;
		num_iter--;
	}

	// Paint pixel based on how many iterations were used, using some funky colors
	var color_bias = num_iter / max_iter;
	rgb[0] = (num_iter == 0 ? 200 : - 500.0 * Math.pow(tint_bias, 1.2) *  Math.pow(color_bias, 1.6));
	rgb[1] = (num_iter == 0 ? 100 : -255.0 *  Math.pow(color_bias, 0.3));
	rgb[2] = (num_iter == 0 ? 100 : 255 - 255.0 * Math.pow(tint_bias, 1.2) * Math.pow(color_bias, 3.0));

	// console.log("%f, %f, %f", rgb[0], rgb[1], rgb[2]);

	return 0;
}