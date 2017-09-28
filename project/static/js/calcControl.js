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
        //$('.reset-btn').prop("disabled", true);
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
 * object representing a single parameter. includes all functionality
 * for getting/setting values, validation, setting validation feedback
 * 
 * @param String primary_class The primary class used to identify the parameter
 *  in the DOM (e.g., '.params-head')
 * @param String secondary_class The secondary class used to identify the
 *   parameter in the DOM (e.g., '.params')
 * @param Float defaultValue The default value for the parameter
 * @param Float validLower The floor value to be validated against
 * @param Float validUpper The ceiling value to be validated against
 * @param Boolean switchable Indicates if the parameter has a toggle to dictate
 *   whether or not it is used
 * @param Function customGetter Used to get desired value for switchable
 *   parameters
 */
var Param = function(primary_class, defaultValue, validLower, validUpper, switchable, customGetter) {
  var p = {
    _primary_class : primary_class,
    _defaultValue : defaultValue,
    _hasSwitch: switchable,
    _customGetter: customGetter,
    _valid: {
      upper: validUpper,
      lower: validLower
    },
    /**
     * stored value
     */
    value: defaultValue,
    /**
     * method: return DOM element (as jQuery object)
     */
    s: function() {
      return $(primary_class);
    },
    /**
     * checks the stored value against validation parameters
     */
    validate: function() {
      if (this.value) {
        if (this.value <= this._valid.upper && this.value >= this._valid.lower) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    },
    /**
     * setter method: assigns the input value to this.value and runs validation,
     * returning result of validate() to caller.
     *
     * before setting the value, attempts to use parseFloat();
     */
    setValue: function(i) {
      this.value = parseFloat(i);
      var validation = this.validate();
      return validation;
    },
    /**
     * resets the the value to the default that was provided when this class
     * was instantiated
     */
    resetValue: function() {
      this.value = this._defaultValue;
    },
    /**
     * method: extract the value from the interface and store it here. By
     * default the value is extracted from this param's form element.
     * However, if the param is switchable and a "custom getter" function is
     * provided, it will use that based on the state of the switch
     *
     * More explicitly: for unswitchable params--the calculator's constants--
     * this function will just get the value from the form field. For the Area
     * and Head, the default checkbox state is False, indicating that those
     * things will be derived from the map. If the user switches it to true,
     * then this function will ignore the custom getter and just get the value
     * from the form field.
     */
    getFromForm: function(customGetter) {
      var v, g, cg;
      // if the parameter is switchable
      if (this._hasSwitch) {
        // for customGetter: use the func explicitly provided or fallback to func
        // stored on init
        if (customGetter) {
          cg = customGetter;
        } else {
          cg = this._customGetter;
        }
        // get the state of the checkbox
        var c = this.s().parent().parent().siblings().find('input[type="checkbox"]');
        
        // if its checked
        if (c.is(":checked")) {
          // get the value from the form element
          v = this.setValue(this.s().val());
          console.log("getting value from form", this.value);
        } else {
          // if it is not checked (the default), run the provided custom
          // "getter" function to get it from wherever
          g = cg(this);
          console.log("using getter", g);
          // then run the setValue function...
          v = this.setValue(g);
          // then put that on the form for posterity (shows what we got, even
          // though we didn't get it from the form)
          this.setOnForm();
        }
      // if the parameter is not switchable
      } else {
        // get the value from the form element
        v = this.setValue(this.s().val());
      }
      return v;
    },
    /**
     * takes the stored value and sets it on the associated form.
     */
    setOnForm: function() {
      if (this.value === null) {
        this.s().val(this.value);
      } else {
        this.s().val('');
      }
    },
    /**
     * reset classes on the form to remove any indication of validation state
     */
    resetParamStatus: function() {
      var s = this.s();
      $.each(["has-success","has-warning","has-error"], function(i,v) {
        s.closest('div', 'form-group').removeClass(v);
      });
    },
    /**
     * set classes on the form to visually show validation state
     */
    setParamStatus: function(validation) {
      
      this.resetParamStatus();
      var c;
      if (validation === true) {
        c = "has-success";
      } else if (validation === false || isNaN(validation)) {
        c = "has-error";
      } else if (validation === "warning") {
        c = "has-warning";
      }
      this.s().closest('div', 'form-group').addClass(c);
    },
  };
  return p;
};

var Result = function(dataClass, roundBy, vizClass, vizFunction) {
  var r = {
    _dataClass : dataClass,
    _vizClass : vizClass,
    _vizFunction : vizFunction,
    _roundBy: roundBy,
    /**
     * result value
     */
    value : null,
    /**
     * method: return DOM element for data (as jQuery object)
     */
    d: function() {
      return $(this._dataClass);
    },
    /**
     * method: return DOM element for viz (as jQuery object)
     */
    v: function() {
      return $(this._vizClass);
    },
    /**
     * take the value stored for the result and put on the page
     */
    setOnPage : function(){
      var r;
      // set the data value on the page
      if (this._roundBy) {
        r = _round(this.value, 2);
      } else {
        r = this.value;
      }
      this.d().html(r);
      // if there is also a viz class, then generate
      if (this._vizClass) {
        console.log("Placeholder for generating a visualization");
      }
    }
  };
  return r;
};

function cgGetHead(i) {
  gpControl.getHead(i);
}

function cgGetArea(i) {
  gpControl.getArea(i);
}

/**
 * object for storing data i/o and using it via related methods
 */
var Hydropower = {
  params: {
    head: new Param('input[type="text"].params-head', null, 0.0001, 1000000, true, function(i){cgGetHead(i);}),
    area: new Param('input[type="text"].params-area', null, 0.0001, 1000000, true, function(i){cgGetArea(i);}),
    effy: new Param('input[type="text"].params-effy',  0.7, 0, 1, null, false),
    envn: new Param('input[type="text"].params-envn', 0.3, 0, 0.5, null, false),
    rate: new Param('input[type="text"].params-rate', 0.1, 0, 0.1000000, null, false),
  },
  results: {
    powr: new Result('.results-powr', 2, null),
    cost: new Result('.results-cost', 2, null),
    area: new Result('.results-area', 2, '.results-area-viz', function(i){gpControl.vizArea(i);}),
    head: new Result('.results-head', 2, '.results-head-viz', function(i){gpControl.vizHead(i);}),
    effy: new Result('.results-effy', null, null),
    effn: new Result('.results-envn', null, null),
    rate: new Result('.results-rate', null, null),
  },
	/**
	 * client-side hydropower calculation
	 */
  calculatePower: function(area,head,envflow,efficiency,rate) {
    
    var validation = [];
    // if params are provided, overwrite any existing ones
		if (area) {validation.push(this.params.area.setValue(area));} else {validation.push(true);}
		if (head) {validation.push(this.params.head.setValue(head));} else {validation.push(true);}
		if (envflow) {validation.push(this.params.envflow.setValue(envflow));} else {validation.push(true);}
		if (efficiency) {validation.push(this.params.efficiency.setValue(efficiency));} else {validation.push(true);}
		if (rate) {validation.push(this.params.rate.setValue(rate));} else {validation.push(true);}
    
		// if parameters validate (particularly those explicitly provided), run the calculation
    if (validation.indexOf(false) == -1) {
      var _int = {};
			// Calculate power from stored parameters
			_int.qAvailable = this.params.area.value * 1.6;
			_int.qEnv = (this.params.area.value * this.params.envflow.value);
			_int.qUseable = _int.qAvailable - _int.qEnv;
			console.log(_int);
			// Power in kW
			var p = _int.qUseable * this.params.head.value * (0.084) * this.params.efficiency.value;
			// Cost = rate * hours per year * kilowatts
			var c = this.params.rate.value * 8766 * p;
			console.log("power calcs", p,c);
			this.results.power.value = p;
			this.results.cost.value = c;
			// success
			return true;
		} else {
			// fail
			return false;
		}
	}
	/**
	 * calculate power from input params using the API
	 *
	calculatePowerAPI: function(area,head,envflow,efficiency,rate,callback) {
		//if params are provided, overwrite any existing ones
		if (area) {this.params.area = area;}
		if (head) {this.params.head = head;}
		if (envflow) {this.params.envflow = envflow;}
		if (efficiency) {this.params.efficiency = efficiency;}
		if (rate) {this.params.rate = rate;}
        
		console.log("Calculating power...");
		// assemble request URL to API
		var calcRequestURL = Flask.url_for("api", {
			"area": this.params.area,
			"head": this.params.head,
			"envflow": this.params.envflow,
			"efficiency": this.params.efficiency,
			"rate": this.params.rate
		});
		// submist GET request
		$.get({
			url: calcRequestURL,
			success: function(data) {
				this.results.power = data.result.power;
				this.results.cost = data.result.cost;
				if (callback) {
						callback();
				}
			}
		});
	}
  */
};

/**
 * controller that listens for changes to the UI and runs associated
 * functions in the Hydropower object
 */
var paramControl = {
  /**
   * performs validation and controls availability of calculate button
   */
  readyToCalc: function(validated) {
    
      // true from checkParams means it's all good, enable calculation
			if (validated) {
        console.log(">>> ready to calculate <<<");
				$('.analyze-btn').prop("disabled", false);
			} else {
        console.log(">>> not ready to calculate <<<");
				$('.analyze-btn').prop("disabled", true);
			}
  },
  /**
   * load, validate, and provide feedback on each parameter
   */
  onEachParameter: function() {
    var validation = [];
    readyToCalc = this.readyToCalc;
    $.each(Hydropower.params, function(k,p) {
      // load params from form to hp object and run validation
      var v = p.getFromForm();
      validation.push(v);
      // set UI feedback based on validation results
      p.setParamStatus(v);
    });
    //return whether all forms have validated
		if (validation.indexOf(false) == -1) {
			readyToCalc(true);
		} else {
			readyToCalc(false);
		}
  },
  /**
   * attaches listeners for running validation anytime a control changes
   * gets, validates, sets values as appropriate 
   */
  onControlChange: function() {
    // when the form fields change:
    
    var onEachParameter = this.onEachParameter;
    var onSwitch = this.onSwitch;
    
    // when a form changes (potentially automated input)
    $('input[type="text"].params').change(function(e) {
      //get/validate values from form
      onEachParameter();
    });
    // when a form changes (direct user input)
    $('input[type="text"].params').keyup(function(e) {
      //get/validate values from form
      onEachParameter();
    });
    
    // when the checkbox changes:
    $('input[type="checkbox"].switch').change(function(e) {
      // use *this* switch to enable/disable the assoc. form.
      onSwitch(this);
      // then get/validate values from form
      onEachParameter();
      
     });
    
    // do this regardless of what input changes
    $('input').change(function(e) {logIt();});
    $('input').keyup(function(e) {logIt();});
  },
  onSwitch: function(i) {
    // find the form associated with the checkbox (explicit DOM tree search)
    var form = $(i).closest(".form-group").find('input[type="text"]');
    // get state of checkbox and enable/disable the form accordingly
    if($(i).prop('checked')) {
      form.prop('disabled', false);
      form.prop('placeholder', "Enter value here to override the map-derived value");
    } else {
      form.prop('disabled', true);
      form.prop('placeholder', "Sketch a microhydro installation on the map to derive this parameter");
      
      // if disabling, also remove the status
      //paramControl.resetParamStatus('#'+form.attr("id"));
    }
  },
  /**
   * similar to onControlChange except is a callback that is fired when  
   * GP is complete
   */
  onGPComplete: function() {
    console.log("Doing this with geoprocessing results");
    // load the GP output to the Hydropower object using method that handles
    // extraction, calculation, and storage appropriately.
    //if (watershed) {
    //  Hydropower.gpOutput.setArea(watershed);
    //}
    //if (profile) {
    //  Hydropower.gpOutput.setHead(profile);
    //}
    // once that's done...
    this.onEachParameter();
    //(^ this should in theory extract the area and head from the watershed and profiles.)
  },
  onCalculateSuccess: function() {
    // some messages for debugging
    console.log("Success");
    console.log("Estimated power:", Hydropower.results.power.value, "kW");
    console.log("Estimated cost ($):", Hydropower.results.cost.value);

    // activate the results button
    // reset the calculator button
    buttonControl.analyze.setComplete();
    buttonControl.results.activate();
    
    // push results to results tab
    resultsControl.show();
    
    // add visualizations
    gpControl.vizArea(map);
    //gpControl.vizHead(); // TO-DO
    
    // jump to results tab
    $('#tabStep2').trigger('click');
  },
  onCalculateFail: function() {
    var msg = "If you're seeing this message, things got pretty far but just didn't work out.";
    console.log(msg);
    paramsControl.notifications.addMsg(msg,'danger');
  },
  /**
   * reset parameters to defaults
   */
  reset: function() {
    // run each parameter's reset function
    $.each(Hydropower.params, function(k,p) {
      p.reset();
    });
    this.onEachParameter();
    $.each(Hydropower.results, function(k,r) {
      r.reset();
    });
    $('.results').empty();
  },
  /**
   * parameter validation alert generation
   */
  notifications: {
    id: '#params-notification',
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
  },
  init: function() {
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
    // initialize listeners
    this.onControlChange();
    // perform initial form validation, to highlight forms
    this.onEachParameter();
  },
};

function logIt() {
  $.each(Hydropower.params, function(k, v) {
    console.log("----");  
    v.getFromForm();
    console.log(k, "=", v.value);
    console.log("valid?", v.validate());
  });
  console.log(Hydropower);
  console.log("***********");
}


logIt();


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
 * paramControl, buttonControl, runGP, drawing layer, and Hydropower to do the
 * work.
 *
 * called from the Calculate Button
 * 
 */
function calculationController() {
  
  // if just adjusting, and GP already performed, don't do it again.
  
  
  // checkParams gets the params, validates them, and writes to the class
  paramControl.onEachParameter();
  
  // use the switches and associated forms to determine if/what GP needs to be run
  
  // run GP where it needs to be run, and put results where they need to go
  
  // complete the calculation
  
  if (drawnPolyline.isEmpty() && !hp.params.head && !hp.params.area) {
    console.log("no drawing, no head, no area");
    alert("You must provide all inputs.");
  } else if (!drawnPolyline.isEmpty() && (!hp.params.head || !hp.params.area)) {
    console.log("yes drawing and (yes/no head or yes/no area)");
    // use the drawn polygon
    //console.log(drawnPolyline.toGeoJSON());
    //console.log(drawnPoint.toGeoJSON());
    //run the geoprocessing tasks,
    //run profile and watershed depending on what params are provided
    //and then analyze the results when done
    runGP().done(analyzeGPResults);
  } else if (drawnPolyline.isEmpty() && (hp.params.head && hp.params.area)) {
    console.log("no drawing, yes head and yes area");
    //calculate power
    var success = Hydropower.calculatePower();
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

}

function analyzeFail() {
  
  //resultsControl.messages.addMsg("There was an error completing the hydropower calculation.", 'error');
}