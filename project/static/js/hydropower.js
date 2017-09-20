/*****************************************************************************
 * Hydropower analysis and data object
 * This is used for storing and processing the results as they come in.
 */  
var hp = {
	
  // analysis parameters
	params : {
		//// constants
		efficiency: 0.7,
		envflow: 0.3,
		rate: 0.1,
		//// area from the getArea method -or- constant from form
		area: null,
		///// head from the calcHead method -or- constant from form
		head: null,
	},
	// parameter validation object used internally
	_validate: {},
    
	// geoprocessing outputs ()
	//// elevation profile analysis result, used by calcHead
	profile: {},
	//// watershed analysis result, used by getArea
	watershed: {},
	
	//// intermediate power calculations
	_int : {},

	// calculation results  
	results: {
		//// power from the calcPower method
		power: null,
		//// cost from the calcPower method
		cost: null
	},
	// store status for the GP operations
	//status: {
	//	"profile": null,
	//	"watershed": null,
	//	"power": null
	//},
    
	// calculate head from the ESRI Elevation Profile service result object
	calcHead: function() {
		console.log("Calculating head...");
		//get the line from the result object
		var line = this.profile.OutputProfile.features[0];
		// get the coords from the line
		var coords = line.geometry.coordinates;
		// get the z values from the first and last coordinate
		var firstZ = coords[0][2];
		var lastZ = coords[coords.length - 1][2];
		// save the difference
		this.params.head = lastZ - firstZ;
		// check result. It must be a positive number
		//if (this.params.head < 0) {
		//	this.status.profile("The head calculation returned a negative value. Make sure the line was drawn downstream&rarr;upstream.");
		//}
		// (consider saving result as ABS value)
		console.log("Head:", this.params.head, "meters");
	},
    
	// Extract the area value from the ESRI Watershed service result object
	getArea: function() {
		console.log("Getting area...");
		// area (as square clicks) is buried in the result object. get it.
		this.params.area = this.watershed.WatershedArea.features[0].properties.AreaSqKm;
		console.log("Area:", this.params.area, "sq. km.");
	},
    
	// ensure inputs are within correct value ranges
	validateParams: function() {
		// validate all input params and record result
		this._validate.head = (this.params.head > 0);
		this._validate.area = (this.params.area > 0);
		this._validate.efficiency = (this.params.efficiency >= 0 || this.params.efficiency <= 1);
		this._validate.envflow = (this.params.envflow >= 0.1 || this.params.envflow <= 0.5);
		if (this.params.rate) {this._validate.rate = true;} else {this._validate.rate = false;}
		
		// return whether or not all params are valid
		checks = [];
		$.each(this._validate, function(k,v) {
				checks.push(v);
		});
		if (checks.indexOf(false) == -1) {
			return {status: true, params: this._validate};
		} else {
			return {status: false, params: this._validate};
		}
  },
	/**
	 * client-side hydropower calculation
	 */
  calculatePower: function(area,head,envflow,efficiency,rate) {
		// if params are provided, overwrite any existing ones
		if (area) {this.params.area = area;}
		if (head) {this.params.head = head;}
		if (envflow) {this.params.envflow = envflow;}
		if (efficiency) {this.params.efficiency = efficiency;}
		if (rate) {this.params.rate = rate;}
		// validate the parameters
		var check = this.validateParams();
		console.log("check",check);
		// calculate power if params are valid
		if (check.status) {
			// Calculate power from stored parameters
			console.log(this);
			this._int.qAvailable = this.params.area * 1.6;
			this._int.qEnv = (this.params.area * this.params.envflow);
			this._int.qUseable = this._int.qAvailable - this._int.qEnv;
			console.log(this._int);
			// Power in kW
			var p = this._int.qUseable * this.params.head * (0.084) * this.params.efficiency;
			// Cost = rate * hours per year * kilowatts
			var c = this.params.rate * 8766 * this.results.power;
			console.log("power calcs", p,c);
			this.results.power = p;
			this.results.cost = c;
			// success
			return true;
		} else {
			// fail
			return false;
		}
	},
	/**
	 * calculate power from input params using the API
	 */
	calculatePowerAPI: function(area,head,envflow,efficiency,rate,callback) {
		//if params are provided, overwrite any existing ones
		if (area) {this.params.area = area;}
		if (head) {this.params.head = head;}
		if (envflow) {this.params.envflow = envflow;}
		if (efficiency) {this.params.efficiency = efficiency;}
		if (rate) {this.params.rate = rate;}
        
		console.log("Calculating power...");
		// assemble request URL to API
		var calcRequestURL = Flask.url_for("api", {
			"area": this.params.area,
			"head": this.params.head,
			"envflow": this.params.envflow,
			"efficiency": this.params.efficiency,
			"rate": this.params.rate
		});
		// submist GET request
		$.get({
			url: calcRequestURL,
			success: function(data) {
				this.results.power = data.result.power;
				this.results.cost = data.result.cost;
				if (callback) {
						callback();
				}
			}
		});
	},

};