'use strict';

var util = require('util');
var Sync = require('./lib/contentful/Sync');

exports.handler = function(event, context) {
  // Read options from the event.
  var syncConfig = event;
  var sync = Sync.fromConfig(syncConfig);
  console.log('Reading options from event:\n', util.inspect(event, {depth: 5}));
  console.log('Reading context:\n', util.inspect(context, {depth: 5}));
  sync.run().then(function(result) {
    context.done(null, result);
  });
};
