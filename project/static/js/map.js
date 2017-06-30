/**
 * map.js
 *
 * set up the Leaflet map. includes layers and drawing functions
 */

/*******************************************************************************
 * create map with basemap and supplemental layers
 */
var map = L.map('map', {
  maxZoom : 22
})
  .setView([42.0170202, -73.9144284], 18);

var layer_streams = L.esri.featureLayer({
  url: "https://services.arcgis.com/vT1c5Cjxbz2EbiZw/arcgis/rest/services/BardMicroHydro/FeatureServer/7",
}).addTo(map);

var layer_dams = L.esri.featureLayer({
  url: "https://services.arcgis.com/vT1c5Cjxbz2EbiZw/arcgis/rest/services/BardMicroHydro/FeatureServer/1",
}).addTo(map);
  
/**
  * add a vector map overlay for labeling (vector tiles are not supported
  * with L.esri.webmap natively, so we do it here instead)
  *
L.esri.Vector.basemap('Hybrid').addTo(map);
*/

//L.esri.basemapLayer('Imagery').addTo(map);
/*
var webmap = L.esri.webMap('c7bad780627d4175abc7174278f69308', {map: map});

/**
 * do some things with the layers loads into the webmap object when it's loaded.
 *
webmap.on('load', function() {
   // store a list of layers from the webmap
    var overlayMaps = {};
    
    // iterate over layers the webmap
    webmap.layers.map(function(layer) {
      //store a list of layers from the webmap
      overlayMaps[layer.title] = layer.layer;
      
      if (layer.type == "TML") {
        layer.layer.options.maxZoom = 22;
        layer.layer.options.maxNativeZoom = 18;          
        }
    });
    L.control.layers({}, overlayMaps, {
        position: 'bottomleft'
    }).addTo(webmap._map);
});

console.log(map.getPanes());
*/

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
  position: 'topright'
});

// method that we will use to update the control based on feature properties passed
drawInfo.update = function(title, props) {
  var msgStart = '<p class="small">To begin, draw a line from a<br>point downstream to a point<br> upstream of where you would <br>locate a micro-hydro installation.<p>';
  this._div.innerHTML = (title ? '<p>' + title + '</p>' : msgStart) + (props ? '<p>' + props + '</p>' : '');
};
// method used to append to the control based on feature properties passed
drawInfo.append = function(title, props) {
  this._div.innerHTML += (title ? '<p>' + title + '</p>' : msgStart) + (props ? '<p>' + props + '</p>' : '');
};

drawInfo.onAdd = function(map) {
  this._div = L.DomUtil.create('div', 'drawInfo');
  this.update();
  return this._div;
};

drawInfo.addTo(map);


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
      return "N/A";
    } else {
      for (var i = 0; i < latlngs.length - 1; i++) {
        distance += latlngs[i].distanceTo(latlngs[i + 1]);
      }
      return _round(distance, 2) + " m";
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
    drawInfo.update('Length: ' + content, "<p>Complete the calculation by <br> with the 'calculate' button.</p>");
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
      drawInfo.update('Length: ' + content, "Complete the calculation by clicking an option above.");
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