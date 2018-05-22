/**
 * geoControl.js
 *
 * Script for drawing inputs, and using that to derive Head and Area inputs
 * through a geoprocessing service
 */

// Leaflet + Esri-Leaflet
require("leaflet-draw");
var esriLeaflet = require("esri-leaflet");
var esriLeafletGP = require("esri-leaflet-gp");
// TurfJS
var turfExplode = require('@turf/explode');
var turfLineChunk = require('@turf/line-chunk');
var turfLength = require('@turf/length');
var turfCombine = require('@turf/combine');
var turfMeta = require('@turf/meta');
// utilities
var simplifyJS = require('simplify-js');
var utils = require("./utils");

/*******************************************************************************
 * CONSTANTS
 */

// conversion factors
var convertSQKMtoACRES = 247.105381;
var convertSQKMtoSQMI = 0.386102;
var convertMETERStoFEET = 3.280841;
var convertMILEStoFEET = 5280

// for simplifiying elevation profile results (simplify-js params)
var sample_distance = 1 * 0.001 // 1 meter as kilometer
var simplifyTolerance = 0.25;
var simplifyHighQuality = false;

// ArcGIS services
var hiresExtentsService = "https://elevation.its.ny.gov/arcgis/rest/services/DEM_Extents/MapServer/";
var hiresSourcesService = "https://elevation.its.ny.gov/arcgis/rest/services/";
var hiresSourceField = "NAME"

var msg;

/*******************************************************************************
 * DRAWING
 */

// feature group targeted by L.Control.Draw
var drawnItems = L.featureGroup().addTo(map);
global.drawnItems = drawnItems;
// line input for Elevation Profile analysis
var drawnPolyline = L.polyline([]);
// point input used for watershed analysis
var drawnPoint = L.marker();
// results layer for the watershed analysis
// var watershedArea = L.featureGroup();
// map.addLayer(watershedArea);

// implement the drawing control functionality
map.addControl(
    new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        draw: {
            polygon: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false,
            polyline: {
                allowIntersection: true,
                guidelineDistance: 10,
                shapeOptions: {
                    stroke: true,
                    color: "#3388ff",
                    weight: 6,
                    opacity: 0.5,
                    fill: false,
                    clickable: true
                }
            }
        }
    })
);

/**
 * handle drawing post-processing
 */
var drawControl = {
    length: 0,
    /**
     * calculate length
     */
    calcLen: function (layer) {
        if (layer instanceof L.Polyline) {
            var latlngs = layer._defaultShape ?
                layer._defaultShape() :
                layer.getLatLngs();
            var distance = 0;
            if (latlngs.length < 2) {
                return 0;
            } else {
                for (var i = 0; i < latlngs.length - 1; i++) {
                    distance += latlngs[i].distanceTo(latlngs[i + 1]);
                }
                this.length = utils._round(distance, 2);
                return this.length;
            }
        } else {
            return null;
        }
    },
    /**
     * from the layer provided by DRAW event, push results to layers used for
     * GP inputs
     */
    getPointsForGP: function (layer) {
        // if we've come this far, reset the analysis
        resetAnalysis(false, true);
        paramControl.readyToCalc();
        // get coordinates used by GP tools
        var latlngs = layer._defaultShape ?
            layer._defaultShape() :
            layer.getLatLngs();
        drawnPolyline.setLatLngs(latlngs);
        drawnPoint.setLatLng(L.latLng(latlngs[latlngs.length - 1]));
        // dispatch geoprocessing
        gpControl.dispatch(drawnPolyline, drawnPoint);
    },
    /**
     * add drawing listeners to the map
     */
    initDrawListeners: function (map) {
        // Map listener for drawing creation
        map.on(L.Draw.Event.CREATED, function (event) {
            console.log("draw:created");
            // clear previous drawings
            drawnItems.clearLayers();
            // calculate drawing length
            drawControl.calcLen(event.layer);
            // render the drawn layer
            drawnItems.addLayer(event.layer);
            // get coordinates used by GP tools
            drawControl.getPointsForGP(event.layer);
            // enable the analyze button
            //buttonControl.analyze.enable();
            //messageControl.onDrawComplete();
        });
        // map listener for drawing edits
        map.on(L.Draw.Event.EDITED, function (event) {
            console.log("draw:edited");
            event.layers.eachLayer(function (layer) {
                // create message related to drawing
                // calculate drawing length
                drawControl.calcLen(event.layer);
                // get coordinates used by GP tools
                drawControl.getPointsForGP(layer);
            });
            // enable the analyze button
            //buttonControl.analyze.enable();
            //messageControl.onDrawComplete();
        });
        // map listener for drawing deletion
        map.on("draw:deleted", function (e) {
            console.log("draw:deleted");
            resetAnalysis(true, true);
            // remove message related to drawing
            //drawInfo.infoOnDrawDelete();
            // disable the analyze button
            //buttonControl.analyze.reset();
        });
    }
};
global.drawControl = drawControl;

