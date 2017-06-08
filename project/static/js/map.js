  
/*******************************************************************************
 * Helper: truncate value based on number of decimals
 */
var _round = function(num, len) {
  return Math.round(num * (Math.pow(10, len))) / (Math.pow(10, len));
};

/**
 * Authentication
 *
var clientID = 'Rl33Ikhm8yr4xlz4';
var accessToken;
var callbacks = [];
var protocol = window.location.protocol;
var callbackPage = protocol + '//esri.github.io/esri-leaflet/examples/oauth/callback.html';
//var callbackPage = 'http://esri.github.io/esri-leaflet/examples/oauth/callback.html';
//var callbackPage = protocol + '//localhost:8000';

// this function will be called when the oauth process is complete
window.oauthCallback = function(token) {
  accessToken = token;
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i](token);
  }
  callbacks = [];
};
 // this function will open a window and start the oauth process
function oauth(callback) {
  if(accessToken){
    callback(accessToken);
  } else {
    callbacks.push(callback);
    window.open('https://www.arcgis.com/sharing/oauth2/authorize?client_id='+clientID+'&response_type=token&expiration=20160&redirect_uri=' + window.encodeURIComponent(callbackPage), 'oauth-window', 'height=400,width=600,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes');
  }
}
*/

/** --------------------------------------------------------------------------
 * SETUP
 */

$(document).on("ready", function() {
  $('.analysis-status').hide();
});

$("#about-btn").click(function() {
	$("#aboutModal").modal("show");
	$(".navbar-collapse.in").collapse("hide");
	return false;
});


/*******************************************************************************
 * create map with basemap and supplemental layers
 */
var map = L.map('map').setView([42.0170202, -73.9144284], 18);

//L.esri.basemapLayer('Imagery').addTo(map);
//L.esri.Vector.basemap('Hybrid').addTo(map);

var layer_streams = L.esri.featureLayer({
  url: "https://services.arcgis.com/vT1c5Cjxbz2EbiZw/arcgis/rest/services/BardMicroHydro/FeatureServer/7",
}).addTo(map);

var layer_dams = L.esri.featureLayer({
  url: "https://services.arcgis.com/vT1c5Cjxbz2EbiZw/arcgis/rest/services/BardMicroHydro/FeatureServer/1",
}).addTo(map);

/*******************************************************************************
 * DRAWING ELEMENTS
 */

// store geometry for display on the map and use in the analysis tools
var drawnItems = L.featureGroup().addTo(map);
var drawnPolyline = L.polyline([]);
var drawnPoint = L.marker();

// implement the drawing control functionality
map.addControl(new L.Control.Draw({
  edit: {
    featureGroup: drawnItems,
  },
  draw: {
    polygon: false,
    rectangle: false,
    circle: false,
    marker: false,
    polyline: {
      allowIntersection: false,
      guidelineDistance: 10,
      shapeOptions: {
        stroke: true,
        color: '#3388ff',
        weight: 6,
        opacity: 0.5,
        fill: false,
        clickable: true
      }
    }
  }
}));

/**
 * drawInfo Control - instructions for drawing
 */
var drawInfo = L.control({
  position: 'topleft'
});

// method that we will use to update the control based on feature properties passed
drawInfo.update = function(title, props) {
  this._div.innerHTML = (title ? '<h4>' + title + '</h4>' : 'Draw a Line') + (props ? '<strong>' + props + '</strong>' : '');
};
// method used to append to the control based on feature properties passed
drawInfo.append = function(title, props) {
  this._div.innerHTML += (title ? '<h4>' + title + '</h4>' : 'Draw a Line') + (props ? '<strong>' + props + '</strong>' : '');
};

drawInfo.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'drawInfo');
  this.update();
  return this._div;
};

drawInfo.addTo(map);


var analyzeButton = '<div><button id="analyze" class="btn btn-primary btn-block" type="submit" disabled>Calculate</button></div>';

