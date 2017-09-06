/**
 * utils.js
 */

/**
 * shorthand function for generating status messages in a Bootstrap alert.
 * Provides some default messages.
 */
function makeAlert(msg, alertType, elementID) {
  
  var defaultMsg = null;
  if (alertType == 'info') {
    defaultMsg = 'The request has been processed.';
  } else if  (alertType == 'success') {
    defaultMsg = 'Success!';
  } else if (alertType == 'warning') {
    defaultMsg = "Something didn't work quite as expected.";
  } else if (alertType == 'danger') {
    defaultMsg = "There was an error.";
  } else {
    defaultMsg = "(Something went wrong generating this alert)";
    alertType = 'error';
  }
  
  var alert = "";
  var div1 = '<div class="alert alert-' + alertType + '" role="alert"><small>';
  var div2 = '</small></div>';
  if (msg) {
    alert =  div1 + msg + div2 ;
  } else {
    alert =  div1 + defaultMsg + div2;
  }
  
  if (elementID) {
    // if it the element exists
    var liElem = $('#' + where);
    if (liElem.length > 0) {
      // insert the alert there
      liElem.html(alert);
    } else {
      return false;
    }
  } else {
    // otherwise, just return the alert
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