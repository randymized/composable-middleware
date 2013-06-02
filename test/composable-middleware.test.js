
'use strict';

require('should');
var http = require('http');
var request = require('request');
var composable = require('../');
var port= 3000;

var composable_middleware = require( '../lib/composable-middleware.js' );

function serve(middleware,requests) {
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
        throw err;
      }
    });
  })
  requests(function(done) {
    server.close(function() {
      if (done) done();
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

describe( 'this test server', function() {
  it( 'should run a simple request through very simple middleware', function(done) {
    serve(
      function(req,res,next) {
        res.send('ok');
      },
      function(cb) {
        get('/','ok',done);
      }
    );
    composable_middleware.should.be.a( 'function' );
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
} );