function makeAlert(msg, alertType) {
  var defaultMsg = null;
  if (alertType == 'info') {
    defaultMsg = 'Calculating&nbsp;<img src="/static/img/loading2.gif"/>';
  } else if  (alertType == 'success') {
    defaultMsg = 'Complete!';
  } else if (alertType == 'danger') {
    defaultMsg = "There was an error with the analysis";
  } else {
    defaultMsg = "Something went wrong";
    alertType = 'warning';
  }
  var div1 = '<div class="alert alert-' + alertType + '" role="alert">';
  var div2 = '</div>';
  if (msg) {
    return  div1 + msg + div2 ;
  } else {
    return div1 + defaultMsg + div2;
  }    
  
}
/**
 * Analysis Control
 * Contains button and subsequent results outputs from the tool.
 * Initially, only the button is present, but as the tool is run, the control
 * grows:
 *  - shows calculation status
 *  - shows complete or error alert
 *  - shows results
 */
var analyzeControl = L.control.custom({
    position: 'topright',
    content:
      '<li class="list-group-item" id="analyze-button-item">' + analyzeButton + '</li>' +
      '<li class="list-group-item analysis-status" id="msg-status"></li>' + 
      '<li class="list-group-item analysis-status" id="msg-text"></li>',
    classes: 'list-group',
    id: "analyze-control",
    style: {
        margin: '10px',
        padding: '0px 0 0 0',
        cursor: 'pointer',
    }
})
.addTo(map);

/**
 * manage the status messages
 */
function clearAndReplaceStatus(newStatusElementID) {
  $('.analysis-status').hide();
  $(newStatusElementID).show();
}

/*****************************************************************************
 * DRAWING
 */

/**
 * Generate popup content (length) for drawing
 * Returns HTML string, or null if unknown object
 */
var getPopupContent = function(layer) {
  if (layer instanceof L.Polyline) {
    var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs(),
      distance = 0;
    if (latlngs.length < 2) {
      return "Distance: N/A";
    } else {
      for (var i = 0; i < latlngs.length - 1; i++) {
        distance += latlngs[i].distanceTo(latlngs[i + 1]);
      }
      return "Distance: " + _round(distance, 2) + " m";
    }
  }
  return null;
};

/**
 * Object created - bind popup to layer, add to feature group
 */
map.on(L.Draw.Event.CREATED, function(event) {
  console.log('draw:created');
  var layer = event.layer;
  // update popup/info window content
  var content = getPopupContent(layer);
  if (content !== null) {
    drawInfo.update('Length', content);
  }
  // render the drawn layer
  drawnItems.addLayer(layer);
  // get coordinates used by GP tools
  var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs();
  drawnPolyline.setLatLngs(latlngs);
  drawnPoint.setLatLng(L.latLng(latlngs[latlngs.length - 1]));
  
  // enable the analyze button
  $('#analyze').prop("disabled", false);
});

/**
 * Object(s) edited - update popups
 */
map.on(L.Draw.Event.EDITED, function(event) {
  console.log('draw:edited');
  var layers = event.layers;
  var content = null;
  layers.eachLayer(function(layer) {
    // update popup/info window content
    content = getPopupContent(layer);
    if (content !== null) {
      drawInfo.update('Length', content);
      //layer.setPopupContent(content);
    } else {
      drawInfo.update('', '');
    }
    // get coordinates used by GP tools
    var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs();
    drawnPolyline.setLatLngs(latlngs);
    drawnPoint.setLatLng(L.latLng(latlngs[latlngs.length - 1]));
  });
  // enable the analyze button
  $('#analyze').prop("disabled", false);
});

map.on('draw:deleted', function (e) {
  console.log('draw:deleted');
  drawInfo.update('','');
  // enable the analyze button
  $('#analyze').prop("disabled", true);
});

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


/*****************************************************************************
 * GEOPROCESSING
 */

/**
 * instantiate the hydropower object
 */
var hp = HydroPowerClass();

/**
 * run the two GP tasks at once
 */
