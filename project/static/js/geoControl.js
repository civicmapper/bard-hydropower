/**
 * sketchInput.js
 *
 * Script for drawing inputs, and using that to derive Head and Area inputs
 * through a geoprocessing service
 */


/*******************************************************************************
 * DRAWING
 */

// feature group targeted by L.Control.Draw
var drawnItems = L.featureGroup().addTo(map);
// line input for Elevation Profile analysis
var drawnPolyline = L.polyline([]);
// point input used for watershed analysis
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

var drawControl= {
  length: 0,
  /**
   * calculate length
   */
  calcLen: function(layer) {
    if (layer instanceof L.Polyline) {
      var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs();
      var distance = 0;
      if (latlngs.length < 2) {
        return 0;
      } else {
        for (var i = 0; i < latlngs.length - 1; i++) {
          distance += latlngs[i].distanceTo(latlngs[i + 1]);
        }
        this.length = _round(distance, 2);
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
  getPointsForGP: function(layer) {
      // get coordinates used by GP tools
      var latlngs = layer._defaultShape ? layer._defaultShape() : layer.getLatLngs();
      drawnPolyline.setLatLngs(latlngs);
      drawnPoint.setLatLng(L.latLng(latlngs[latlngs.length - 1]));
  },
  /**
   * add drawing listeners to the map
   */
  initDrawListeners: function(map) {
    // Map listener for drawing creation
    map.on(L.Draw.Event.CREATED, function(event) {
      console.log('draw:created');
      // calculate drawing length
      drawControl.calcLen(event.layer);
      // render the drawn layer
      drawnItems.addLayer(event.layer);
      // get coordinates used by GP tools
      drawControl.getPointsForGP(event.layer);
      // enable the analyze button
      buttonControl.analyze.enable();
      messageControl.onDrawComplete();
    });
    // map listener for drawing edits
    map.on(L.Draw.Event.EDITED, function(event) {
      console.log('draw:edited');
      event.layers.eachLayer(function(layer) {
        // create message related to drawing
        // calculate drawing length
        drawControl.calcLen(event.layer);
        // get coordinates used by GP tools
        drawControl.getPointsForGP(layer);
      });
      // enable the analyze button
      buttonControl.analyze.enable();
      messageControl.onDrawComplete();
    });
    // map listener for drawing deletion
    map.on('draw:deleted', function (e) {
      console.log('draw:deleted');
      // remove message related to drawing
      //drawInfo.infoOnDrawDelete();
      // disable the analyze button
      buttonControl.analyze.reset();
    });
  }
};


/*****************************************************************************
 * GEOPROCESSING
 */

/**
 * run the two GP tasks at once
 */
function runGP(runWatershed, runProfile) {
  var e = $.Deferred();
  var w = $.Deferred();
  runWatershed = true;
  runProfile = true;
  var msg;
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
      var msg = "Determining elevation profile...";
      console.log(msg);
      messageControl.messages.elevprofile(msg, 'info');
      $('#'+messageControl.messages.elevprofile.id).show();
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
      messageControl.messages.watershed(msg, 'info');
      $('#'+messageControl.messages.watershed.id).show();
      watershedTask.run(function(error, result, response) {
        // show the message window
        if (error) {
          // messages
          msg = "Watershed: " + error.message + "(code:" + error.code + ")";
          console.log(msg);
          console.log(error);
          messageControl.messages.watershed(msg, 'danger');
          // resolve callback
          w.resolve(error);
        } else {
          // messages
          msg = "Watershed Delineation: Complete";
          console.log(msg);
          console.log(result);
          messageControl.messages.watershed(msg, 'success');
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
}


/**
 * runGP callback: takes results, sends messages, initiates final calcs
 */
function analyzeGPResults(elevProfileResult,watershedResult) {
  
  // calculate head
  if (elevProfileResult) {
    console.log(elevProfileResult);
    hp.profile = elevProfileResult;
    hp.calcHead();
  }
  messageControl.messages.elevprofile.addMsg('<small>Head:&emsp</small>' + _round(hp.head,2) + '&nbsp;<small>meters</small>','success');
  
  // calculate area
  if (watershedResult) {
    console.log(watershedResult);
    hp.watershed = watershedResult;
    hp.getArea();
  }
  messageControl.messages.watershed.addMsg('<small>Area:&emsp</small>' + _round(hp.area, 2) + '&nbsp;<small>km^2</small>','success');
  
  // display status
  messageControl.messages.power.addMsg("Calculating Power Potential...");
  // calculate power
  var success = hp.calculatePower();
  // hit callbacks
  if (success) {
    analyzeSuccess();
  } else {
    analyzeFail();
  }
}

function analyzeSuccess() {
  // some messages for debugging
  console.log("Success", hp);
  console.log("Estimated power:", hp.power, "kW");
  console.log("Estimated cost ($):", hp.cost);
  // messages for the user
  messageControl.messages.power.addMsg("Power & Cost Estimation Complete", 'success');
  var msg = '<small>Power:</small>&nbsp;' + hp.power + '&nbsp;<small>kW/year</small>';
  messageControl.messages.power.addMsg(msg, 'success');
  
  // generate the result visuals in the results modal
  mapWatershed(map);
  buildProfileGraphic(map);
  
  // activate the results button
  buttonControl.results.activate();
}

function analyzeFail() {
  console.log("Fail", hp);
  messageControl.messages.power.addMsg("There was an error completing the hydropower calculation.", 'error');
}

/**
* Add the watershed layer to the map
*/
function mapWatershed(map) {
  var watershedArea = L.featureGroup();
  map.addLayer(watershedArea);
  watershedArea.addLayer(L.geoJSON(hp.watershed.WatershedArea));
}
/**
 * Create the line used in the profile visualization
 */
function buildProfileGraphic(map) {
  var line = hp.profile.OutputProfile.features;
  var el = L.control.elevation().addTo(map);
  L.geoJson(line, {
    onEachFeature: el.addData.bind(el)
  }).addTo(map);
}

/**
 * drawInfo Control - instructions for drawing
 *
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
// Generate popup content (length) for drawing
drawInfo.getPopupContent = function(layer) {
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
drawInfo.infoOnDrawCreate = function(event) {
  var layer = event.layer;
  // update popup/info window content
  var content = this.getPopupContent(layer);
  if (content !== null) {
    this.update('Length: ' + content, "<p>Complete the calculation <br> with the 'calculate' button.</p>");
  }
};
drawInfo.infoOnDrawEdit = function(layer) {
    // update popup/info window content
    var content = this.getPopupContent(layer);
    if (content !== null) {
      this.update('Length: ' + content, "Complete the calculation by clicking an option above.");
      //layer.setPopupContent(content);
    } else {
      this.update('', '');
    }  
};
drawInfo.infoOnDrawDelete = function() {
  this.update('','');
};
drawInfo.addTo(map);
*/