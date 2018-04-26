/**
 * calcControls.js
 *
 * buttons and controls for managing the hydropower calculator.
 *
 * Includes the drawing workflow.
 *
 * requires map.js to be loaded first.
 */

var utils = require("./utils");

/**
 * shorthand function for generating status messages in a Bootstrap alert.
 * Provides some default messages. if elementID is spec'd, will automatically
 * put the alert in place; otherwise returns alert's html as string.
 * Uses a custom "alert-none" css class for a non-alert element that fills the
 * space of an alert.
 */
function makeAlert(msg, alertType, elementID) {
    var defaultMsg = null;
    if (alertType == "info") {
        defaultMsg = "The request has been processed.";
    } else if (alertType == "success") {
        defaultMsg = "Success!";
    } else if (alertType == "warning") {
        defaultMsg = "There is something you need to attend to.";
    } else if (alertType == "danger") {
        defaultMsg = "There was an error.";
    } else if (alertType == "none") {
        defaultMsg = "";
    } else {
        defaultMsg = "";
        alertType = "none";
    }

    var alert = "";
    var close =
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
    var div1 = '<div class="alert alert-' + alertType + '" role="alert">';
    var div2 = "</div>";
    if (msg) {
        // console.log(msg);
        alert = div1 + close + msg + div2;
    } else {
        alert = div1 + defaultMsg + div2;
    }

    if (elementID) {
        // if it the element exists
        var liElem = jQuery("#" + elementID);
        if (liElem.length > 0) {
            // insert the alert there
            liElem.html(alert);
        } else {
            return false;
        }
    } else {
        // otherwise, just return the alert html as a string
        return alert;
    }
}

/**
 * BUTTONS
 */
