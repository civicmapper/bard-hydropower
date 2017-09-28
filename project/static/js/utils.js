/**
 * utils.js
 */

/**
 * shorthand function for generating status messages in a Bootstrap alert.
 * Provides some default messages. if elementID is spec'd, will automatically
 * put the alert in place; otherwise returns alert's html as string.
 * Uses a custom "alert-none" css class for a non-alert element that fills the
 * space of an alert.
 */
function makeAlert(msg, alertType, elementID) {
  
  var defaultMsg = null;
  if (alertType == 'info') {
    defaultMsg = 'The request has been processed.';
  } else if  (alertType == 'success') {
    defaultMsg = 'Success!';
  } else if (alertType == 'warning') {
    defaultMsg = "There is something you need to attend to.";
  } else if (alertType == 'danger') {
    defaultMsg = "There was an error.";
  } else if (alertType == 'none') {
    defaultMsg = "";
  } else {
    defaultMsg = "";
    alertType = 'none';
  }
  
  var alert = "";
  var close = '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
  var div1 = '<div class="alert alert-' + alertType + '" role="alert">';
  var div2 = '</div>';
  if (msg) {
    console.log(msg);
    alert =  div1 + close + msg + div2 ;
  } else {
    alert =  div1 + defaultMsg + div2;
  }
  
  if (elementID) {
    // if it the element exists
    var liElem = $('#' + elementID);
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
 * Helper: truncate value based on number of decimals
 */
var _round = function(num, len) {
  return Math.round(num * (Math.pow(10, len))) / (Math.pow(10, len));
};

Number.prototype.isFloat = function() {
    return (this % 1 !== 0);
};

var _checkIfNum = function (val) {
  return parseFloat(val);
  /*
  if (isNaN(parseFloat(val))) {
    return false;
  } else {
    return true;
  }
  */
};