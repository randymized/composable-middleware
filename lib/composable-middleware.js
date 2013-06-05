
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
      var nnext= out
      var enext= out
      for (var i= stack.length; i--; ) {
        (function (){
          var layer= stack[i];
          var next= nnext;
          if (layer !== null) {
            nnext= function(err) {
              if (err) enext(err);
              else layer(req,res,next);
            };
          }
          var elayer= errstack[i];
          if (elayer !== null) {
            enext= function(err) {
              elayer(err,req,res,next);
            };
          }
        })()
      }
      first= nnext;
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
