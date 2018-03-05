/**
 * map.js
 *
 * Sets up the basic Leaflet map and loads relevant contextual layers
 */

/*******************************************************************************
 * configure operational layers
 */

/**
 * **Local** NYS Dams layer
 * The available NYS DEC .kmz service is non-performant, so we've copied the data as geojson for now.
 * In the future this should be re-published as a proper geoservice endpoint.
 */
var layer_dams = L.geoJSON(null, {
    onEachFeature: function(feature, layer) {
        if (feature.properties) {
            var p = feature.properties;
            layer.bindPopup(
                L.Util.template(
                    "<h4>{0}</h4><p>basin: <b>{1}</b></p><p>height: <b>{2} ft.</b></p><p>width: <b>{3} ft.</b></p>", {
                        0: p.name,
                        1: p.BASIN_NAME,
                        2: p.DAM_HEIGHT,
                        3: p.DAM_LENGTH
                    }
                )
            );
        }
    }
});
var layer_dams_clusters = L.markerClusterGroup();
$.getJSON("/static/assets/data/nysdams.geojson", function(data) {
    layer_dams.addData(data);
    layer_dams_clusters.addLayer(layer_dams);
});

var layer_streams = L.esri.dynamicMapLayer({
    url: "https://landscape1.arcgis.com/arcgis/rest/services/USA_NHD_HighRes/MapServer",
    opacity: 0.9,
    token: tokens.arcgis
});
//     .bindPopup(function (err, fC, response) {
//     var count = featureCollection.features.length;
//     var template = "";
//     if (count) {
//         $.each(function (i, v) {
//             template += "";
//         })
//     }
// });

/*******************************************************************************
 * configure basemaps (for custom L.basemap control)
 */

var basemaps = [
    L.esri.basemapLayer("Topographic", {
        label: "Esri Topographic",
        pane: "tilePane"
    }),
    L.esri.basemapLayer("ImageryClarity", {
        label: "Esri Imagery",
        pane: "tilePane"
    }),
    L.tileLayer(
        "https://api.mapbox.com/styles/v1/civicmapper/cj0fflo1b001p2rqf9gisghwo/tiles/256/{z}/{x}/{y}?access_token=" +
        tokens.mapbox, {
            label: "Mapbox Outdoors",
            pane: "tilePane",
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.mapbox.com">Mapbox</a>'
        }
    ),
    L.tileLayer(
        "https://api.mapbox.com/styles/v1/civicmapper/citn32v7h002v2iprmp4xzjkr/tiles/256/{z}/{x}/{y}?access_token=" +
        tokens.mapbox, {
            label: "Mapbox Satellite and Streets",
            pane: "tilePane",
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://www.mapbox.com">Mapbox</a>, &copy; Digital Globe'
        }
    )
];

/*******************************************************************************
 * basemaps (for custom L.basemap control)
 */

var map = L.map("map", {
    maxZoom: 22
}).setView([42.921683, -76.2419582], 7);

map.addControl(
    L.control.basemaps({
        basemaps: basemaps,
        tileX: 0, // tile X coordinate
        tileY: 0, // tile Y coordinate
        tileZ: 1 // tile zoom level
    })
);

L.control
    .layers({}, { "NYS Dams": layer_dams_clusters, "National Hydrography": layer_streams })
    .setPosition("bottomright")
    .addTo(map);

map.addLayer(layer_dams_clusters);

/**
 * add a vector map overlay for labeling. Since vector tiles are not supported
 * with L.esri.webmap natively, and we're using the Leaflet-Basemaps plugin,
 * we need to add/remove this overlay via event listener
 */

// var imageryBasemapLabels = L.esri.Vector.basemap("Hybrid", {
//     pane: "overlayPane"
// });

// map.on("baselayerchange", function(e) {
//     // console.log(e);

//     if (e.options.label == "Esri Imagery") {
//         imageryBasemapLabels.addTo(map);
//         console.log("imageryBasemapLabels pane:", imageryBasemapLabels.getPane());
//     } else {
//         imageryBasemapLabels.removeFrom(map);
//     }
// });

/**
 * create the geocoder/search widget and supporting L.layerGroup
 */
var searchControl = L.esri.Geocoding.geosearch({
    position: "topright"
}).addTo(map);

var searchResults = L.layerGroup().addTo(map);

searchControl.on("results", function(data) {
    searchResults.clearLayers();
    for (var i = data.results.length - 1; i >= 0; i--) {
        var result = L.circleMarker(data.results[i].latlng).bindPopup(
            "<p>" + data.results[i].text + "</p>"
        );
        searchResults.addLayer(result);
        searchResults.openPopup();
    }
});

map.on("click", function(e) {
    searchResults.clearLayers();
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