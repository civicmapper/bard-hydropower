/**
 * utils.js
 */

/**
 * Helper: truncate value based on number of decimals
 */
var _round = function(num, len) {
  return Math.round(num * (Math.pow(10, len))) / (Math.pow(10, len));
};