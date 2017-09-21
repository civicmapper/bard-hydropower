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
      $('.results-btn').html(this.html.active);
      $('.results-btn').prop("disabled", false);
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
    onClick: function(){
      $('.reset-btn').click(function() {
        resetAnalysis(true, true, true);
        $('.reset-btn').prop("disabled", true);
        paramControl.readyToCalc();
        $('#tabStep1').trigger('click');
      });
    }
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
 * paramControl: buttons and controls for managing the parameters modal
 *
 */
paramControl = {
  forms : {
    head: {id:'#head-form-field'},
    area: {id:'#area-form-field'},
    envflow: {id:'#env-form-field'},
    efficiency: {id:'#eff-form-field'},
    rate: {id:'#rate-form-field'}
  },
	init : function() {
    
		// Initialize the custom switches and forms
    
    // switches
		$('input[type="checkbox"].params').bootstrapToggle({
			on: '<i class="fa fa-arrow-right"></i>',
			off: 'Map',
      onstyle: 'default',
      offstyle: 'primary'
		});
    // sliders
    $('.param-slider').slider({
      formatter: function(value) {
        return value;
      }
    });
    $("#env-param-slider").on("slide", function(slideEvt) {
      $("#env-form-field").val(slideEvt.value);
    });
    $("#eff-param-slider").on("slide", function(slideEvt) {
      $("#eff-form-field").val(slideEvt.value);
    });

    // add listeners to detect changes to the params
    this.ableOptionalParam();
    this.paramOnChange();
    this.readyToCalc();

	},
	// Get inputs from the parameters form
	getParams: function() {
		hp.params.head = parseFloat($(this.forms.head.id).val());
		hp.params.area = parseFloat($(this.forms.area.id).val());
		hp.params.envflow = parseFloat($(this.forms.envflow.id).val());
		hp.params.efficiency = parseFloat($(this.forms.efficiency.id).val());
    hp.params.rate = parseFloat($(this.forms.rate.id).val());
	},
  resetParams: function() {
    hp.params.head = 0;
    $(this.forms.head.id).val(hp.params.head);
		hp.params.area = 0;
    $(this.forms.area.id).val(hp.params.area);
		hp.params.envflow = 0.3;
    $(this.forms.envflow.id).val(hp.params.envflow);
    hp.params.efficiency = 0.5;
		$(this.forms.efficiency.id).val(hp.params.efficiency);
    hp.params.rate = 0.1;
    $(this.forms.rate.id).val(hp.params.rate);
  },
	/**
	 * Parameter checker function
	 */
	checkParams: function() {
    // load params from form to hp object
    this.getParams();
    // run validation
    var validation = hp.validateParams();
    console.log(validation);
    // set the status feedback
    $.each(validation.params, function(k,v){
      var s = paramControl.forms[k].id;
      // if the param is optional and has assoc checkbox...
      if ($(s).hasClass("optional-form")) {
        // find the checkbox associated with the form explicit DOM tree search
        var c= $(s).parent().parent().siblings().find('input[type="checkbox"]');
        //console.log(c.attr('id'), c.is(":checked"));
        // and if it is specifically checked for use
        if (c.is(":checked")) {
          // set the status accordingly
          paramControl.setParamStatus(s, v);
        } else {
          // otherwise, skip it
        }
      } else {
        // set the status feedback highlight on the form
        paramControl.setParamStatus(s, v);
      }
      
    });
    // return validation result
    return validation.status;
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
	},
  /**
   * listener for enabling/disabling form field w/ associate checkbox
   */
  ableOptionalParam : function() {
   $('input[type="checkbox"].params').change(function(e) {
      // finds the form associated with the checkbox. explicit DOM tree search
      var form = $(this).closest(".form-group").find('input[type="text"]');
      if($(this).prop('checked')) {
        form.prop('disabled', false);
      } else {
        form.prop('disabled', true);
        paramControl.resetParamStatus('#'+form.attr("id"));
      }
    });
  },
  /**
   * performs validation and controls availability of calculate button
   */
  readyToCalc: function() {
			var checked = paramControl.checkParams();
      // true from checkParams means it's all good, enable calculation
			if (checked) {
				$('.analyze-btn').prop("disabled", false);
			} else {
				$('.analyze-btn').prop("disabled", true);
			}
  },
	/**
	 * Parameter Listener; runs Validation/enables calc button
	 */
	paramOnChange: function() {
		$('.params').change( function(e) {
      paramControl.readyToCalc();
    });
	},
  /**
   * parameter validation messaging.
   */
  paramMessages: {
    id: '#params-msg-status',
    init: function() {
      $(this.id).hide();
    },
    addMsg : function(msg, alertType) {
      makeAlert(msg, alertType, this.id);
      $(this.id).fadeIn();
    },
    clearMsg : function() {
      $(this.id).fadeOut();
    }
  }
};


