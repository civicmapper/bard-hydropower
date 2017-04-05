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


/*******************************************************************************
 * create map with basemap and supplemental layers
 */
var map = L.map('map').setView([42.0170202, -73.9144284], 18);

L.esri.basemapLayer('Imagery').addTo(map);
//L.esri.Vector.basemap('Hybrid').addTo(map);

var layer_streams = L.esri.featureLayer({
  url: "https://services.arcgis.com/vT1c5Cjxbz2EbiZw/arcgis/rest/services/BardMicroHydro/FeatureServer/7",
}).addTo(map);

var layer_dams = L.esri.featureLayer({
  url: "https://services.arcgis.com/vT1c5Cjxbz2EbiZw/arcgis/rest/services/BardMicroHydro/FeatureServer/1",
}).addTo(map);


/*******************************************************************************
 * add drawing controls and drawing layer
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

/*******************************************************************************
 * Helper: truncate value based on number of decimals
 */
var _round = function(num, len) {
  return Math.round(num * (Math.pow(10, len))) / (Math.pow(10, len));
};

/*******************************************************************************
 * Info Control (takes a the place of a pop-up)
 */
var statusInfo = L.control({
  position: 'topright'
});

// method that we will use to update the control based on feature properties passed
statusInfo.update = function(title, props) {
  this._div.innerHTML = (title ? '<h4>' + title + '</h4>' : 'Draw a Line') + (props ? '<strong>' + props + '</strong>' : '');
};
// method used to append to the control based on feature properties passed
statusInfo.append = function(title, props) {
  this._div.innerHTML += (title ? '<h4>' + title + '</h4>' : 'Draw a Line') + (props ? '<strong>' + props + '</strong>' : '');
};

statusInfo.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'statusInfo');
  this.update();
  return this._div;
};

statusInfo.addTo(map);

/*******************************************************************************
 * Analyze Button - Control
 */

var analyzeControl = L.control({
  position: 'topright'
});

analyzeControl.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'analyzeControl');
  this._div.innerHTML = '<button id="analyze" class="btn btn-primary btn-xs" type="submit" disabled>Calculate Power</button>';  
  return this._div;
};

analyzeControl.addTo(map);

/*******************************************************************************
 * Analyze Button - Control
 */

var analyzeResults = L.control({
  position: 'topright'
});

analyzeResults.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'analyzeControl');
  this._div.innerHTML = '';  
  return this._div;
};

// method used to append to the control based on feature properties passed
analyzeResults.append = function(title, props) {
  this._div.innerHTML += (title ? '<h4>' + title + '</h4>' : 'Draw a Line') + (props ? '<strong>' + props + '</strong>' : '');
};



/*******************************************************************************
 * Generate popup content for drawing
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

/*******************************************************************************
 * Object created - bind popup to layer, add to feature group
 */
map.on(L.Draw.Event.CREATED, function(event) {
  console.log('draw:created');
  analyzeResults.remove();
  var layer = event.layer;
  // update popup/info window content
  var content = getPopupContent(layer);
  if (content !== null) {
    statusInfo.update('Length', content);
  }
  // render the drawn layer
  drawnItems.addLayer(layer);
  // get coordinates used by GP tools
  var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs();
  drawnPolyline.setLatLngs(latlngs);
  drawnPoint.setLatLng(L.latLng(latlngs[latlngs.length - 1]));
  
  // enable the analyze button
  $('#analyze').prop("disabled", false);
  analyzeResults.remove();
});

/*******************************************************************************
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
      statusInfo.update('Length', content);
      //layer.setPopupContent(content);
    } else {
      statusInfo.update('', '');
    }
    // get coordinates used by GP tools
    var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs();
    drawnPolyline.setLatLngs(latlngs);
    drawnPoint.setLatLng(L.latLng(latlngs[latlngs.length - 1]));
  });
  // enable the analyze button
  $('#analyze').prop("disabled", false);
  analyzeResults.remove();
});

map.on('draw:deleted', function (e) {
  console.log('draw:deleted');
  statusInfo.update('','');
  // enable the analyze button
  $('#analyze').prop("disabled", true);
});

/*******************************************************************************
 * Analyze Button - Action
 */
