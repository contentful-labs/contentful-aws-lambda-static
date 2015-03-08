'use strict';

var questor = require('questor');

var DEFAULT_HOST = 'cdn.contentful.com';

var SyncClient = function(config) {
  this.config = config;
};

SyncClient.prototype.requestOptions = function() {
  var self = this;
  var options = {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + self.config.accessToken
    }
  };
  return options;
};

SyncClient.prototype.initialUrl = function() {
  var self = this;
  var host = self.config.host || DEFAULT_HOST;
  var space = self.config.space;
  return [
    'https://',
    host,
    '/spaces/',
    space,
    '/sync?initial=true'
  ].join('');
};

SyncClient.prototype.request = function(url) {
  var self = this;
  if (url) {
    return questor(url, self.requestOptions());
  } else {
    return questor(self.initialUrl(), self.requestOptions());
  }
};

module.exports = SyncClient;
