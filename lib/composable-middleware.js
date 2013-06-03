
/*
 * composable-middleware
 * https://github.com/randymized/composable-middleware
 *
 * Copyright (c) 2013 Randy McLaughlin
 * Licensed under the MIT license.
 */

'use strict';

module.exports= function composable_middleware(components) {
  var stack= []
  var errstack= []

  function middleware(req,res,out) {
    var layer= 0;
    var stacklength= stack.length;
    (function next(err) {
      if (err) {
        if (layer >= stacklength) {
          return out(err);
        }
        var fn= errstack[layer++];
        if (fn !== null) {
          fn(err,req,res,next)
        }
        else {
          next(err)
        }
      }
      else {
        if (layer >= stacklength) {
          return out();
        }
        var fn= stack[layer++];
        if (fn !== null) {
          fn(req,res,next)
        }
        else {
          next()
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
        if (a.length === 4) {
          stack.push(null);
          errstack.push(a);
        }
        else {
          stack.push(a);
          errstack.push(null);
        }
      }
    }
    return middleware;
  }

  use.apply(middleware,arguments);
  return middleware;
}
