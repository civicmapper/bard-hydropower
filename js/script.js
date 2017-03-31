  /**
   * Authentication
   */
  var clientID = 'Rl33Ikhm8yr4xlz4';
  var accessToken;
  var callbacks = [];
  var protocol = window.location.protocol;
  //var callbackPage = protocol + '//esri.github.io/esri-leaflet/examples/oauth/callback.html';
  //var callbackPage = 'http://esri.github.io/esri-leaflet/examples/oauth/callback.html';
  var callbackPage = protocol + '//localhost:8000';

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
  


/**
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


/**
 * add drawing controls and drawing layer
 */
// store geometry for display on the map.
var drawnItems = L.featureGroup().addTo(map);
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
 * Truncate value based on number of decimals
 */
var _round = function(num, len) {
  return Math.round(num * (Math.pow(10, len))) / (Math.pow(10, len));
};

/**
 * Generate popup content - Returns HTML string, or null if unknown object
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
 * Info Control - takes a the place of a pop-up
 */
var selectionInfo = L.control({
  position: 'topright'
});
selectionInfo.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'selectionInfo');
  this.update();
  return this._div;
};
// method that we will use to update the control based on feature properties passed
selectionInfo.update = function(title, props) {
  this._div.innerHTML = (title ? '<h4>' + title + '</h4>' : 'Draw a Line') + (props ? '<strong>' + props + '</strong>' : '');
};

selectionInfo.addTo(map);

var drawnPolyline = L.polyline([]);
var drawnPoint = L.marker();

/**
 * Object created - bind popup to layer, add to feature group
 */
map.on(L.Draw.Event.CREATED, function(event) {
  console.log('draw:created');
  var layer = event.layer;
  latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs();
  drawnPolyline.setLatLngs(latlngs);
  drawnPoint.setLatLng(L.latLng(latlngs[latlngs.length - 1]));
  var content = getPopupContent(layer);
  if (content !== null) {
    selectionInfo.update('Length', content);
  }
  drawnItems.addLayer(layer);
});

/**
 * Object(s) edited - update popups
 */
map.on(L.Draw.Event.EDITED, function(event) {
  console.log('draw:edited');
  var layers = event.layers,
    content = null;
  layers.eachLayer(function(layer) {
    content = getPopupContent(layer);
    latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs();
    drawnPolyline.setLatLngs(latlngs);
    drawnPoint.setLatLng(L.latLng(latlngs[latlngs.length - 1]));
    if (content !== null) {
      selectionInfo.update('Length', content);
      //layer.setPopupContent(content);
    }
  });
});

$('#analyze').click(function() {

  /**
   * print geometries to console
   */
  console.log(drawnPolyline.toGeoJSON());
  console.log(drawnPoint.toGeoJSON());
  /**
   * set up services
   */  
  var watershedService, elevProfileService, watershed, elevProfile;
  
  /**
   * set up the geoprocessing services and tasks
   */
  elevProfileService = L.esri.GP.service({
    url: "http://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer/Profile",
    useCors: true
  });
  elevProfile = elevProfileService.createTask();
  
  oauth(function(token){
    
    watershedService = L.esri.GP.service({
      url: "http://hydro.arcgis.com/arcgis/rest/services/Tools/Hydrology/GPServer/Watershed",
      useCors: true,
      token: token
    });
    
    watershedService.on('authenticationrequired', function(e){
      oauth(function(token){
        e.authenticate(token);
        watershed = watershedService.createTask();
        
        /*
        elevProfile.on('initialized', function() {
          elevProfile.setParam("DEMResolution ", "FINEST");
          elevProfile.setParam("ProfileIdField", "OID");
          elevProfile.setParam("MaximumSampleDistance", 50000);
          elevProfile.setParam("returnZ", true);
          // Input must be an L.LatLng, L.LatLngBounds, L.Marker or GeoJSON Point Line or Polygon object
          elevProfile.setParam("InputLineFeatures", drawnPolyline.toGeoJSON());
          
          console.log("Elevation initialized. Submitting Request...");
          $('#gpmessages').show();
          
          elevProfile.run(function(error, result, response) {
            $('#gpmessages').hide();
            console.log(response);
            if (error) {
              $('#gperror').show();
              console.log("There was an error processing your request. Please try again.");
              console.log(error);
            } else {
              $('#gpsuccess').show();
              console.log("Elevation Profile complete!");
              console.log(result);
            }
          });
          
        });
        */
        console.log(watershed);
        watershed.on('initialized', function() {
          watershed.setParam("SourceDatabase", "FINEST");
          watershed.setParam("PointIDField", "OID");
          watershed.setParam("SnapDistance", 50);
          watershed.setParam("ReturnSnappedPoints", true);
          // Input must be an L.LatLng, L.LatLngBounds, L.Marker or GeoJSON Point Line or Polygon object
          watershed.setParam("InputPoints", drawnPoint.toGeoJSON());
          
          console.log("Watershed initialized. Submitting Request...");
          $('#gpmessages').show();
          
          watershed.run(function(error, result, response) {
            $('#gpmessages').hide();
            console.log(response);
            if (error) {
              $('#gperror').show();
              console.log("There was an error processing your request. Please try again.");
              console.log(error);
            } else {
              $('#gpsuccess').show();
              console.log("Watershed complete!");
              console.log(result);
            }
          });
          
        });
        
        
      });
    });
    
  });

    

  /*
  function getToken() {
    console.log("authorizing...");
    $.ajax({
      type: 'POST',
      //url: 'https://www.arcgis.com/sharing/rest/oauth2/token/',
      url: 'https://hydro.arcgis.com/arcgis/rest',
      data: {
        'f': 'json',
        'client_id': 'Rl33Ikhm8yr4xlz4',
        'client_secret': '6f298cc008464a718f30366ecd85e5cb',
        'grant_type': 'client_credentials',
        'expiration': '1440'
      },
      succes: runGP1
    });
  }
  */


  //getToken();


});