/**
 * geoprocessing controller object
 */

var gpControl = {
    /**
     * store the raw results of the GP services
     */
    raw: {
        watershed: {},
        profile: {}
    },
    reset: function () {
        this.raw = {
            watershed: {},
            profile: {}
        };
    },
    dispatch: function (drawnPolylineObj, drawnPointObj) {
        // run the watershed GP asynchronously
        gpControl.gpWatershed(drawnPointObj);

        // query the index with drawnPoint - this determines what elevation service we use for the profile
        console.log("Checking for local high-res elevation services...")
        esriLeaflet.query({
                url: hiresExtentsService
            })
            .layer(0)
            // find indices that intersect our drawing (the second, upstream point)
            .intersects(drawnPointObj.toGeoJSON())
            // return these fields to us:
            .fields(["NAME", "RESOLUTION", "YEAR", "COLLECTION", "CUSTODIAN", "TIF_NAME", "SQMI"])
            // return the records to us so that highest resolution, newest records are first
            .orderBy("RESOLUTION", "DESC")
            .orderBy("YEAR", "DESC")
            // we don't need geometry though
            .returnGeometry(false)
            // go get it
            .run(function (error, featureCollection, response) {
                // console.log(featureCollection);
                // if there is an error:
                if (error || featureCollection.features.length == 0) {
                    console.log("...no high-resolution elevation data found for this area. Falling back to USGS services.")
                    // use the Esri service
                    gpControl.gpElevProfile(drawnPolylineObj);
                    // otherwise:
                } else {
                    // gpControl.gpElevProfile(drawnPolyline);
                    // if we get results back, then
                    // use the result (name) to query the lidar endpoint
                    var lidarName = featureCollection.features[0].properties[hiresSourceField];
                    var lidarService = hiresSourcesService + lidarName + '/ImageServer';
                    console.log("...found high resolution elevation data @", lidarService);
                    gpControl.queryElevProfile(drawnPolylineObj, lidarService)
                    // split up the polyline based on the lidar service
                    // run multiple queries
                    // return those
                }

            })

    },
    /**
     * Query LiDAR data to generate an elevation profile.
     * This does on the client side what the gpElevProfile function (below) requests
     * be done on the server (more or less), except this way we can use whatever Image 
     * Service we like.
     */
    queryElevProfile: function (drawnPolyline, endpoint) {
        Hydropower.params.head.resetParamStatus();
        jQuery(".gp-msg-head").fadeIn();
        // drawn line to geojson
        var line = drawnPolyline.toGeoJSON()

        // length of line in meters
        var drawingLength = turfLength(line, {
            units: 'kilometers'
        }) * 1000

        console.log("drawingLength:", drawingLength, "meters")

        // chunk up the line at 1 meter intervals
        var chunk = turfLineChunk(line, sample_distance.toFixed(3), {
            units: 'kilometers'
        });
        // turn line chunks endpoints into sample points, and get every other one
        var exploded = turfExplode(chunk);
        var samplePoints = [];
        for (var i = 0; i < exploded.features.length; i++) {
            if (i % 2 === 0) {
                samplePoints.push(exploded.features[i]);
            }
        }
        // console.log(samplePoints);


        // temporary storage for results of chunk analysis,
        // 
        var results = {
            data: [], // used for chart.js-drawn elevation profile
            lineString: [], // use for head calculation
            total: drawingLength // used for chart.js-drawn elevation profile
        };

        // calculate the interval between the sample points
        var samplePointsCount = samplePoints.length;
        console.log("elevation sampled at", samplePointsCount, "points");
        var pingLength = drawingLength / samplePointsCount;
        var lengthIncrement = 0;

        // for each sample
        samplePoints.forEach(function (f, i) {
            esriLeaflet.identifyImage({
                    url: endpoint,
                    useCors: true
                })
                .at([f.geometry.coordinates[1], f.geometry.coordinates[0]])
                .run(function (error, identifyImageResponse, rawResponse) {
                    if (error) {
                        console.log("Elevation Profile: Error getting high resolution data: ", error);
                    } else if (error && Object.keys(results.lineString).length == samplePointsCount) {
                        console.log("Elevation Profile: Error getting high resolution data: ", error);
                        jQuery(".gp-msg-head").fadeOut();
                    } else {
                        // elevation (in meters from service)
                        var elevation = Number(identifyImageResponse.pixel.properties.value)
                        // add to the runningTotal for the drawing length
                        lengthIncrement = lengthIncrement + pingLength;
                        // create a linestring feature with a z value
                        results.lineString.push([f.geometry.coordinates[1], f.geometry.coordinates[0], elevation])
                        // create data point for use in elevation profile (where x/y are in chart space, not coord space)
                        var y = elevation * convertMETERStoFEET;
                        var x = lengthIncrement * convertMETERStoFEET
                        results.data.push({
                            x: Number(x.toFixed(2)),
                            y: Number(y.toFixed(2))
                        })
                        // if we've queried all the points, then we create our final result.
                        if (Object.keys(results.lineString).length == samplePointsCount) {
                            // elevation profile is a geojson object
                            // (same as the elev profile GP service result)
                            // store properties from our results object (above) here
                            var result = {
                                "type": "FeatureCollection",
                                "features": [{
                                    "type": "Feature",
                                    "geometry": {
                                        "type": "LineString",
                                        // expected for head calculation
                                        "coordinates": results.lineString
                                    },
                                    "properties": {
                                        "OBJECTID": 1,
                                        "DEMResolution": "",
                                        "ProductName": "",
                                        "Source": "",
                                        "Source_URL": endpoint,
                                        // convert from miles to feet:
                                        "ProfileLength": results.total, // * convertMILEStoFEET,
                                        // store x/y charting data points:
                                        "ChartData": results.data
                                    },
                                    "id": 1
                                }]
                            }
                            // messages
                            msg = "High Resolution Elevation Profile: Complete";
                            console.log(msg, result);
                            // save the result, applying unit conversion in the process
                            gpControl.setHead(result, convertMETERStoFEET);
                            paramControl.onGPComplete();
                            jQuery(".gp-msg-head").fadeOut();
                            // console.log("queryElevProfile", results);
                            return;
                        }
                    }
                });
        });
        return null;
    },
    /**
     * Elevation Profile geoprocessing service.
     * @param L.Layer drawnPolyline the polyline drawn with Leaflet.Draw
     */
    gpElevProfile: function (drawnPolylineObj) {
        Hydropower.params.head.resetParamStatus();
        jQuery(".gp-msg-head").fadeIn();
        var elevProfileService = esriLeafletGP.service({
            url: "http://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer/Profile",
            useCors: true,
            token: tokens.arcgis
        });
        var elevProfileTask = elevProfileService.createTask();
        elevProfileTask.on("initialized", function () {
            // set input parameters
            elevProfileTask.setParam("DEMResolution", "FINEST");
            elevProfileTask.setParam("ProfileIdField", "OID");
            elevProfileTask.setParam("MaximumSampleDistance", 100);
            elevProfileTask.setParam("returnZ", true);
            // Input must be an L.LatLng, L.LatLngBounds, L.Marker or GeoJSON Point Line or Polygon object
            var line = drawnPolylineObj.toGeoJSON();

            // // this service can only take 
            // var drawingLength = turfLength(line, {
            //     units: 'kilometers'
            // }) * 1000
            // var sampleInterval = 10 * 0.001
            // if (drawingLength >= 1000) {

            // }
            // chunk it up at 10m intervals
            var chunked = turfLineChunk(line, sample_distance.toFixed(3), {
                units: 'kilometers'
            });
            // console.log(chunked);
            // turn those chunks back into a single line with many vertices
            var combined = turfCombine(chunked);
            // console.log(combined)
            // pass that in as a parameter
            elevProfileTask.setParam("InputLineFeatures", combined);
            // update status
            var msg = "Determining elevation profile...";
            console.log(msg);
            //messageControl.messages.elevprofile.addMsg(msg, 'info');
            //jQuery('#'+messageControl.messages.elevprofile.id).show();
            // run the task
            elevProfileTask.run(function (error, result, response) {
                jQuery(".gp-msg-head").fadeOut();
                if (error) {
                    // messages
                    msg =
                        "Elevation Profile: " + error.message + "(code:" + error.code + ")";
                    console.log(msg, error.details);
                    //paramsControl.notifications.addMsg(msg,'danger');
                    Hydropower.params.head.setOnForm();
                } else {
                    // generate data for the chart from the result.
                    var chartData = [];
                    var lengthTotal = 0;
                    turfMeta.coordEach(result.OutputProfile, function (cc, ci, fi, mfi, gi) {
                        // create data point for use in elevation profile (where x/y are in chart space, not coord space)
                        var y = cc[2] * convertMETERStoFEET;
                        lengthTotal += (1 * convertMETERStoFEET);
                        chartData.push({
                            x: Number(lengthTotal.toFixed(2)),
                            y: Number(y.toFixed(2))
                        })
                    })
                    result.OutputProfile.features[0].properties.ChartData = chartData;
                    // messages
                    msg = "Elevation Profile: Complete";
                    console.log(msg, result);
                    //paramsControl.notifications.addMsg(msg,'success');
                    // save the result, applying unit conversion in the process
                    gpControl.setHead(result.OutputProfile, convertMETERStoFEET);
                    paramControl.onGPComplete();
                }
            });
        });
    },
    /**
     * Watershed delineation geoprocessing service.
     * @param L.Layer drawnPoint a point from which to start delineation (second point in our case)
     */
    gpWatershed: function (drawnPoint) {
        Hydropower.params.area.resetParamStatus();
        jQuery(".gp-msg-area").fadeIn();
        //Hydropower.params.area.setOnForm('Calculating...');
        var watershedService = esriLeafletGP.service({
            url: "http://hydro.arcgis.com/arcgis/rest/services/Tools/Hydrology/GPServer/Watershed",
            useCors: true,
            token: tokens.arcgis
        });
        var watershedTask = watershedService.createTask();
        watershedTask.on("initialized", function () {
            // InputPoints must be an L.LatLng, L.LatLngBounds, L.Marker or GeoJSON Point Line or Polygon object
            watershedTask.setParam("InputPoints", drawnPoint.toGeoJSON());
            watershedTask.setParam("SourceDatabase", "FINEST");
            watershedTask.setParam("PointIDField", "OID");
            watershedTask.setParam("SnapDistance", 500);
            watershedTask.setParam("Generalize", true);
            watershedTask.setParam("ReturnSnappedPoints", false);
            // output parameters (required for an async GP service)
            var outputWatershedArea;
            watershedTask.setOutputParam("WatershedArea");
            watershedTask.gpAsyncResultParam("WatershedArea", outputWatershedArea);
            //var outputSnappedPoints;
            //watershedTask.setOutputParam("SnappedPoints");
            //watershedTask.gpAsyncResultParam("SnappedPoints", outputSnappedPoints);

            var msg = "Delineating the upstream contributing area...";
            console.log(msg);
            //messageControl.messages.watershed.addMsg(msg, 'info');
            //jQuery('#'+messageControl.messages.watershed.id).show();
            watershedTask.run(function (error, result, response) {
                jQuery(".gp-msg-area").fadeOut();
                // show the message window
                if (error) {
                    // messages
                    msg = "Watershed: " + error.message + "(code:" + error.code + ")";
                    console.log(msg, error.details);
                    //paramsControl.notifications.addMsg(msg,'danger');
                    Hydropower.params.area.setOnForm();
                } else {
                    // messages
                    msg = "Watershed Delineation: Complete";
                    console.log(msg, result);
                    //paramsControl.notifications.addMsg(msg,'success');
                    // save the result
                    // save the result, applying unit conversion in the process
                    gpControl.setArea(result.WatershedArea, convertSQKMtoSQMI);
                    paramControl.onGPComplete();
                }
            });
        });
    },
    /**
     * Given output from ESRI Elevation Profile service, store it and calculate
     * head. Called upon successful execution of GP.
     */
    setHead: function (gpOutputProfile, conversion_factor) {
        this.raw.profile = gpOutputProfile;
        // use the helper function to calc head from the Esri results
        var h = this._calcHead(this.raw.profile, convertMETERStoFEET);
        // var h2;
        // apply the converstion factor
        var h2 = h * conversion_factor;
        // if (h < 0) {
        //     h2 = h * conversion_factor * -1;
        // } else {
        //     h2 = h * conversion_factor;
        // }
        // console.log(h2);
        // set the value (performs validation)
        Hydropower.params.head.setValue(utils._round(h2, 2));
        return Hydropower.params.head.value;
    },
    /**
     * Given output from ESRI Watershed service, store it and extract area.
     * Called upon successful execution of GP.
     */
    setArea: function (gpOutputWatershed, conversion_factor) {
        this.raw.watershed = gpOutputWatershed;
        // use the helper function to get area from the Esri results
        var w = this._getArea(this.raw.watershed, conversion_factor);
        // apply the converstion factor
        var w2 = w * conversion_factor;
        console.log(w2);
        // set the value (performs validation)
        Hydropower.params.area.setValue(utils._round(w2, 2));
        return Hydropower.params.area.value;
    },
    /**
     * customer getter function for Head
     */
    getHead: function (i) {
        var h = this._calcHead(this.raw.profile, convertMETERStoFEET);
        // console.log("using custom getter: getHead");
        if (h) {
            // set the value (performs validation)
            i.setValue(utils._round(h, 2));
            //console.log(h, i.value);
            return i.value;
        } else {
            return false;
        }
    },
    /**
     * customer getter function for Area
     */
    getArea: function (i) {
        // use the helper function to get area from the Esri results
        var a = this._getArea(this.raw.watershed, convertSQKMtoSQMI);
        // console.log("using custom getter: getArea");
        if (a) {
            // set the value (performs validation)
            i.setValue(utils._round(a, 2));
            //console.log(a, i.value);
            return i.value;
        } else {
            return false;
        }
    },
    /**
     * Calculate head from the ESRI Elevation Profile service result object.
     */
    _calcHead: function (gpOutputProfile, conversion_factor) {
        if (!jQuery.isEmptyObject(gpOutputProfile)) {
            //console.log("Calculating head from", gpOutputProfile);
            // get the first line from the result object
            var line = gpOutputProfile.features[0];
            // get the coords from the line
            var coords = line.geometry.coordinates;
            // get the z values from the first and last coordinate
            var firstZ = coords[0][2];
            var lastZ = coords[coords.length - 1][2];
            // save the difference
            var h = Math.abs(lastZ - firstZ);
            console.log("Head:", h, "meters");
            return h * conversion_factor;
        } else {
            //console.log("no elevation profile has been created");
            return false;
        }
    },
    /**
     * Extract the area value from the ESRI Watershed service result object
     */
    _getArea: function (gpOutputWatershed, conversion_factor) {
        if (!jQuery.isEmptyObject(gpOutputWatershed)) {
            //console.log("Getting area from", gpOutputWatershed);
            // area (as square clicks) is buried in the result object. get it and convert
            var w = gpOutputWatershed.features[0].properties.AreaSqKm;
            // var result = utils._round(w, 2);
            // console.log("Area:", w, "square kilometers");
            return w * conversion_factor;
        } else {
            //console.log("no watershed has been delineated");
            return false;
        }
    },
    /**
     * generate a visualization of the elevation profile results
     */
    vizHead: function () {
        // console.log("vizHead", this.raw.profile);
        if (!jQuery.isEmptyObject(this.raw.profile)) {
            // add the control to the map that contains the chart element.
            if (!profileControl.getContainer()) {
                console.log("added profile control to map")
                profileControl.addTo(map);
            }
            // then add the data. this method updates the chart
            if (profileControl.getContainer()) {
                var simplifiedChartData = simplifyJS(this.raw.profile.features[0].properties.ChartData, simplifyTolerance, simplifyHighQuality);
                console.log("adding data to profile control (simplified to", simplifiedChartData.length, "points)");
                profileControl.addData(simplifiedChartData);
            }
        }

    },
    /**
     * generate a visualization of the watershed delineation
     */
    vizArea: function () {
        // console.log("vizArea", this.raw.watershed);
        if (!jQuery.isEmptyObject(this.raw.watershed)) {
            watershedArea.clearLayers();
            watershedArea.addLayer(L.geoJSON(this.raw.watershed));
        }
    }
};
global.gpControl = gpControl;