/**
 * Results Control - shows results of the analysis
 */
var resultsControl =  {
  head: {element:'.results-head'},
  area: {element:'.results-area'},
  envflow: {element:'.results-env'},
  efficiency: {element:'.results-eff'},
  rate: {element:'.results-rate'},
  power: {element:'.results-power'},
  cost: {element:'.results-cost'},
  profile: {
    element:'#profile-viz',
    /**
     * build profile graphic in the results window (using chart.js or something like that)
     */
    buildProfileGraphic:function () {
    },
  },
  watershed: {
    element:'#watershed-viz',
    /**
     * build watershed viz in the results window 
     */
    map : null,
    buildViz: function() {
      this.resultsMap = L.map('watershed-viz');
      var watershedArea = L.featureGroup();
      this.resultsMap.addLayer(watershedArea);
      watershedArea.addLayer(L.geoJSON(hp.watershed.WatershedArea));
    },
  },
  /**
   * Get results from the hp object and put them where they need to go.
   */
  show: function() {
    $(this.power.element).html(_round(hp.results.power,2));
    $(this.cost.element).html(_round(hp.results.cost,2));
    $(this.head.element).html(hp.params.head);
    $(this.area.element).html(hp.params.area);
    $(this.efficiency.element).html(hp.params.efficiency);
    $(this.envflow.element).html(hp.params.envflow);
    $(this.rate.element).html(hp.params.rate);
  },
  reset: function() {
    $('.results').empty();
  }
};
/**
 * Reset Everything
 * reset the state of buttons, results window, infoWindow.
 * optional param dictates if drawing info is also removed.
 */
function resetAnalysis(clearLayers, clearResults, clearParams) {
  
  // reset the analyze and results buttons to their initial state
  buttonControl.analyze.reset();
  buttonControl.results.reset();
  
  // clear layers
  if (clearLayers) {
    drawnItems.clearLayers();
    watershedArea.clearLayers();
  }
  // empty results modal and reset the hydropower object contents
  if (clearResults) {
    resultsControl.reset();
  }
  if (clearParams) {
    paramControl.resetParams();
    paramControl.checkParams();
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
  
  // if just adjusting, and GP already performed, don't do it again.
  // check the map/form switch to see where parameters come from
  // hp object to store head area w/ separate form vs. map
  
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
  
  if (drawnPolyline.isEmpty() && !hp.params.head && !hp.params.area) {
    console.log("no drawing, no head, no area");
    alert("You must provide all inputs."); 
  } else if (!drawnPolyline.isEmpty() && (!hp.params.head || !hp.params.area)) {
    console.log("yes drawing and (yes/no head or yes/no area)");
    // use the drawn polygon
    console.log(drawnPolyline.toGeoJSON());
    console.log(drawnPoint.toGeoJSON());
    //run the geoprocessing tasks,
    //run profile and watershed depending on what params are provided
    //and then analyze the results when done
    runGP().done(analyzeGPResults);
  } else if (drawnPolyline.isEmpty() && (hp.params.head && hp.params.area)) {
    console.log("no drawing, yes head and yes area");
    //calculate power
    var success = hp.calculatePower();
    // hit callbacks
    if (success) {
      analyzeSuccess();
    } else {
      analyzeFail();
    }
  } else if  (!drawnPolyline.isEmpty() && (hp.params.head && hp.params.area)) {
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

/**
 * runGP callback: takes results, sends messages, initiates final calcs
 */
function analyzeGPResults(elevProfileResult,watershedResult) {
  
  // calculate head
  if (elevProfileResult) {
    console.log(elevProfileResult);
    hp.profile = elevProfileResult;
    hp.calcHead();
    $(paramControl.forms.head.id).val(hp.params.head);
  }
  
  // calculate area
  if (watershedResult) {
    console.log(watershedResult);
    hp.watershed = watershedResult;
    hp.getArea();
    $(paramControl.forms.area.id).val(hp.params.area);
  }

  // display status
  //resultsControl.messages.power.addMsg("Calculating Power Potential...");
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
  console.log("Estimated power:", hp.results.power, "kW");
  console.log("Estimated cost ($):", hp.results.cost);
  // messages for the user
  var msg = '<small>Power:</small>&nbsp;' + _round(hp.results.power,2) + '&nbsp;<small>kW/year</small><br><small>Cost:</small>&nbsp;' + _round(hp.results.cost,2) + '&nbsp;<small>$/KwH</small>';
  
  resultsControl.show();
  
  // generate the result visuals in the results modal
  mapWatershed(map);
  //buildProfileGraphic(map); // TO-DO
  
  // activate the results button
  // reset the calculator button
  buttonControl.analyze.setComplete();
  buttonControl.results.activate();
  $('#tabStep2').trigger('click');
}

function analyzeFail() {
  console.log("Fail", hp);
  //resultsControl.messages.addMsg("There was an error completing the hydropower calculation.", 'error');
}