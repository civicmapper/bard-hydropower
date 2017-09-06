/**
 * calcControls.js
 *
 * buttons and controls for managing the hydropower calculator.
 *
 * Includes the drawing workflow.
 *
 * requires map.js to be loaded first.
 */

/**
 * BUTTONS
 */
var buttonControl = {
  // opens the parameters modal
  params: {
    elem: $('#params-btn'),
    html: {
      resting: ""
    },
    onClick: function(){$('.params-btn').click(function() {
        $("#paramsModal").modal("show");
        $(".navbar-collapse.in").collapse("hide");
        return false;
    });}
  },
  results: {
    elem: function() {return $('.results-btn');},
    html: {
      resting: 'Results',
      active: 'Results <i class="fa fa-check"></i>'
    },
    onClick: function(){$('.results-btn').click(function(){
      $("#resultsModal").modal("show");
      $(".navbar-collapse.in").collapse("hide");
      return false;
    });},
    reset: function() {
      $('.results-btn').html(this.html.resting);
      $('.results-btn').prop("disabled", true);
    },
    activate: function() {
      this.elem.html(this.html.active);
      this.elem.prop("disabled", false);
    }
  },
  // analyze button
  analyze: {
    elem: function() {return $('.analyze-btn');},
    html: {
      resting: 'Calculate',
      active: 'Calculating...<i class="fa fa-cog fa-spin fa-fw"></i>'
    },
    /**
     * call when correct params are in place
     */
    enable: function() {
      $('.analyze-btn').prop("disabled", false);
    },
    /**
     * call when the calculation is in progress
     */
    setActive: function() {
      $('.analyze-btn').html(this.html.active);
    },
    /**
     * call when the calculation is complete
     */
    setComplete: function() {
      $('.analyze-btn').html(this.html.resting);
    },
    /**
     * reset the button to initial state
     */
    reset: function() {
      $('.analyze-btn').html(this.html.resting);
      $('.analyze-btn').prop("disabled", true);
    },
    /**
     * click event for the button
     */
    onClick: function(){$('.analyze-btn').click(function() {
      // unleash the calculationController 
      calculationController();
      // give this button an active look to it
      buttonControl.analyze.setActive();
    });}
  },
  // reset button
  reset: {
    elem: function() {return $('.reset-btn');},
    onClick: function(){$('.reset-btn').click(function() {
      resetAnalysis(true, false, true);
      buttonControl.reset.elem.prop("disabled", true);
    });}
  },
  init : function() {
    // set buttons to initial states
    this.analyze.reset();
    this.results.reset();
    // attach on those click events
    this.params.onClick();
    this.analyze.onClick();
    this.results.onClick();
    this.reset.onClick();
  }
};

/**
 * Message Control - shows instructions and status of analysis.
 */
var messageControl =  {
  elem: $('#messageControl'),
  messages : {
    instructions : {
      id: 'msg-instructions',
      li: '<li id="msg-instructions" class="message-item list-group-item"></li>',
      addMsg : function(msg, alertType) {makeAlert(msg, alertType, this.id);},
    },
    elevprofile : {
      id: 'msg-status-elevprofile',
      li: '<li id="msg-status-elevprofile" class="message-item list-group-item"></li>',
      addMsg : function(msg, alertType) {makeAlert(msg, alertType, this.id);},
    },
    watershed : {
      id: 'msg-status-watershed',
      li: '<li id="msg-status-watershed" class="message-item list-group-item"></li>',
      addMsg : function(msg, alertType) {makeAlert(msg, alertType, this.id);}
    },
    power : {
      id: 'msg-status-power',
      li: '<li id="msg-status-power" class="message-item list-group-item"></li>',
      addMsg : function(msg, alertType) {makeAlert(msg, alertType, this.id);}
    },
    results : {
      id: 'results-button-shortcut',
      li: '<li id="results-button-shortcut" class="message-item list-group-item">' + buttonControl.results.html.resting + '</li>'
    }
  },
  init: function(leafletMap) {
    // build the L.control.custom object
    var control = L.control.custom({
      id: "messageControl",
      classes: 'panel panel-primary',
      content: '<div class="panel-heading">Instructions</div><ul class="list-group">' + this.messages.instructions.li + this.messages.elevprofile.li + this.messages.watershed.li + this.messages.power.li + '</ul><div class="panel-footer"></div>', 
      style: {
          width: '300px',
          //margin: '10px',
          //padding: '0px 0 0 0'
          //cursor: 'pointer',
      },
      position: 'topright',
    });
    // add it to the map,
    control.addTo(leafletMap);
    // then set it its initial visibility and content state
    this.reset();
  },
  onDrawStart: function() {
    var txt = '<p class="small">To begin, draw a line from a point downstream to a point upstream of where you would locate a micro-hydro installation.<p><p class="small">Alternatively, open the <strong>Parameters</strong> button above and enter your analysis parameters manually.<p>';
    $('#msg-instructions').html(txt);
  },
  onDrawComplete: function() {
    var txt = '<p class="small">Good! Now, use the <strong>Calculate</strong> button to complete the analysis.</p><p class="small">If you want to adjust assumptions regarding efficiency, environmental flow, and cost, hit the <strong>Parameters</strong> button above and make adjustments as you see fit.<p>';
    $('#msg-instructions').html(txt);
  },
  reset: function() {
    $('#messageControl > .list-group > .list-group-item').hide();
    $('.message-item').empty();
    
    this.onDrawStart();
    $('#msg-instructions').show();
  },
};

/**
 * paramControl: buttons and controls for managing the parameters modal
 *
 */
