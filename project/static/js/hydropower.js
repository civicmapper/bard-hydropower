/*****************************************************************************
 * Hydropower analysis and data object
 * This is used for storing and processing the results as they come in.
 */
function HydroPowerClass () {
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
 */  
hp = HydroPowerClass();