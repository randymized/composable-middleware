
'use strict';

require('should');
var http = require('http');
var request = require('request');
var async = require('async');
var composable = require('../');
var port= 3000;

var composable_middleware = require( '../lib/composable-middleware.js' );

function serve(middleware,requests,done) {
  var server= http.createServer(function(req,res){
    res.send= function(status,body) {
      if (1 == arguments.length) {
        body= status;
        status= 200;
      }
      this.statusCode= status;
      this.end(body);
    }
    middleware(req,res,function(err) {
      if (err) {
        done(err);
      }
    });
  })
  async.series(requests,function (){
    server.close(function() {
      done();
    });
  })
  server.listen(port)
}

function get(url,expected,done) {
  request.get('http://localhost:'+port+url, function (error, response, body) {
    response.statusCode.should.equal(200);
    body.should.equal(expected);
    done();
  })
}

var prepare_msg=
  function(req,res,next) {
    req.msg= '';
    next();
  };
var send_msg=
  function(req,res,next) {
    res.send(req.msg);
  };

describe( 'this test server', function() {
  it( 'should run a simple request through very simple middleware', function(done) {
    serve(
      function(req,res,next) {
        res.send('ok');
      },
      [
        function(cb) {
          get('/','ok',cb)
        },
      ],
      done
    );
  } );
  it( 'should be able to run a second time', function(done) {
    serve(
      function(req,res,next) {
        res.send('ok');
      },
      [
        function(cb) {
          get('/','ok',cb)
        },
      ],
      done
    );
  } );
} );
describe( 'composable-middleware', function() {
  describe( 'composable_middleware()', function() {
    it( 'should be a function', function() {
      composable_middleware.should.be.a( 'function' );
    } );
    it( 'should return a function', function() {
      composable_middleware().should.be.a( 'function' );
    } );
  } );
  it( 'should run a simple request through simple middleware', function(done) {
    serve(
      composable([
        function(req,res,next) {
          res.send('okay');
        }
      ]),
      [
        function(cb) {
          get('/','okay',cb)
        },
      ],
      done
    );
  } );
  it( 'should run a simple request through two layers of middleware', function(done) {
    serve(
      composable([
        function(req,res,next) {
          req.msg= 'it is ';
          next();
        },
        function(req,res,next) {
          res.send(req.msg+'okay');
        }
      ]),
      [
        function(cb) {
          get('/','it is okay',cb)
        },
      ],
      done
    );
  } );
  it( 'should support multiple steps in the function argument without them being wrapped in an array', function(done) {
    serve(
      composable(
        function(req,res,next) {
          req.msg= 'it is ';
          next();
        },
        function(req,res,next) {
          res.send(req.msg+'okay');
        }
      ),
      [
        function(cb) {
          get('/','it is okay',cb)
        },
      ],
      done
    );
  } );
  it( 'should run a middleware within middleware', function(done) {
    serve(
      composable(
        function(req,res,next) {
          req.msg= 'a';
          next();
        },
        composable([
          function(req,res,next) {
            req.msg+= '1';
            next();
          },
          function(req,res,next) {
            req.msg+= '2';
            next();
          },
        ]),
        function(req,res,next) {
          res.send(req.msg+'b');
        }
      ),
      [
        function(cb) {
          get('/','a12b',cb)
        },
      ],
      done
    );
  } );
  it( 'should run a middleware within middleware where inner is first', function(done) {
    serve(
      composable(
        composable(
          function(req,res,next) {
            req.msg= '1';
            next();
          },
          function(req,res,next) {
            req.msg+= '2';
            next();
          }
        ),
        function(req,res,next) {
          req.msg+= 'a';
          next();
        },
        function(req,res,next) {
          res.send(req.msg+'b');
        }
      ),
      [
        function(cb) {
          get('/','12ab',cb)
        },
      ],
      done
    );
  } );
  it( 'should run a middleware within middleware where inner is last', function(done) {
    serve(
      composable(
        function(req,res,next) {
          req.msg= 'a';
          next();
        },
        function(req,res,next) {
          req.msg+= 'b';
          next();
        },
        composable(
          function(req,res,next) {
            req.msg+= '1';
            next();
          },
          function(req,res,next) {
            req.msg+= '2';
            res.send(req.msg);
          }
        )
      ),
      [
        function(cb) {
          get('/','ab12',cb)
        },
      ],
      done
    );
  } );
  it( 'should allow middleware to be referenced by a variable', function(done) {
    var onetwo=
      composable(
        function(req,res,next) {
          req.msg+= '1';
          next();
        },
        function(req,res,next) {
          req.msg+= '2';
          res.send(req.msg);
        }
      );

    var ab=
      composable(
        function(req,res,next) {
          req.msg= 'a';
          next();
        },
        function(req,res,next) {
          req.msg+= 'b';
          next();
        },
        onetwo
      );

    serve(
      ab,
      [
        function(cb) {
          get('/','ab12',cb)
        },
      ],
      done
    );
  } );
  it( 'should allow concatenation of middleware', function(done) {
    var mw= function(symbol){
      return function(req,res,next) {
        req.msg+= symbol;
        next();
        }
      };

    var onetwo=
      composable(
        mw('1'),
        mw('2')
      );

    var ab=
      composable(
        mw('a'),
        mw('b')
      );

    serve(
      composable(
        prepare_msg,
        onetwo,
        ab,
        send_msg
      ),
      [
        function(cb) {
          get('/','12ab',cb)
        },
      ],
      done
    );
  } );
  it( 'should support a use function', function(done) {
    var mw= function(symbol){
      return function(req,res,next) {
        req.msg+= symbol;
        next();
        }
      };

    var onetwo=
      composable()
        .use(mw('1'))
        .use(mw('2'));

    var ab=
      composable()
        .use(mw('a'))
        .use(mw('b'));

    serve(
      composable(
        prepare_msg,
        onetwo,
        ab,
        send_msg
      ),
      [
        function(cb) {
          get('/','12ab',cb)
        },
      ],
      done
    );
  } );
} );
