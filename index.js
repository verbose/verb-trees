'use strict';

var isValid = require('is-valid-app');
var tree = require('base-fs-tree');
var path = require('path');

module.exports = function(tasks, options) {
module.exports = function(tasks, options) {
  if (typeof tasks === 'string') {
    tasks = [tasks];
  }

  if (!Array.isArray(tasks)) {
    options = tasks;
    tasks = null;
  }

  options = options || {};
  tasks = tasks || options.tasks || [];

  return function(app) {
    if (!isValid(app, 'verb-trees')) return;
    var origDest = app.options.dest || app.cwd;
    var called;

    /**
     * Generate project trees
     */

    app.task('trees-tasks', function(cb) {
      var name = options.name || 'verb-trees';
      origDest = app.options.dest || app.cwd;
      var dest = app.options.trees || path.join(app.cwd, '.temp-trees');
      if (!app.trees) {
        app.create('trees', {viewType: 'partial'});
      }

      app.enable('silent');
      app.use(tree({name: name}));
      app.option('dest', dest);
      app.option('layout', false);
      app.preRender(/./, function(file, next) {
        file.content = '{}';
        next();
      });

      var taskArray = createTasks(app, tasks);
      if (taskArray.length === 0) {
        cb();
        return;
      }

      app.build(taskArray, cb);
    });

    app.task('trees-emit', function(cb) {
      app.emit('trees', app.compareTrees(), cb);
    });

    app.task('reset-dest', function(cb) {
      app.option('dest', origDest);
      cb();
    });

    app.task('trees', ['trees-tasks', 'trees-emit', 'reset-dest']);
  };
}

function createTasks(app, tasks) {
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

  return res;
}

function createTree(app) {
  return function(cb) {
    var task = this;
    var dest = app.options.treesDest;
    var name = task.name.replace(/^tree-/, '');
    app.createTrees({name: name, dest: dest});
    app.log.time('creating tree for', app.log.green(name));
    cb();
  }
}
