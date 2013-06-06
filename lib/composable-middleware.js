
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
    var first= null;
    function build() {
      var running_next= out
      for (var i= stack.length; i--; ) {
        (function (){
          var layer= stack[i];
          var elayer= errstack[i];
          var next= running_next;
          if (layer !== null) {
            running_next= function(err) {
              if (err) next(err);
              else layer(req,res,next);
            };
          }
          else {
            running_next= function(err) {
              if (!err) next();
              else elayer(err,req,res,next);
            };
          }
        })()
      }
      first= running_next;
    }

    if (first === null) build();
    first();
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
