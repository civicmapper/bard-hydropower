/**
 * layout.js
 *
 * scripts for interacting with the main Bootrap UI
 */

$("#about-btn").click(function() {
	$("#aboutModal").modal("show");
	$(".navbar-collapse.in").collapse("hide");
	return false;
});

$("#params-btn").click(function() {
	$("#paramsModal").modal("show");
	$(".navbar-collapse.in").collapse("hide");
	return false;
});