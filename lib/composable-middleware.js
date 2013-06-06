
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
          var mw= layer[0];
          var err_handling= layer[1];
          var next= running_next;
          if (err_handling) {
            running_next= function(err) {
              if (!err) next();
              else mw(err,req,res,next);
            };
          }
          else {
            running_next= function(err) {
              if (err) next(err);
              else mw(req,res,next);
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
        stack.push([a,a.length === 4]);
      }
    }
    return middleware;
  }

  use.apply(middleware,arguments);
  return middleware;
}
