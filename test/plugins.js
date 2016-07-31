'use strict';

require('mocha');
var assert = require('assert');
var generate = require('generate');
var project = require('generate-project');
var plugin = require('..');
var app;

describe('verb-trees', function() {
  beforeEach(function() {
    app = generate();
  });

  describe('plugin', function() {
    it('should work as a plugin', function() {
      app.use(plugin(project));
      assert(app.tasks.hasOwnProperty('default'));
      assert(app.tasks.hasOwnProperty('trees'));
    });

    it('should only register the plugin once', function(cb) {
      var count = 0;
      app.on('plugin', function(name) {
        if (name === 'verb-trees') {
          count++;
        }
      });
      app.use(plugin(project));
      app.use(plugin(project));
      app.use(plugin(project));
      assert.equal(count, 1);
      cb();
    });
  });
});
