/**
 * layout.js
 *
 * initialize the interface between UI and business logic
 */

/**
 * Document On-Ready Listener: set the buttons and messages to initial state
 */
$(document).on("ready", function() {

	$("#about-btn").click(function() {
		$("#aboutModal").modal("show");
		$(".navbar-collapse.in").collapse("hide");
		return false;
	});
	
	$('.btn-goToParams').click(function(){
		$('#tabStep1').trigger('click');
	});
  
  // build the message control init
  //messageControl.init(map);
  //messageControl.onDrawStart();
  
  // set up the buttons
  buttonControl.init();
	
	// set up the parameter control
	paramControl.init();
	
	// set up the draw control
	drawControl.initDrawListeners(map);
	
	
	console.log("document is ready");
});

/**
 * Document On-Load Listener: when everything is ready, remove the loading screen
 */
$(document).on("load", function() {
	$("#loading").hide();
	console.log("window is loaded");
});