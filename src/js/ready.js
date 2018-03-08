/**
 * layout.js
 *
 * initialize the interface between UI and business logic
 */

/**
 * Document On-Ready Listener: set the buttons and messages to initial state
 */
var $ = require("jquery");
require("./utils");

// $(document).ready(function() {
$("#about-btn").click(function() {
    $("#aboutModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    return false;
});

$(".btn-goToDrawing").click(function() {
    console.log("goToDrawing");
    $("#tabStep1").trigger("click");
});
$(".btn-goToParams").click(function() {
    console.log("goToParams");
    $("#tabStep2").trigger("click");
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

// make sure things are hidden
$(".gp-msg").hide();
//$("#site-tab-results").hide();

console.log("document is ready");
console.log("*****************************");
// });

/**
 * Document On-Load Listener: when everything is ready, remove the loading screen
 */
// $(document).on("load", function() {
$("#loading").hide();
console.log("window is loaded");
// });