paramControl = {
  forms : {
    head: {id:'head-form-field'},
    area: {id:'area-form-field'},
    envflow: {id:'env-form-field'},
    efficiency: {id:'eff-form-field'},
    rate: {id:'rate-form-field'}
  },
	init : function() {
    // add listeners to detect changes to the params
    this.paramOnChange();
		// Customize the switches
		$('input[type="checkbox"][class^="params-"]').bootstrapToggle({
			on: 'User',
			off: 'Map'
		});
    // listener for debugging 
    $('input[type="checkbox"][class^="params-"]').change(function(e) {
      console.log($('input[type="text"][class=".' + e.target.className + '"]'));
    });
	},
	// Get inputs from the parameters form
	getParams: function() {
		hp.params.head= parseFloat($('#'+this.forms.head.id).val());
		hp.params.area = parseFloat($('#'+this.forms.area.id).val());
		hp.params.envflow = parseFloat($('#'+this.forms.envflow.id).val());
		hp.params.efficiency = parseFloat($('#'+this.forms.efficiency.id).val());
    hp.params.rate = parseFloat($('#'+this.forms.rate.id).val());
	},
	/**
	 * Parameter checker function
	 */
	checkParams: function() {
    // load params from form to hp object
    this.getParams();
    // run validation
    var validation = hp.validateParams();
    // set the status feedback
    $.each(validation.params, function(k,v){
      var s = '#'+paramControl.forms[k].id;
      //if ($(s).hasClass("optional"))
      
      paramControl.setParamStatus(s, v);
    });
    // return validation result
    return validation.status;
	},	
	/**
	 * Parameter Listener/Validation: If any one changes, check the rest for
	 * completeness. If all have valid content, then enable the calculate button.
	 */
	paramOnChange : function() {
		$('.params-form').change(function(e){
			var checked = paramControl.checkParams();
			if (checked) {
				$('.analyze').prop("disabled", false);
			} else {
				$('.analyze').prop("disabled", true);
			}
			console.log(e, hp);
		});
	},
	/**
	 * reset status for any given parameter
	 */
	resetParamStatus : function(selector) {
		$(selector).closest('div', 'form-group').removeClass("has-success");
		$(selector).closest('div', 'form-group').removeClass("has-warning");
		$(selector).closest('div', 'form-group').removeClass("has-error");
	},
	/**
	 * set status for any given parameter
	 */
	setParamStatus: function(selector, status) {
		this.resetParamStatus(selector);
		if (status === true) {
			$(selector).closest('div', 'form-group').addClass("has-success");
			return true;
		} else if (status === false || isNaN(status)) {
			$(selector).closest('div', 'form-group').addClass("has-error");
			return false;
		} else if (status === "warning") {
			$(selector).closest('div', 'form-group').addClass("has-warning");
		}
	}
};


/**
 * Reset Everything
 * reset the state of buttons, results window, infoWindow.
 * optional param dictates if drawing info is also removed.
 */
function resetAnalysis(clearLayers, clearResults, clearParams) {
  
  // hide and empty out the status stuff (message control)
  messageControl.reset();
  // reset the analyze and results buttons to their initial state
  buttonControl.analyze.reset();
  buttonControl.results.reset();
  
  // clear layers
  if (clearLayers) {
    drawnItems.clearLayers();
    drawInfo.update();
  }
  if (clearResults) {
    // empty results modal and reset the hydropower object contents
  }
  if (clearParams) {
    // reset the params to defaults
  }
}


/**
 * Hydropower Calculation function: controller that coordinates calls between
 * paramModal, runGP, messagePanel, drawing layer, and hp to run the hydropower
 * calculation. Determines if the right parameters are in the right places
 * 
 */
function calculationController() {
  
  // (some logging for debugging)
  console.log("Polyline not drawn:", drawnPolyline.isEmpty());
  console.log("Polyline drawn:", !drawnPolyline.isEmpty());
  console.log("Head calculated:", hp.head);
  console.log("Area calculated:", hp.area);
  console.log("Neither head nor area have been calculated:", (!hp.head || !hp.area));
  
  //Reset previous analysis state and remove results
  resetAnalysis(false, false, true);
  
  // checkParams gets the params, validates them, and writes to the class
  paramControl.checkParams();
  
  // show the message panel
  
  if (drawnPolyline.isEmpty() && !hp.head && !hp.area) {
    console.log("no drawing, no head, no area");
    //buttons disabled.
    alert("You must provide all inputs."); 
  } else if (!drawnPolyline.isEmpty() && (!hp.head || !hp.area)) {
    console.log("yes drawing and (yes/no head or yes/no area)");
    // use the drawn polygon
    console.log(drawnPolyline.toGeoJSON());
    console.log(drawnPoint.toGeoJSON());
    //run the geoprocessing tasks,
    //run profile and watershed depending on what params are provided
    //and then analyze the results when done
    runGP().done(analyzeGPResults);
  } else if (drawnPolyline.isEmpty() && (hp.head && hp.area)) {
    console.log("no drawing, yes head and yes area");
    //(skip GP)
    //calculate power
    hp.calculatePower();
  } else if  (!drawnPolyline.isEmpty() && (hp.head && hp.area)) {
    console.log("yes drawing and (yes head and yes area) - using drawing");
    // use the drawn polygon 
    console.log(drawnPolyline.toGeoJSON());
    console.log(drawnPoint.toGeoJSON());
    //run the geoprocessing tasks,
    //run profile and watershed depending on what params are provided
    //and then analyze the results when done
    runGP().done(analyzeGPResults);
  } else {
    alert("You must provide all inputs."); 
  }

}

/***********************************************************************
 * Document On-Load Listener
 * Set the buttons and messages to initial state.
 */
$(document).on("ready", function() {
  
  // build the message control init
  //messageControl.init(map);
  //messageControl.onDrawStart();
  // set up the buttons
  buttonControl.init();
  
});