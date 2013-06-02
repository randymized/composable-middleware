
/*
 * composable-middleware
 * https://github.com/randymized/composable-middleware
 *
 * Copyright (c) 2013 Randy McLaughlin
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(wares) {
  return function(req,res,next) {
    wares[0](req,res,next)
  }
};