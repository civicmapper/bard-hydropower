/**
 * map.js
 *
 * Sets up the basic Leaflet map and loads relevant contextual layers
 */

require("leaflet.markercluster");
require("leaflet-basemaps");
var esri = require("esri-leaflet");
var geocoding = require("esri-leaflet-geocoder");
var epc = require("./profileControl");

/*******************************************************************************
 * configure operational layers
 */

/**
 * **Local** NYS Dams layer
 * The available NYS DEC .kmz service is non-performant, so we've copied the data as geojson for now.
 * In the future this should be re-published as a proper geoservice endpoint.
 */
var layer_dams = L.geoJSON(null, {
    pointToLayer: function (point, latlng) {
        return L.circleMarker(latlng, {
            radius: 4,
            fillColor: "#fff",
            fillOpacity: 1,
            color: "#2baae2",
            weight: 6,
            opacity: 0.5
        });
    },
    onEachFeature: function (feature, layer) {
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
/**
 * ClusterGroup layer for Dams (handles visual clustering)
 */
var layer_dams_clusters = L.markerClusterGroup({
    polygonOptions: {
        color: "#2baae2",
        opacity: 0.6,
        fillColor: "#2baae2",
        fillOpacity: 0.2
    }
});
/**
 * asynchronous retrieval of dams data.
 */
jQuery.getJSON("/static/assets/data/nysdams.geojson", function (data) {
    layer_dams.addData(data);
    layer_dams_clusters.addLayer(layer_dams);
});

/**
 * National Hydrographic Dataset (this from Esri's AGOL premium service; requires token.)
 */
var layer_streams = esri.dynamicMapLayer({
    url: "https://landscape1.arcgis.com/arcgis/rest/services/USA_NHD_HighRes/MapServer",
    opacity: 0.9,
    token: tokens.arcgis
});

/**
 * hold geocoding results here
 */
var searchResults = L.layerGroup();

/**
 * watershed area polygon. place holder for watershed results.
 */
var watershedArea = L.featureGroup();
global.watershedArea = watershedArea;

/*******************************************************************************
 * configure basemaps (for custom L.basemap control)
 */

var basemaps = [
    esri.basemapLayer("Topographic", {
        label: "Esri Topographic",
        pane: "tilePane"
    }),
    esri.basemapLayer("Imagery", {
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
 * map configuration
 */
var map = L.map("map", {
    maxZoom: 22
    // }).setView([42.921683, -76.2419582], 7);
}).setView([42.0169164, -73.9141064], 18);
// so map variable can be accessed in other modules:
global.map = map;

/**
 * add layers
 */
map.addLayer(layer_dams_clusters);
// map.addLayer(watershedArea);
map.addLayer(searchResults);

/**
 * add controls
 */
map.addControl(
    // custom basemap control
    L.control.basemaps({
        basemaps: basemaps,
        tileX: 0, // tile X coordinate
        tileY: 0, // tile Y coordinate
        tileZ: 1 // tile zoom level
    })
);
// layer control
map.addControl(
    L.control
    .layers({}, {
        "NYS Dams": layer_dams_clusters,
        "National Hydrography": layer_streams,
        "Delineated Watershed": watershedArea
    })
    .setPosition("bottomright")
);
// geocoding conrol
map.addControl(
    geocoding
    .geosearch({
        position: "topright"
    })
    .on("results", function (data) {
        searchResults.clearLayers();
        for (var i = data.results.length - 1; i >= 0; i--) {
            var result = L.circleMarker(data.results[i].latlng).bindPopup(
                "<p>" + data.results[i].text + "</p>"
            );
            searchResults.addLayer(result);
            result.openPopup();
        }
    })
);

/**
 * establish controls to be added later
 */

// profile control gets created here, but only added to the map and populated w/
// data *after geoprocessing*, and removed from map on reset. 
var profileControl = epc.elevationProfileControl();
global.profileControl = profileControl;

/*******************************************************************************
 * map listeners
 */
map.on("click", function (e) {
    searchResults.clearLayers();
});