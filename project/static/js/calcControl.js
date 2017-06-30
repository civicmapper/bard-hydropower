/**
 * calcControls.js
 *
 * controls for the hydropower calculator.
 *
 * requires map. load after map.js
 */


$(document).on("ready", function() {
  $('.analysis-status').hide();
  $('#msg-statuses').hide();
  $('#msg-text').hide();
  $('.analyze').prop("disabled", true);
  //$('#clear-button-item').hide();
});

/**
 * reset the analysis window. optional param dictates if drawing info is
 * also removed.
 */
function resetAnalysis(clearLayers) {
  $('#analyze-button-item').html(analyzeButton);
  $('.analyze').prop("disabled", true);
  $('.analysis-status').empty();
  $('#msg-statuses').hide();
  $('#msg-text').empty().hide();
  if (clearLayers) {
    drawnItems.clearLayers();
    drawInfo.update();
  }
}

$(document).on("click", "#clearCalcs", function() {
  console.log("clearing results");
  resetAnalysis(true);
});

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
var clearButton = '<div><button id="clearCalcs" class="btn btn-primary btn-block analyze" type="submit">Clear Results</button></div>';

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
 * Analyze Button - Action
 */

$(document).on("click", '#analyze', function() {
  
  // reset the messages
  resetAnalysis(false);
  /*
  $('#analyze').prop("disabled", true);
  $('#msg-statuses').hide();
  $('.analysis-status').hide();
  $('.analysis-status').empty();
  */
  // set the new status to 
  $('#msg-status').html(makeAlert(null,'info'));
  $('#msg-statuses').show();
  $('.analysis-status').show();
  
  // print geometries to console
  console.log(drawnPolyline.toGeoJSON());
  console.log(drawnPoint.toGeoJSON());
  
  /**
   * run the geoprocessing tasks, and then analyze the results when done
   */
  runGP(hp).done(analyzeGPResults);
      
});

$(document).on("load", function() {
  console.log("document loaded");
	$("#loading").hide();
});