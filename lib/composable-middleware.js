
/*
 * composable-middleware
 * https://github.com/randymized/composable-middleware
 *
 * Copyright (c) 2013 Randy McLaughlin
 * Licensed under the MIT license.
 */

'use strict';

module.exports= function composable_middleware(stack) {
  if (stack === null) stack= [];
  return function middleware(req,res,out) {
    var layer= 0;
    var stacklength= stack.length;
    (function next(err) {
      if (err) {
        //todo: if (err) send only to err handling middleware or to out
        out(err);
      }
      else if (layer >= stacklength) {
        return out();
      }
      else {
        stack[layer++](req,res,next)
      }
    })()
  }
}