var buttonControl = {
    /**
     * analyze button
     */
    analyze: {
        elem: function() {
            return jQuery(".analyze-btn");
        },
        html: {
            resting: "Calculate",
            active: 'Calculating...<i class="fa fa-cog fa-spin fa-fw"></i>'
        },
        /**
         * call when correct params are in place
         */
        enable: function() {
            this.elem().prop("disabled", false);
        },
        /**
         * call when the calculation is in progress
         */
        setActive: function() {
            this.elem().html(this.html.active);
        },
        /**
         * call when the calculation is complete
         */
        setComplete: function() {
            this.elem().html(this.html.resting);
        },
        /**
         * reset the button to initial state
         */
        reset: function() {
            this.elem().html(this.html.resting);
            this.elem().prop("disabled", true);
        },
        /**
         * click event for the button
         */
        onClick: function() {
            this.elem().click(function() {
                // unleash the calculationController
                calculationController(true);
            });
        }
    },
    /**
     * reset button
     */
    reset: {
        elem: function() {
            return jQuery(".reset-btn");
        },
        onClick: function() {
            this.elem().click(function() {
                resetAnalysis(true, true);
                paramControl.readyToCalc();
                jQuery("#tabStep0").trigger("click");
            });
        }
    },
    /**
     * sidebar toggle
     */
    sidebar: {
        elem: function() {
            return jQuery(".sidebar-toggle");
        },
        onClick: function() {
            this.elem().click(function() {
                jQuery("#sidebar").animate({
                    width: "toggle"
                }, {
                    duration: 200,
                    start: function() {
                        if (jQuery(".sidebar-wrapper").is(":visible")) {
                            jQuery(".sidebar-wrapper").hide();
                        }
                    },
                    done: function() {
                        if (!jQuery(".sidebar-wrapper").is(":visible")) {
                            jQuery(".sidebar-wrapper").show();
                        }
                    },
                    always: function() {
                        map.invalidateSize();
                    }
                });
            });
        }
    },
    init: function() {
        // set buttons to initial states
        this.analyze.reset();
        // attach on those click events
        this.analyze.onClick();
        this.reset.onClick();
        this.sidebar.onClick();
    }
};
global.buttonControl = buttonControl;

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
var Param = function(
    primary_class,
    defaultValue,
    validLower,
    validUpper,
    switchable,
    customGetter
) {
    var p = {
        _primary_class: primary_class,
        _defaultValue: defaultValue,
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
            return jQuery(primary_class);
        },
        /**
         * checks the stored value against validation parameters
         */
        validate: function() {
            if (this.value) {
                if (
                    this.value <= this._valid.upper &&
                    this.value >= this._valid.lower
                ) {
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
            if (i) {
                this.value = parseFloat(i);
                var validation = this.validate();
                // console.log(i, validation);
                return validation;
            } else {
                return false;
            }
        },
        /**
         * resets the the value to the default that was provided when this class
         * was instantiated
         */
        reset: function() {
            this.value = this._defaultValue;
            this.setOnForm();
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
                var c = this.s()
                    .parent()
                    .parent()
                    .siblings()
                    .find('input[type="checkbox"]');

                // if its checked
                if (c.is(":checked")) {
                    // get the value from the form element
                    v = this.setValue(this.s().val());
                    //console.log("value from form:", this.value);
                } else {
                    // if it is not checked (the default), run the provided custom
                    // "getter" function to get it from wherever
                    g = cg(this);
                    //console.log("value from getter:", g);

                    if (g) {
                        //console.log(g);
                        // then run the setValue function...
                        v = this.setValue(g);
                        // then put that on the form for posterity (shows what we got, even
                        // though we didn't get it from the form)
                        this.setOnForm();
                    } else {
                        // the getter may return false if it couldn't get what it wanted
                        // no value will be set
                        v = false;
                    }
                }
                // if the parameter is not switchable
            } else {
                // get the value from the form element
                v = this.setValue(this.s().val());
            }
            // return the value from setValue, which is whether or not the set value
            // is valid (true/false)
            if (v) {
                return v;
            } else {
                return false;
            }
        },
        /**
         * by default takes the stored value and sets it on the associated form.
         * optionally, provided value v is put in the form
         */
        setOnForm: function(v) {
            if (!v) {
                //console.log(this.value, "!= null || !isNaN(" + this.value + "):", (this.value != null || !isNaN(this.value)));

                if (this.value != null || !isNaN(this.value)) {
                    this.s().val(this.value);
                } else {
                    //this.s().val('');
                }
            } else {
                this.s().val(v);
            }
        },
        /**
         * reset classes on the form to remove any indication of validation state
         */
        resetParamStatus: function() {
            var s = this.s();
            jQuery.each(["has-success", "has-warning", "has-error"], function(i, v) {
                s.closest("div", "form-group").removeClass(v);
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
            } else {
                resetParamStatus();
            }
            this.s()
                .closest("div", "form-group")
                .addClass(c);
        }
    };
    return p;
};

var Result = function(dataClass, roundBy, vizClass, vizFunction) {
    var r = {
        _dataClass: dataClass,
        _vizClass: vizClass,
        _vizFunction: vizFunction,
        _roundBy: roundBy,
        /**
         * result value
         */
        value: null,
        /**
         * method: return DOM element for data (as jQuery object)
         */
        domElement: function() {
            return jQuery(this._dataClass);
        },
        /**
         * method: return DOM element for viz (as jQuery object)
         */
        vizElement: function() {
            return jQuery(this._vizClass);
        },
        /**
         * take the value stored for the result and put on the page
         */
        setOnPage: function() {
            // round the value if needed
            var r;
            if (this._roundBy) {
                r = utils._round(this.value, 2);
            } else {
                r = this.value;
            }

            // set the data value on the page
            // console.log(this._dataClass, r);
            this.domElement().html(r);

            // if there is also a viz class, then call that helper function
            if (this._vizClass) {
                // console.log("Placeholder for generating a visualization");
                this._vizFunction();
            }
        },
        reset: function() {
            this.value = null;
            this.setOnPage();
        }
    };
    return r;
};

function cgGetHead(i) {
    return gpControl.getHead(i);
}

function cgGetArea(i) {
    return gpControl.getArea(i);
}

function cgVizHead(i) {
    gpControl.vizHead(i);
}

function cgVizArea(i) {
    gpControl.vizArea();
}

/**
 * object for storing data i/o and using it via related methods
 */
var Hydropower = {
    params: {
        head: new Param(
            'input[type="text"].params-head',
            null,
            0.0001,
            1000000,
            true,
            function(i) {
                return cgGetHead(i);
            }
        ),
        area: new Param(
            'input[type="text"].params-area',
            null,
            0.0001,
            1000000000,
            true,
            function(i) {
                return cgGetArea(i);
            }
        ),
        effy: new Param('input[type="text"].params-effy', 0.7, 0, 1, null, false),
        envn: new Param('input[type="text"].params-envn', 0.3, 0, 0.5, null, false),
        rate: new Param(
            'input[type="text"].params-rate',
            0.1,
            0,
            100000000,
            null,
            false
        )
    },
    results: {
        powr: new Result(".results-powr", 2, null),
        cost: new Result(".results-cost", 2, null),
        area: new Result(".results-area", 2, ".results-area-viz", function() {
            // console.log("results-area-viz");
            cgVizArea();
        }),
        head: new Result(".results-head", 2, ".results-head-viz", function(i) {
            cgVizHead(i);
        }),
        effy: new Result(".results-effy", null, null),
        envn: new Result(".results-envn", null, null),
        rate: new Result(".results-rate", null, null)
    },
    /**
     * client-side hydropower calculation
     */
    calculatePower: function(
            area,
            head,
            envflow,
            efficiency,
            rate,
            watershedYield
        ) {
            var validation = [];
            // if params are provided, overwrite any existing ones
            if (area) {
                validation.push(this.params.area.setValue(area));
            } else {
                validation.push(true);
            }
            if (head) {
                validation.push(this.params.head.setValue(head));
            } else {
                validation.push(true);
            }
            if (envflow) {
                validation.push(this.params.envn.setValue(envflow));
            } else {
                validation.push(true);
            }
            if (efficiency) {
                validation.push(this.params.effy.setValue(efficiency));
            } else {
                validation.push(true);
            }
            if (rate) {
                validation.push(this.params.rate.setValue(rate));
            } else {
                validation.push(true);
            }
            // default watershed yield value (not a parameter currently)
            var y = 1.6;
            if (watershedYield) {
                y = watershedYield;
            }

            // if parameters validate (this addresses validation for those explicitly
            // provided), then run the calculation
            if (validation.indexOf(false) == -1) {
                var _int = {};
                // Calculate power from stored parameters
                _int.qAvailable = this.params.area.value * y;
                _int.qEnv = this.params.area.value * this.params.envn.value;
                _int.qUseable = _int.qAvailable - _int.qEnv;
                //console.log(_int);
                // Power in kW
                var p =
                    _int.qUseable *
                    (this.params.head.value / 11.8) *
                    this.params.effy.value;
                // Cost = rate * hours per year * kilowatts
                var c = this.params.rate.value * 8766 * p;
                // console.log("power:", p, " $$$:", c);
                this.results.powr.value = p;
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
		jQuery.get({
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
global.Hydropower = Hydropower;

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
            //console.log(">>> ready to calculate <<<");
            jQuery(".analyze-btn").prop("disabled", false);
            calculationController(false);
        } else {
            //console.log(">>> not ready to calculate <<<");
            jQuery(".analyze-btn").prop("disabled", true);
        }
    },
    /**
     * load, validate, and provide feedback on each parameter
     */
    onEachParameter: function() {
        //console.log("*********** Parameters");
        // console.log(this);

        var validation = [];

        var rtc = paramControl.readyToCalc;

        jQuery.each(Hydropower.params, function(k, p) {
            // console.log("----", k, "----");

            // load params from form to hp object and run validation
            var v = p.getFromForm();
            validation.push(v);
            // set UI feedback based on validation results
            p.setParamStatus(v);

            // console.log("value =", p.value);
            // console.log("valid?", p.validate());
        });

        //return whether all forms have validated
        //console.log("----");
        //console.log(">>> validation",validation);

        if (validation.indexOf(false) == -1) {
            rtc(true);
        } else {
            rtc(false);
        }

        //console.log(Hydropower);
        //console.log("***********");
    },
    onEachResult: function() {
        // console.log("*********** Parameters");
        jQuery.each(Hydropower.results, function(k, r) {
            //console.log("----", k, "----");
            // if there is a corresponding result for the params, copy it over.
            if (Hydropower.params[k]) {
                //console.log("copying", k, "from params to results");
                r.value = Hydropower.params[k].value;
            }
            r.setOnPage();
        });
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
        jQuery('input[type="text"].params').change(function(e) {
            //console.log(">>> form changed <<<");
            //get/validate values from form
            onEachParameter();
        });
        // when a form changes (direct user input)
        jQuery('input[type="text"].params').keyup(function(e) {
            //console.log(">>> form changed (keyup) <<<");
            setTimeout(function() {
                //get/validate values from form
                onEachParameter();
            }, 300);
        });

        // when the checkbox changes:
        jQuery('input[type="checkbox"].switch').change(function(e) {
            // use *this* switch to enable/disable the assoc. form.
            //console.log(">>> switch changed <<<");
            onSwitch(this);
            // then get/validate values from form
            onEachParameter();
        });

        // do this regardless of what input changes
        //jQuery('input').change(function(e) {logIt();});
        //jQuery('input').keyup(function(e) {logIt();});
    },
    onSwitch: function(i) {
        // find the form associated with the checkbox (explicit DOM tree search)
        var form = jQuery(i)
            .closest(".form-group")
            .find('input[type="text"]');
        // get state of checkbox and enable/disable the form accordingly
        if (jQuery(i).prop("checked")) {
            form.prop("disabled", false);
            // form.prop(
            //     "placeholder",
            //     "Enter value here to override the map-derived value"
            // );
        } else {
            form.prop("disabled", true);
            // form.prop(
            //     "placeholder",
            //     "Sketch a microhydro installation on the map to derive this parameter"
            // );

            // if disabling, also remove the status
            //paramControl.resetParamStatus('#'+form.attr("id"));
        }
    },
    /**
     * similar to onControlChange except is a callback that is fired when
     * GP is complete
     */
    onGPComplete: function() {
        console.log(">>> GP Complete. Re-evaluating parameters...");
        this.onEachParameter();
        this.onEachResult();
    },
    onCalculateSuccess: function(autoTab) {
        // some messages for debugging
        console.log("Success");
        console.log("Estimated power:", Hydropower.results.powr.value, "kW");
        console.log("Estimated cost ($):", Hydropower.results.cost.value);

        // activate the results button
        // reset the calculator button
        //buttonControl.analyze.setComplete();
        //buttonControl.results.activate();

        // push results to results tab
        paramControl.onEachResult();

        // add visualizations
        gpControl.vizArea(map);
        //gpControl.vizHead(); // TO-DO

        // jump to results tab
        if (autoTab) {
            jQuery("#tabStep3").trigger("click");
        }
    },
    onCalculateFail: function() {
        var msg =
            "If you're seeing this message, things got pretty far but just didn't work out.";
        console.log(msg);
        paramsControl.notifications.addMsg(msg, "danger");
    },
    /**
     * reset parameters to defaults
     */
    reset: function() {
        // clear the form fields and html
        jQuery(".params").trigger("reset");
        jQuery(".results").empty();

        // run each parameter's reset function
        jQuery.each(Hydropower.params, function(k, p) {
            p.reset();
        });
        // this will populate defaults again:
        this.onEachParameter();
        // run each result's reset function
        jQuery.each(Hydropower.results, function(k, r) {
            r.reset();
        });
    },
    /**
     * parameter messages alert generation
     */
    notifications: {
        id: "#params-notification",
        init: function() {
            jQuery(this.id).hide();
        },
        addMsg: function(msg, alertType) {
            makeAlert(msg, alertType, this.id);
            jQuery(this.id).fadeIn();
        },
        clearMsg: function() {
            jQuery(this.id).fadeOut();
        }
    },
    init: function() {
        // Initialize the custom switches and forms
        // switches
        jQuery('input[type="checkbox"].switch').bootstrapToggle({
            on: "<small><i class='fa fa-arrow-left'></i> Override</small>",
            off: "<small>Use Values From Map</small>",
            onstyle: "default",
            offstyle: "primary",
            size: "normal"
        });
        // sliders
        jQuery(".param-slider").slider({
            formatter: function(value) {
                return value;
            }
        });
        jQuery("#env-param-slider").on("slide", function(slideEvt) {
            jQuery("#env-form-field").val(slideEvt.value);
        });
        jQuery("#eff-param-slider").on("slide", function(slideEvt) {
            jQuery("#eff-form-field").val(slideEvt.value);
        });
        // initialize listeners
        this.onControlChange();
        // perform initial form validation, to highlight forms
        this.onEachParameter();
    }
};
global.paramControl = paramControl;

function logIt() {
    console.log("***********");
    jQuery.each(Hydropower.params, function(k, v) {
        console.log("----");
        console.log(k);
        v.getFromForm();
        console.log("value =", v.value);
        console.log("valid?", v.validate());
    });
    console.log(Hydropower);
    console.log("***********");
}

//logIt();

/**
 * Reset Everything
 * reset the state of buttons, results window, infoWindow.
 * optional param dictates if drawing info is also removed.
 */
function resetAnalysis(clearLayers, clearHydropower) {
    // reset the analyze and results buttons to their initial state
    //buttonControl.analyze.reset();
    //buttonControl.results.reset();

    // clear layers and results stored from GP
    if (clearLayers) {
        drawnItems.clearLayers();
        watershedArea.clearLayers();
        gpControl.reset();
    }
    // rest all params and empty the results
    if (clearHydropower) {
        paramControl.reset();
    }
}

/**
 * calculationController: called from the Calculate Button. Talks to Hydropower
 * and paramControl.
 *
 */
function calculationController(autoTab) {
    // console.log(">>> Calculation Controller <<<");

    var success = Hydropower.calculatePower();
    if (success) {
        paramControl.onCalculateSuccess(autoTab);
    } else {
        paramControl.onCalculateFail();
    }
}