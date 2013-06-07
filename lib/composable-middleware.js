
/*
 * composable-middleware
 * https://github.com/randymized/composable-middleware
 *
 * Copyright (c) 2013 Randy McLaughlin
 * Licensed under the MIT license.
 */

'use strict';

module.exports= function composable_middleware(components) {
  var stack= [];

  function middleware(req,res,out) {
    var layer= 0;
    var stacklength= stack.length;
    (function next(err) {
      var fn= stack[layer++];
      if (!fn) {
        return out(err);
      }
      else {
        if (err) {
          if (fn.length == 4) {
            fn(err,req,res,next);
          }
          else {
            next(err);
          }
        }
        else {
          if (fn.length == 3) {
            fn(req,res,next);
          }
          else {
            next();
          }
        }
      }
    })()
  }

  var use= middleware.use= function(mw) {
    for (var i=0, len=arguments.length; i<len; i++) {
      var a= arguments[i];
      if (Array.isArray(a)) {
        use.apply(this,a)
      }
      else {
        stack.push(a);
      }
    }
    return middleware;
  }

  use.apply(middleware,arguments);
  return middleware;
}
