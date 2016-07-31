'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var generate = require('generate');
var isValid = require('is-valid-app');
var npm = require('npm-install-global');
var del = require('delete');
var project = require('generate-project');
var plugin = require('..');
var app;

var cwd = path.resolve.bind(path, process.cwd());
var tests = path.resolve.bind(path, __dirname);
var actual = path.resolve.bind(path, __dirname, 'actual');

function exists(name, cb) {
  return function(err) {
    if (err) return cb(err);
    fs.stat(actual(name), cb);
  };
}

describe('verb-trees', function() {
  this.slow(350);

  if (!process.env.CI && !process.env.TRAVIS) {
    before(function(cb) {
      npm.maybeInstall('generate', cb);
    });
  }

  before(function(cb) {
    del([tests('actual'), tests('trees')], cb);
  });

  after(function(cb) {
    del([tests('actual'), tests('trees')], cb);
  });

  beforeEach(function() {
    app = generate({silent: true});
    app.cwd = actual();
    app.use(require('generate-defaults'));
    app.use(require('generate-collections'));
    app.use(require('verb-repo-data'));
    app.use(plugin(project));

    // pre-populate template data to avoid prompts from `ask` helper
    app.option('askWhen', 'not-answered');
    app.option('dest', actual());
    app.option('trees', cwd('test/trees'));
    app.option('overwrite', function(file) {
      return /actual/.test(file.path);
    });
  });

  describe('trees', function() {
    it('should generate trees for all of the tasks', function(cb) {
      app.enable('overwrite');
      app.register('project', plugin(project, ['default', 'minimal', 'project']));
      app.generate('project:trees', cb);
    });

    it('should run the trees-setup task', function(cb) {
      app.register('project', plugin(project));
      app.generate('project.treeGenerator:trees-setup', cb);
    });

    it('should run the reset-dest task', function(cb) {
      app.register('project', plugin(project));
      app.generate('project.treeGenerator:reset-dest', cb);
    });
  });
});
