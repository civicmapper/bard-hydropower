/*****************************************************************************
 * Hydropower analysis and data object
 * This is used for storing and processing the results as they come in.
 */

function HydroPowerClass () {
    // constants
    this.efficiency = 0.3;
    this.envflow = 0.7;
    // store the elevation profile analysis result
    this.profile = {};
    // store the watershed analysis result
    this.watershed = {};
    // store the area from the watershed analysis
    this.area = 0;
    // store the head from the calcHead method
    this.head = 0;
    // store the power from the calcPower method
    this.power = 0;
    // store status for the GP operations
    this.status = {
      "profile": null,
      "watershed": null
    };

}

/**
 * calculate head from the ESRI Elevation Profile service result object
 */
HydroPowerClass.prototype.calcHead = function() {
  //store the drawing for the inputs
  var inputLine = null;
  //get the line from the result object
  var line = this.profile.OutputProfile.features[0];
  // get the coords from the line
  var coords = line.geometry.coordinates;
  // get the z values from the first and last coordinate
  var firstZ = coords[0][2];
  var lastZ = coords[coords.length - 1][2];
  // save the difference
  this.head = lastZ - firstZ;
  // check result. It must be a positive number
  if (this.head < 0) {
    this.status.profile("The head calculation returned a negative value. Make sure the line was drawn downstream&rarr;upstream.");
  }
};

/**
 * Extract the area value from the ESRI Watershed service result object
 */
HydroPowerClass.prototype.getArea = function() {
  // area (as square clicks) is buried in the result object. get it.
  this.area = this.watershed.WatershedArea.features[0].properties.AreaSqKm;
};

/**
 * calculate power using stored watershed and head properites, plus some
 * constants (x, e) that can optionally be provided
 */
HydroPowerClass.prototype.calcPower = function(x,e) {
  // set the defaults if not overridden 
  if (!x) {
    x = 0.3;
  }
  if (!e) {
    x = 0.7;
  }
  
  // calculate power
  var Qavail = (this.area * 1.6);
  //where x is a range from 0.1 to 0.5 with default value of 0.3 (edited)
  var Qenv = (this.area*x);
  var Quseable = Qavail - Qenv;
  //Power in kW; where e is a variable with default value 0.7 (edited)
  var p = Quseable * h * (0.084) * e;
  this.power = _round(p,2);
};

/**
 * Add the watershed layer to the map
 */
HydroPowerClass.prototype.mapWatershed = function() {
  var watershedArea = L.featureGroup();
  map.addLayer(watershedArea);
  watershedArea.addLayer(L.geoJSON(this.watershed.WatershedArea));
};

/**
 * Create the line used in the profile visualization
 */
HydroPowerClass.prototype.buildProfileGraphic = function() {
    var line = this.profile.OutputProfile.features;
    var el = L.control.elevation().addTo(map);
    L.geoJson(line,{
      onEachFeature: el.addData.bind(el)
    }).addTo(map);
};

/**
 * instantiate the hydropower object
 * var hp = HydroPowerClass();
 */  
hp = {
    // constants
    efficiency: 0.7,
    envflow: 0.3,
    // store the elevation profile analysis result
    profile: {},
    // store the watershed analysis result
    watershed: {},
    // store the area from the watershed analysis
    area: null,
    // store the head from the calcHead method
    head : null,
    // store the power from the calcPower method
    power: null,
    // store status for the GP operations
    status : {
      "profile": null,
      "watershed": null,
      "power": null
    }
};

/**
 * calculate head from the ESRI Elevation Profile service result object
 */
hp_calcHead = function() {
  //store the drawing for the inputs
  var inputLine = null;
  //get the line from the result object
  var line = hp.profile.OutputProfile.features[0];
  // get the coords from the line
  var coords = line.geometry.coordinates;
  // get the z values from the first and last coordinate
  var firstZ = coords[0][2];
  var lastZ = coords[coords.length - 1][2];
  // save the difference
  hp.head = lastZ - firstZ;
  // check result. It must be a positive number
  if (hp.head < 0) {
    hp.status.profile("The head calculation returned a negative value. Make sure the line was drawn downstream&rarr;upstream.");
  }
};

/**
 * Extract the area value from the ESRI Watershed service result object
 */
var hp_getArea = function() {
  // area (as square clicks) is buried in the result object. get it.
  hp.area = hp.watershed.WatershedArea.features[0].properties.AreaSqKm;
};

/**
 * Get inputs from the parameters form
 */
var hp_getParams = function () {
    hp.head = $('#head-form-field').val();
    hp.area = $('#area-form-field').val();
    hp.envflow = $('#env-form-field').val();
    hp.efficiency = $('#eff-form-field').val();
};

/**
 * calculate power using stored watershed and head properites, plus some
 * constants (x, e) that can optionally be provided
 */
var hp_calculatePower = function() {
    
  //validate the constants; reset to defaults if not correct
  if (hp.envflow <= 0.5 && hp.envflow > 0.1) {}
  else {
    hp.envflow = 0.3;
  }
  
  //validate the constants; reset to defaults if not correct
  if (hp.efficiency <= 1 && hp.efficiency > 0) {}
  else {
    hp.efficiency = 0.7;
  }
  // assemble request URL to API
  calcRequestURL = Flask.url_for("api", {
    "area": hp.area, "head": hp.head, "envflow": hp.envflow, "efficiency": hp.efficiency
  });
  // submist GET request
  $.get({
    url: calcRequestURL,
    success: function(data) {
      hp.power = data.result.power;
      analyzeSuccess();
    }
  });
};

/**
 * Add the watershed layer to the map
 */
var hp_mapWatershed = function() {
  var watershedArea = L.featureGroup();
  map.addLayer(watershedArea);
  watershedArea.addLayer(L.geoJSON(hp.watershed.WatershedArea));
};

/**
 * Create the line used in the profile visualization
 */
var hp_buildProfileGraphic = function() {
    var line = hp.profile.OutputProfile.features;
    var el = L.control.elevation().addTo(map);
    L.geoJson(line,{
      onEachFeature: el.addData.bind(el)
    }).addTo(map);
};