var runGP = function (hp) {
  
  var elevProfileStatus = $.Deferred();
  var elevProfileService = L.esri.GP.service({
    url: "http://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer/Profile",
    useCors: true,
    token: arcgis_token
  });
  var elevProfileTask = elevProfileService.createTask(); 
  
  var watershedStatus = $.Deferred();
  var watershedService = L.esri.GP.service({
    url: "http://hydro.arcgis.com/arcgis/rest/services/Tools/Hydrology/GPServer/Watershed",
    useCors: true,
    token: arcgis_token
  });
  var watershedTask = watershedService.createTask();
  
  /**
   * run the Elevation Profile service
   */
  elevProfileTask.on('initialized', function() {
    // set input parameters
    elevProfileTask.setParam("DEMResolution ", "FINEST");
    elevProfileTask.setParam("ProfileIdField", "OID");
    elevProfileTask.setParam("MaximumSampleDistance", 50000);
    elevProfileTask.setParam("returnZ", true);
    // Input must be an L.LatLng, L.LatLngBounds, L.Marker or GeoJSON Point Line or Polygon object
    elevProfileTask.setParam("InputLineFeatures", drawnPolyline.toGeoJSON());
    // update status
    hp.status.profile = "Elevation initialized. Submitting Request...";
    console.log(hp.status.profile);
    // run the task
    elevProfileTask.run(function(error, result, response) {
      if (error) {
        hp.status.profile = "Elevation Profile: " + error.message + "(code:" + error.code + ")";
        $('#msg-status').html(makeAlert(hp.status.profile, 'danger'));
        console.log(error.details);
        elevProfileStatus.resolve();
      } else {
        // messages
        hp.status.profile = "Elevation Profile: Complete";
        console.log(hp.status.profile);
        console.log(result);
        // update the class
        hp.profile = result;
        // resolve callback
        elevProfileStatus.resolve();
      }
    });
  });

  /**
   * run the Watershed service
   */    
  watershedTask.on('initialized', function() {
    // InputPoints must be an L.LatLng, L.LatLngBounds, L.Marker or GeoJSON Point Line or Polygon object
    watershedTask.setParam("InputPoints", drawnPoint.toGeoJSON());
    watershedTask.setParam("SourceDatabase", "FINEST");
    watershedTask.setParam("PointIDField", "OID");
    watershedTask.setParam("SnapDistance", 500);
    watershedTask.setParam("Generalize", true);
    watershedTask.setParam("ReturnSnappedPoints", false);
    // output parameters (required for an async GP service)
    var outputWatershedArea, outputSnappedPoints;
    watershedTask.setOutputParam("WatershedArea");
    //watershedTask.setOutputParam("SnappedPoints");
    watershedTask.gpAsyncResultParam("WatershedArea", outputWatershedArea);
    //watershedTask.gpAsyncResultParam("SnappedPoints", outputSnappedPoints);
    hp.status.watershed = "Watershed initialized. Submitting Request...";
    console.log(hp.status.watershed);
    $('#analyze').prop("disabled", false);
    
    watershedTask.run(function(error, result, response) {
      //console.log(response);
      if (error) {
        // messages
        hp.status.watershed = "Watershed: " + error.message + "(code:" + error.code + ")";
        console.log(hp.status.watershed);
        console.log(error);
        // update alert
        $('#msg-status').append(makeAlert(hp.status.watershed, 'danger'));
        // resolve callback
        watershedStatus.resolve();
      } else {
        // messages
        hp.status.watershed = "Watershed: Complete";
        console.log(hp.status.watershed);
        console.log(result);
        // update the class
        hp.watershed = result;
        // resolve callback
        watershedStatus.resolve();
      }
    });
  });  
  // return the deferral
  return $.Deferred(function (def) {
    $.when(elevProfileStatus, watershedStatus).done(function () {
      def.resolve();
    });
  });
  
};

var analyzeGPResults = function() {
  //post process the GP service results with these two methods:
  hp.getArea();
  hp.calcHead();
  // add the results to our message area
  $('#msg-text').append('<h4>Area</h4><p>' + hp.area + ' km^2</p>');
  $('#msg-text').append('<h4>Head</h4><p>' + hp.head + ' m</p>');
  // use stored data to run calculation
  hp.calcPower(null,null);
  $('#msg-text').append('<h3>kW</h3><p>' + hp.power + ' m</p>');
  $('#msg-status').html(makeAlert(null,'success'));
  $('#analyze').prop("disabled", false);
};

/*******************************************************************************
 * Analyze Button - Action
 */

$('#analyze').click(function() {  
  /**
   * reset the messages
   */
  $('.analysis-status').show();
  $('#msg-text').html();
  // set tthe status to 
  $('#msg-status').html(makeAlert(null,'info'));
  
  /**
   * print geometries to console
   */
  console.log(drawnPolyline.toGeoJSON());
  console.log(drawnPoint.toGeoJSON());
  
  /**
   * run the geoprocessing tasks, and then analyze the results when done
   */
  runGP(hp).done(analyzeGPResults);
      
});

$(document).on("load", function() {
  console.log("document loaded");
	$("#loading").hide();
});