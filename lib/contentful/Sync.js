'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var SyncResponse = require('./SyncResponse');
var SyncClient = require('./SyncClient');

var SYNC_URL_ID = 'CF_contentful_syncurl';

var AWS = require('aws-sdk');


var Sync = function(config, syncClient) {
  this.config = config;
  this.s3 = new AWS.S3({region: config.aws.region});
  this.syncClient = syncClient;
  this.resolver = Promise.pending();
  this.statistics = {
    requests: 0,
    items: 0,
  };
  this.promise = this.resolver.promise;
};

Sync.fromConfig = function(config) {
  var syncClient = new SyncClient(config.contentful);
  return new Sync(config, syncClient);
};

Sync.prototype.run = function(callback) {
  var self = this;
  self.s3.getObject({
    Key: SYNC_URL_ID,
    Bucket: self.config.aws.s3.bucket
  }, function(err, result) {
    console.log('TOKEN', result);
    console.log(err);
    if (err) {
      var initialRequest = self.syncClient.request();
      self.handleResponse(initialRequest);
    } else {
      var lastSyncToken = JSON.parse(result.Body);
      self.lastSyncToken = lastSyncToken;
      console.log('last_url', lastSyncToken.url);
      var request = self.syncClient.request(lastSyncToken.url);
        self.handleResponse(request, callback);
    }
  });
  return self.promise;
};

Sync.prototype.handleResponse = function(request) {
  var self = this;
  if (self.verbose) {
    console.log('processing sync response');
  }
  self.statistics.requests += 1;
  request.then(function(rawResponse) {
    var response = new SyncResponse(self.config, rawResponse);
    response.handle().then(function(requestStatistics) {
      var nextPageUrl = response.nextPageUrl();
      self.statistics.items += _.reduce(requestStatistics, function(total, number) {
        return total + number;
      }, 0);
      if (self.verbose) {
        console.log([
          'processed',
          self.statistics.items,
          'items'
        ].join(' '));
      }
      if (nextPageUrl) {
        var nextRequest = self.syncClient.request(nextPageUrl);
        self.handleResponse(nextRequest);
      } else {
        self.saveNextSyncUrl(response.nextSyncUrl());
      }
    });
  });
};

Sync.prototype.saveNextSyncUrl = function(nextSyncUrl) {
  var self = this;
  var payload = {url: nextSyncUrl};
  if (self.lastSyncToken) {
    if (self.lastSyncToken.url === nextSyncUrl) {
      return self.resolver.fulfill(self.statistics);
    }
  }
  self.s3.putObject({
    Bucket: self.config.aws.s3.bucket,
    Key: SYNC_URL_ID,
    Body: JSON.stringify(payload),
    ContentType: 'application/json'
  }, function(err, result) {
    console.log(err, result);
    if (err) {
      self.resolver.reject(err);
    } else {
      self.resolver.fulfill(self.statistics);
    }
  });
};

module.exports = Sync;
