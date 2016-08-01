'use strict';

var extend = require('extend-shallow');
var isValid = require('is-valid-app');
var tree = require('base-fs-tree');
var path = require('path');
var config;

module.exports = function(fn, firstConfig) {
  if (typeof fn !== 'function') {
    throw new TypeError('expected a function');
  }

  config = firstConfig;
  if (Array.isArray(config)) {
    config = { tasks: config };
  }

  config = config || {};

  return function plugin(app) {
    if (!isValid(this, 'verb-trees')) return;
    var origDest = app.options.dest || app.cwd;

    app.register('archy', function(sub) {
      if (!isValid(this, 'verb-trees-subgenerator')) return;
      this.enable('silent');
      this.use(fn);

      /**
       * Generate project trees
       */

      this.task('trees-setup', function(cb) {
        var opts = extend({dest: '.temp-trees'}, app.options, config);
        var name = opts.name || 'verb-trees';
        var dest = opts.dest || path.join(sub.cwd, '.temp-trees');
        if (!sub.trees) {
          sub.create('trees', {viewType: 'partial'});
        }
        sub.use(tree({name: name}));
        sub.option('dest', dest);
        sub.option('layout', false);
        sub.preRender(/./, function(file, next) {
          file.content = '{}';
          next();
        });
        cb();
      });

      this.task('trees-tasks', function(cb) {
        var opts = extend({dest: '.temp-trees'}, app.options, config);
        var taskArray = createTasks(sub, opts.tasks);
        if (taskArray.length) {
          sub.build(taskArray, cb);
        } else {
          cb();
        }
      });

      this.task('trees-include', function(cb) {
        if (!Object.keys(sub.trees.views).length) {
          cb(new Error('no tree views were created, cannot generate trees'));
          return;
        }
        if (typeof app.include !== 'function') {
          app.create('includes', {viewType: 'partial'});
        }
        app.include('trees-dest', {content: sub.compareTrees()});
        app.include('trees-src', {content: sub.createSrcTrees()});
        cb();
      });

      this.task('reset-dest', function(cb) {
        sub.option('dest', origDest);
        cb();
      });

      this.task('trees', [
        'trees-setup',
        'trees-tasks',
        'reset-dest',
        'trees-include'
      ]);
    });

    app.task('trees', function(cb) {
      app.generate('archy:trees', cb);
    });

    app.task('default', ['trees']);
    return plugin;
  };
};

function createTasks(app, tasks) {
  if (!tasks) return ['default'];
  tasks = Array.isArray(tasks) ? tasks : [tasks];
  var len = tasks.length;
  var idx = -1;
  var res = [];

  while (++idx < len) {
    var name = tasks[idx];
    var task = `tree-${name}`;
    res.push(task);
    app.task(task, [name], createTree(app));
  }

  if (!res.length) return ['default'];
  return res;
}

function createTree(app, options) {
  return function(cb) {
    var opts = extend({dest: '.temp-trees'}, app.options, options);
    var task = this;
    var name = task.name.replace(/^tree-/, '');
    app.createTrees({name: name, dest: opts.dest});
    if (app.enabled('verbose') || app.enabled('verbose.trees')) {
      app.log.time('creating tree for', app.log.green(name));
    }
    cb();
  };
}
