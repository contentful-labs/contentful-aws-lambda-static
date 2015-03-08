'use strict';

var Promise = require('bluebird');
var util = require('util');
var _ = require('lodash');
var StaticPage = require('./lib/StaticPage');

exports.handler = function(event, context) {
  // Read options from the event.
  console.log('Reading options from event:\n', util.inspect(event, {depth: 2}));
  var templatesPromises = _.map(event.Records, function(record) {
    console.log('Reading record:\n', util.inspect(record, {depth: 2}));
    var recordJSON = new Buffer(record.kinesis.data, 'base64').toString('utf-8');
    return new StaticPage(recordJSON).generate();
  });
  console.log('Reading context:\n', util.inspect(context, {depth: 5}));
  Promise.all(templatesPromises).then(function(result) {
    context.done(null, result);
  }).catch(function(err) {
    context.done(err);
  });
};
