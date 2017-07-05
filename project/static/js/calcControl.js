/**
 * calcControls.js
 *
 * controls for the hydropower calculator. includes the drawing workflow
 *
 * requires map.js to be loaded first.
 */


/**
 * Document On-Ready Action
 * Set the buttons and messages to initial state.
 */
$(document).on("ready", function() {
  // hide the status stuff on load
  $('.analysis-status').hide();
  $('#msg-statuses').hide();
  $('#msg-text').hide();
  // disable the buttons (w/ jQuery, so that state is managed)
  $('.analyze').prop("disabled", true);
  $('#results-btn').prop("disabled", true);
});

/**
 * Parameter status
 */
var setParamStatus = function(selector, status) {
  $(selector).closest('div', 'form-group').removeClass("has-success");
  $(selector).closest('div', 'form-group').removeClass("has-error");
  if (status) {
    $(selector).closest('div', 'form-group').addClass("has-success");
    return true;
  } else if (status === false || isNaN(status)) {
    $(selector).closest('div', 'form-group').addClass("has-error");
    return false;
  } 
};

/**
 * Parameter checker function
 */

var checkParamStatus = function() {
  var checks = [];
  $('.params-form').each(function(i) {
    var parsed = parseFloat(this.value);
    var check;
    if (parsed) {
      if (this.id == 'head-form-field') {
        check = (parsed >= 0);
        checks.push(check);
        setParamStatus("#" + this.id, check);
      }
      if (this.id == 'area-form-field') {
        check = (parsed >= 0);
        checks.push(check);
        setParamStatus("#" + this.id, check);
      }
      if (this.id == 'eff-form-field') {
        check = (parsed >= 0 || parsed <= 1);
        checks.push(check);
        setParamStatus("#" + this.id, check);
      }
      if (this.id == 'env-form-field') {
        check = (parsed >= 0 || parsed <= 1);
        checks.push(check);
        setParamStatus("#" + this.id, check);
      }
    } else {
      setParamStatus("#" + this.id, parsed);
      checks.push(false);
      console.log(this.id + " is required.");
    }
  });
  // if a false "check" is not present
  if (checks.indexOf(false) == -1) {
    return true;
  } else {
    return false;
  }
};

/**
 * Parameter Listener/Validation
 * If any one changes, check the rest for completeness. If all have valid
 * content, then enable the calculate button.
 */
$('.params-form').change(function(e){
  var checked = checkParamStatus();
  if (checked) {
    $('.analyze').prop("disabled", false);
  } else {
    $('.analyze').prop("disabled", true);
  }
});

/**
 * Clear Results Action
 * reset the state of buttons, results window, infoWindow.
 * optional param dictates if drawing info is also removed.
 */
function resetAnalysis(clearLayers, clearResults) {
  // reset the analyze button(s) to initial state
  $('#analyze-button-item').html(analyzeButton);
  $('.analyze').prop("disabled", true);
  
  // reset results button to initial state
  $('#results-btn').prop("disabled", true);
  // clear results from modal
  
  // clear the results object
  
  // remove status messages
  $('.analysis-status').empty();
  $('#msg-statuses').hide();
  $('#msg-text').empty().hide();
  
  // clear layers
  if (clearLayers) {
    drawnItems.clearLayers();
    drawInfo.update();
  }
   
}



function makeAlert(msg, alertType) {
  var defaultMsg = null;
  if (alertType == 'info') {
    defaultMsg = 'Calculating&nbsp;&nbsp;<img src="/static/img/loading2.gif"/>';
  } else if  (alertType == 'success') {
    defaultMsg = 'Complete!';
  } else if (alertType == 'danger') {
    defaultMsg = "There was an error with the analysis.";
  } else {
    defaultMsg = "Something went wrong. Check the browser console for details.";
    alertType = 'warning';
  }
  var div1 = '<div class="alert alert-' + alertType + '" role="alert"><small>';
  var div2 = '</small></div>';
  if (msg) {
    return  div1 + msg + div2 ;
  } else {
    return div1 + defaultMsg + div2;
  }    
}

var analyzeButton = '<div><button id="analyze" class="btn btn-primary btn-block analyze" type="submit">Calculate</button></div>';
var clearButton = '<div><button id="clear-btn" class="btn btn-primary btn-block analyze" type="submit">Clear Results</button></div>';

/**
 * Analysis Control
 * Contains button and subsequent results outputs from the tool.
 * Initially, only the button is present, but as the tool is run, the control
 * grows:
 *  - shows calculation status
 *  - shows complete or error alert
 *  - shows results
 */
var analyzeControl = L.control.custom({
    position: 'topright',
    content:
      '<li class="list-group-item" id="analyze-button-item">' + analyzeButton + '</li>' +
      '<li class="list-group-item" id="msg-statuses">' +
        '<div id="msg-status" class="analysis-status"></div>' +
        '<div id="msg-status-elevprofile" class="analysis-status"></div>' +
        '<div id="msg-status-watershed" class="analysis-status"></div>' +
        '<div id="msg-status-power" class="analysis-status"></div>' +
      '</li>' +
      '<li class="list-group-item" id="msg-text"></li>',
      //'<li class="list-group-item" id="clear-button-item">' + clearButton + '</li>',
    classes: 'list-group',
    id: "analyze-control",
    style: {
        width: '300px',
        margin: '10px',
        padding: '0px 0 0 0'
        //cursor: 'pointer',
    }
})
//.addTo(map);

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


/*****************************************************************************
 * BUTTONS
 */

/**
 * Parameters Button (On-Click)
 */
$("#params-btn").click(function() {
	$("#paramsModal").modal("show");
	$(".navbar-collapse.in").collapse("hide");
	return false;
});

/**
 * Analyze Button (On-Click)
 * 
 * If head and area are already entered in the params form, skip the GP,
 * and simply calculate power.
 * 
 */
$(document).on("click", '.analyze', function() {
  
  // reset the messages
  resetAnalysis(false);
  /*
  $('#analyze').prop("disabled", true);
  $('#msg-statuses').hide();
  $('.analysis-status').hide();
  $('.analysis-status').empty();
  
  // set the new status to 
  $('#msg-status').html(makeAlert(null,'info'));
  $('#msg-statuses').show();
  $('.analysis-status').show();
  */
  
  // print geometries to console
  if (!drawnPolyline.isEmpty()) {
    console.log(drawnPolyline.toGeoJSON());
    console.log(drawnPoint.toGeoJSON());
    /**
     * run the geoprocessing tasks, and then analyze the results when done
     */
    runGP(hp).done(analyzeGPResults);
  } else {
    
  }
});

/**
 * Clear Results Button (On-Click)
 */
$(document).on("click", "#clear-btn", function() {
  console.log("clearing results");
  resetAnalysis(true);
});

/**
 * Results Button (On-Click)
 */
$("#results-btn").click(function() {
	$("#resultsModal").modal("show");
	$(".navbar-collapse.in").collapse("hide");
	return false;
});