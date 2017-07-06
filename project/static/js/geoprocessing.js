/*****************************************************************************
 * GEOPROCESSING
 */

/**
 * run the two GP tasks at once
 */
var runGP = function (runWatershed, runProfile) {
  var e = $.Deferred();
  var w = $.Deferred();
  runWatershed = true;
  runProfile = true;
  /**
   * run the Elevation Profile service
   * if runProfile is False, then skip GP, return null
   */
    var elevProfileService = L.esri.GP.service({
      url: "http://elevation.arcgis.com/arcgis/rest/services/Tools/ElevationSync/GPServer/Profile",
      useCors: true,
      token: arcgis_token
    });
    var elevProfileTask = elevProfileService.createTask(); 
    elevProfileTask.on('initialized', function() {
      // set input parameters
      elevProfileTask.setParam("DEMResolution ", "FINEST");
      elevProfileTask.setParam("ProfileIdField", "OID");
      elevProfileTask.setParam("MaximumSampleDistance", 50000);
      elevProfileTask.setParam("returnZ", true);
      // Input must be an L.LatLng, L.LatLngBounds, L.Marker or GeoJSON Point Line or Polygon object
      elevProfileTask.setParam("InputLineFeatures", drawnPolyline.toGeoJSON());
      // update status
      msg = "Determining elevation profile...";
      console.log(msg);
      $('#msg-status-elevprofile').html(makeAlert(msg, 'info'));
      // run the task
      elevProfileTask.run(function(error, result, response) {
        if (error) {
          msg = "Elevation Profile: " + error.message + "(code:" + error.code + ")";
          $('#msg-status-elevprofile').html(makeAlert(msg, 'danger'));
          console.log(error.details);
          e.resolve(error);
        } else {
          // messages
          msg = "Elevation Profile: Complete";
          console.log(msg);
          console.log(result);
          $('#msg-status-elevprofile').html(makeAlert(msg, 'success'));          
          // resolve callback
          e.resolve(result);
        }
      });
    });
  
  /**
   * run the Watershed service
   * if runWatershed is False, then skip GP
   */
    var watershedService = L.esri.GP.service({
      url: "http://hydro.arcgis.com/arcgis/rest/services/Tools/Hydrology/GPServer/Watershed",
      useCors: true,
      token: arcgis_token
    });
    var watershedTask = watershedService.createTask();
    watershedTask.on('initialized', function() {
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
      msg = "Delineating the upstream contributing area...";
      console.log(msg);
      $('#msg-status-watershed').html(makeAlert(msg, 'info'));
      
      watershedTask.run(function(error, result, response) {
        //console.log(response);
        if (error) {
          // messages
          msg = "Watershed: " + error.message + "(code:" + error.code + ")";
          console.log(msg);
          console.log(error);
          // update alert
          $('#msg-status-watershed').html(makeAlert(msg, 'danger'));
          // resolve callback
          w.resolve(error);
        } else {
          // messages
          msg = "Watershed Delineation: Complete";
          $('#msg-status-watershed').html(makeAlert(msg, 'success'));
          console.log(msg);
          console.log(result);
          // resolve callback
          w.resolve(result);
        }
      });
    });
  
  /* when runGP runs, it first hits $.Deferred. The first argument is a function
   * that executes before anything else. That argument is a $.when function,
   * which runs the two functions defined above. When done, the results
   * are passed into a callback function that resolves the whole thing and
   * returns the two results objects from runGP
   */
  var x = $.Deferred(function (def) {
    // elevProfileResult, watershedResult
    $.when(e, w).done(function (eR,wR) {
      def.resolve(eR,wR);
    });
  });
  return x;
};

var analyzeSuccess = function() {
  $('#msg-status').hide();
  $('#msg-text').append('<h2><small>Power:</small>&nbsp;' + hp.power + '&nbsp;<small>kW/year</small></h2>');
  // status, button, and message visibilty
  $('#msg-status-power').html(makeAlert("Power Generation Est.: Complete", 'success'));
  $('#analyze-button-item').html(clearButton);
  $('#msg-text').show();
}

var analyzeGPResults = function(elevProfileResult,watershedResult) {
  // display status
  var msg = "Calculating Power Potential...";
  console.log(msg);
  $('#msg-status-power').html(makeAlert(msg, 'info'));
  // calculate head
  if (elevProfileResult) {
    console.log(elevProfileResult);
    hp.profile = elevProfileResult;
    hp_calcHead();
  }
  $('#msg-text').append('<h3><small>Head:</small>&nbsp;' + _round(hp.head,2) + '&nbsp;<small>meters</small></h3>');
  // calculate area
  if (watershedResult) {
    console.log(watershedResult);
    hp.watershed = watershedResult;
    hp_getArea();
  }
  $('#msg-text').append('<h3><small>Area:</small>&nbsp;' + _round(hp.area, 2) + '&nbsp;<small>km^2</small></h3>');
  // calculate power
  hp_calculatePower();
};