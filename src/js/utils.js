/**
 * utils.js
 */

var _delay = (function() {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

/**
 * Helper: truncate value based on number of decimals
 */
var _round = function(num, len) {
    return Math.round(num * Math.pow(10, len)) / Math.pow(10, len);
};

var _checkIfNum = function(val) {
    return parseFloat(val);
    /*
        if (isNaN(parseFloat(val))) {
          return false;
        } else {
          return true;
        }
        */
};

module.exports = {
    _delay: _delay,
    _round: _round,
    _checkIfNum: _checkIfNum
};