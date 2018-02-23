/**
 * map.js
 *
 * Sets up the basic Leaflet map and loads relevant contextual layers
 */

/*******************************************************************************
 * create map with basemap and supplemental layers
 */
var map = L.map('map', {
        maxZoom: 22
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
 */
L.esri.Vector.basemap('Hybrid').addTo(map);
//*/

L.esri.basemapLayer('Imagery').addTo(map);

//var webmap = L.esri.webMap('c7bad780627d4175abc7174278f69308', {map: map});

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
//*/