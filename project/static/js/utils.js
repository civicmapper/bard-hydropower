/**
 * utils.js
 */

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