'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var SyncItem = require('./SyncItem');

var AWS = require('aws-sdk');

var SyncResponse = function(config, response) {
  this.kinesisClient = new AWS.Kinesis({region: config.aws.region});
  this.payload = JSON.parse(response.body);
  this.resolver = Promise.pending();
  this.promise = this.resolver.promise;
  this.config = config;
  this.statistics = {};
};

SyncResponse.prototype.items = function() {
  var self = this;
  return _.map(self.payload.items, function(item) {
    return new SyncItem(self.config, item);
  });
};

SyncResponse.prototype.handle = function() {
  var self = this;
  var items = self.items();
  console.log(self.items());
  if (items.length === 0) {
    self.resolver.fulfill(items);
  } else {
    self.kinesisClient.putRecords({
      Records: items,
      StreamName: self.config.aws.kinesis.streamName
    }, function(err, result) {
      if (err) {
        self.resolver.reject(err);
      } else {
        self.resolver.fulfill(result);
      }
    });
  }
  return self.promise;
};

SyncResponse.prototype.consumeQueue = function() {
  var self = this;
  var currentItem = self.processQueue.pop();
  if (currentItem) {
    currentItem.process().then(function() {
      var type = currentItem.type();
      if (self.statistics[type]) {
        self.statistics[type] += 1;
      } else {
        self.statistics[type] = 1;
      }
      self.consumeQueue();
    });
  } else {
    self.resolver.fulfill(self.statistics);
  }
};

SyncResponse.prototype.nextPageUrl = function() {
  var self = this;
  return self.payload.nextPageUrl;
};

SyncResponse.prototype.nextSyncUrl = function() {
  var self = this;
  return self.payload.nextSyncUrl;
};

module.exports = SyncResponse;
