/**
 * paramControl: buttons and controls for managing the parameters modal
 *
 */
paramControl = {
  checkOptionalForm : function(id) {
    if ($(id).hasClass("optional-form")) {
      // find the checkbox associated with the form (explicit DOM tree search)
      var c= $(id).parent().parent().siblings().find('input[type="checkbox"]');
      // and if it is specifically checked for use
      return c.is(":checked");
    } else {
      // otherwise, we know the form must be in use (i.e., it's not optional)
      return true;
    }
  },
  forms : {
    head: {
      id:'#head-form-field',
      set:function(val) {hp.params.head=val;},
      /**
       * gets the value from the form, if so spec'd, and pushes it to the hp obj
       */
      get:function() {
        var isChecked = paramControl.checkOptionalForm(paramControl.forms.head.id);
        if (isChecked) {
          // get from the form if associated checkbox checked
          hp.params.head = parseFloat($(paramControl.forms.head.id).val());
        } else {
          // get from the object if associated checkbox checked
          hp.calcHead();
        }
        return isChecked;
      }
    },
    area: {
      id:'#area-form-field',
      set:function(val) {hp.params.area=val;},
      get:function() {
        var isChecked = paramControl.checkOptionalForm(paramControl.forms.area.id);
        if (isChecked) {
          hp.params.area = parseFloat($(paramControl.forms.area.id).val());
        } else {
          hp.getArea();
        }
        return isChecked;
      }
    },
    envflow: {
      id:'#env-form-field',
      set:function(val) {hp.params.envflow=val;},
      get:function() {
        var isChecked = paramControl.checkOptionalForm(paramControl.forms.envflow.id);
        return isChecked;
      }
    },
    efficiency: {
      id:'#eff-form-field',
      set:function(val) {hp.params.efficiency=val;},
      get:function() {
        var isChecked = paramControl.checkOptionalForm(paramControl.forms.efficiency.id);
        return isChecked;
      }
    },
    rate: {
      id:'#rate-form-field',
      set:function(val) {hp.params.rate=val;},
      get:function() {
        var isChecked = paramControl.checkOptionalForm(paramControl.forms.rate.id);
        return isChecked;
      }
    }
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
	// Get inputs from the parameters form and puts them in the 
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
	 * Parameter checker function. This:
	 *   - gets the values from the form and stores them to the hp object
	 *   - runs the hp validation function
	 *   - uses the results of the validation function to provide validation
	 *     visuals on the form fields (green/good, red/bad)
	 *   - for optional-form classes (those with switches), determines what
	 *     value to use (if any)
	 */
	checkParams: function() {
    // load params from form to hp object
    //this.getParams();
    // run validation
    var validation = hp.validateParams();
    console.log("Validation 1", validation);
    // set the status feedback
    $.each(validation.params, function(k,v) {
      // get the id
      var s = paramControl.forms[k].id;
      // if the param is optional and has assoc checkbox...
      var checked = paramControl.forms[k].get(s);
      if (checked) {
        paramControl.setParamStatus(s, v);
      }
      /*
      if ($(s).hasClass("optional-form")) {
        // find the checkbox associated with the form explicit DOM tree search
        var c= $(s).parent().parent().siblings().find('input[type="checkbox"]');
        //console.log(c.attr('id'), c.is(":checked"));
        // and if it is specifically checked for use
        if (c.is(":checked")) {
          // set the status accordingly
          paramControl.setParamStatus(s, v);
          //...and we'll use the value acquired from the form by getParams
          // and validated by hp.validateParams
        } else {
          // if it is unchecked (i.e., use map-derived values)
          // 
        }
      } else {
        // set the status feedback highlight on the form
        paramControl.setParamStatus(s, v);
      }
      */
    });
    validation = hp.validateParams();
    console.log("Validation 2", validation);
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