$('#analyze').click(function() {
  
  /**
   * Update the controls
   */
  statusInfo.update('Analyzing...', 'Calculating elevation differential and contributing area.' );
  analyzeResults.remove();
  // disable the button to avoid multiple requests.
  $('#analyze').prop("disabled", true);
  
  /**
   * print geometries to console
   */
  console.log(drawnPolyline.toGeoJSON());
  console.log(drawnPoint.toGeoJSON());
  
  /**
   * set up the geoprocessing services and tasks
   */
  
  var watershedService, elevProfileService, watershed, elevProfile;
  
  elevProfileService = L.esri.GP.service({
    url: "http://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer/Profile",
    useCors: true,
    token: arcgis_token
  });
  elevProfile = elevProfileService.createTask();
  
  watershedService = L.esri.GP.service({
    url: "http://hydro.arcgis.com/arcgis/rest/services/Tools/Hydrology/GPServer/Watershed",
    useCors: true,
    token: arcgis_token
  });
  watershed = watershedService.createTask();
  

  
  /**
   * run the Elevation Profile service
   */        
  elevProfile.on('initialized', function() {
    elevProfile.setParam("DEMResolution ", "FINEST");
    elevProfile.setParam("ProfileIdField", "OID");
    elevProfile.setParam("MaximumSampleDistance", 50000);
    elevProfile.setParam("returnZ", true);
    // Input must be an L.LatLng, L.LatLngBounds, L.Marker or GeoJSON Point Line or Polygon object
    elevProfile.setParam("InputLineFeatures", drawnPolyline.toGeoJSON());
    
    console.log("Elevation initialized. Submitting Request...");
    
    elevProfile.run(function(error, result, response) {
      $('#analyze').prop("disabled", false);
      //$('#gpmessages').show();
      if (error) {
        //$('#gperror').show();
        console.log("Elevation Profile: " + error.message + "(code:" + error.code + ")");
        console.log(error.details);
      } else {
        //$('#gpsuccess').show();
        console.log("Elevation Profile: Complete");
        console.log(result);
        
        /**
         * Create the line used in the profile visualization
        var elevProfileLine = result.OutputProfile.features;
        var el = L.control.elevation().addTo(map);
        L.geoJson(elevProfileLine,{
          onEachFeature: el.addData.bind(el)
        });.addTo(map);
        */
        
        analyzeResults.append("Height", "Elevation Profile Result here.");
        
      }
    });
  });

  /**
   * run the Watershed service
   */    
  watershed.on('initialized', function() {
    // InputPoints must be an L.LatLng, L.LatLngBounds, L.Marker or GeoJSON Point Line or Polygon object
    watershed.setParam("InputPoints", drawnPoint.toGeoJSON());
    watershed.setParam("SourceDatabase", "FINEST");
    watershed.setParam("PointIDField", "OID");
    watershed.setParam("SnapDistance", 500);
    watershed.setParam("Generalize", true);
    watershed.setParam("ReturnSnappedPoints", false);
    // output parameters (required for an async GP service)
    var outputWatershedArea, outputSnappedPoints;
    watershed.setOutputParam("WatershedArea");
    //watershed.setOutputParam("SnappedPoints");
    watershed.gpAsyncResultParam("WatershedArea", outputWatershedArea);
    //watershed.gpAsyncResultParam("SnappedPoints", outputSnappedPoints);
    
    console.log("Watershed initialized. Submitting Request...");
    $('#analyze').prop("disabled", false);
    //$('#gpmessages').show();
    
    watershed.run(function(error, result, response) {
      //$('#gpmessages').hide();
      console.log(response);
      if (error) {
        //$('#gperror').show();
        console.log("Watershed: " + error.message + "(code:" + error.code + ")");
        console.log(error.details);
      } else {
        //$('#gpsuccess').show();
        console.log("Watershed: Complete");
        console.log(result);
        
        area = result.WatershedArea.features[0].properties.AreaSqKm;
        /*
        var watershedArea = L.featureGroup();
        map.addLayer(watershedArea);
        watershedArea.addLayer(L.geoJSON(result.WatershedArea));
        */
        analyzeResults.append("Area", _round(area,2) + " km^2");
        
      }
    }); 
  });
  
  // add results to map
  analyzeResults.addTo(map);
  statusInfo.remove();
      
});