/**
 * map.js
 *
 * Sets up the basic Leaflet map and loads relevant contextual layers
 */

/*******************************************************************************
 * create map with basemap and supplemental layers
 */
var map = L.map("map", {
    maxZoom: 22
}).setView([42.921683, -76.2419582], 7);

var layer_streams = L.esri
    .featureLayer({
        url: "https://services.arcgis.com/vT1c5Cjxbz2EbiZw/arcgis/rest/services/BardMicroHydro/FeatureServer/7"
    })
    .addTo(map);

var layer_dams = L.esri
    .featureLayer({
        url: "https://services.arcgis.com/vT1c5Cjxbz2EbiZw/arcgis/rest/services/BardMicroHydro/FeatureServer/1"
    })
    .addTo(map);

/**
 * add a vector map overlay for labeling (vector tiles are not supported
 * with L.esri.webmap natively, so we do it here instead)
 */
L.esri.basemapLayer("Imagery").addTo(map);
L.esri.Vector.basemap("Hybrid").addTo(map);

/**
 * create the geocoder/search widget and supporting L.layerGroup
 */
var searchControl = L.esri.Geocoding.geosearch({ position: "topright" }).addTo(
    map
);

var results = L.layerGroup().addTo(map);

searchControl.on("results", function(data) {
    results.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
        var result = L.circleMarker(data.results[i].latlng).bindPopup(
            "<p>" + data.results[i].text + "</p>"
        );
        results.addLayer(result);
        result.openPopup();
    }
});

map.on("click", function(e) {
    results.clearLayers();
});

/**
 * build the map from an AGOL web map, then do some things with the layers
 * loads into the webmap object when it's loaded.
 */
//var webmap = L.esri.webMap('c7bad780627d4175abc7174278f69308', {map: map});
// webmap.on('load', function() {
//    // store a list of layers from the webmap
//     var overlayMaps = {};

//     // iterate over layers the webmap
//     webmap.layers.map(function(layer) {
//       //store a list of layers from the webmap
//       overlayMaps[layer.title] = layer.layer;

//       if (layer.type == "TML") {
//         layer.layer.options.maxZoom = 22;
//         layer.layer.options.maxNativeZoom = 18;
//         }
//     });
//     L.control.layers({}, overlayMaps, {
//         position: 'bottomleft'
//     }).addTo(webmap._map);
// });

// console.log(map.getPanes());