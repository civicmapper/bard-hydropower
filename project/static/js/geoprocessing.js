/*****************************************************************************
 * GEOPROCESSING
 */

/**
 * run the two GP tasks at once
 */
var runGP = function () {
  var e = $.Deferred();
  var w = $.Deferred();

  /**
   * run the Elevation Profile service
   */
  //function runElevProfileGP() {
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
  //}

  /**
   * run the Watershed service
   */
  //function runWatershedGP () {
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
  //}
  
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

var analyzeGPResults = function(elevProfileResult,watershedResult) {
  var msg = "Calculating Power Potential...";
  console.log(msg);
  $('#msg-status-power').html(makeAlert(msg, 'info'));
  console.log(elevProfileResult);
  console.log(watershedResult);
  
  /*post process the GP service results with these two methods:
  hp.profile = elevProfileResult;
  hp.calcHead();
  hp.watershed = watershedResult;
  hp.getArea();
  hp.calcPower(null,null);
  */
 
  // get the area value, which is buried in the service result object
  var area = watershedResult.WatershedArea.features[0].properties.AreaSqKm;
  $('#msg-text').append('<h3><small>Area:</small>&nbsp;' + _round(area,2) + '&nbsp;<small>km^2</small></h3>');
  
  //get the line from the result object
  var line = elevProfileResult.OutputProfile.features[0];
  // get the coords from the line
  var coords = line.geometry.coordinates;
  // get the z values from the first and last coordinate
  var firstZ = coords[0][2];
  var lastZ = coords[coords.length - 1][2];
  // save the difference
  var head = lastZ - firstZ;
  // check result. It must be a positive number

  $('#msg-text').append('<h3><small>Head:</small>&nbsp;' + _round(head,2) + '&nbsp;<small>meters</small></h3>');


  // calculate power
  var Qavail = (area * 1.6);
  //where x is a range from 0.1 to 0.5 with default value of 0.3 (edited)
  var x = 0.3;
  var Qenv = (area * x);
  var Quseable = Qavail - Qenv;
  //Power in kW; where e is a variable with default value 0.7 (edited)
  var e = 0.7;
  var p = Quseable * head * (0.084) * e;
  var power = _round(p, 2);

  if (head < 0) {
     $('#msg-status').html(makeAlert("The head calculation returned a negative value. Make sure the line was drawn downstream&rarr;upstream.", 'warning'));
  } else {
    //$('#msg-status').html(makeAlert(null,'success'));
    $('#msg-status').hide();
  }
  
  $('#msg-text').append('<h2><small>Power:</small>&nbsp;' + power + '&nbsp;<small>kW/year</small></h2>');
  $('#msg-status-power').html(makeAlert("Power Generation Est.: Complete", 'success'));
  $('#analyze-button-item').html(clearButton);
  $('#msg-text').show();
};