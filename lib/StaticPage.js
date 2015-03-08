'use strict';

var Promise = require('bluebird');
var AWS = require('aws-sdk');
var util = require('util');

var Template = require('./Template').load('./templates');

var StaticPage = function(recordJSON) {
  this.record = JSON.parse(recordJSON);
  this.config = this.record.config;
  this.resolver = Promise.pending();
  this.s3 = new AWS.S3({region: this.config.aws.region});
  this.template = new Template(this.record.entity);
  this.promise = this.resolver.promise;
};

StaticPage.prototype.body = function() {
  var self = this;
  return self.template.render();
};

StaticPage.prototype.key = function() {
  var sys = this.record.entity.sys;
  return sys.type.toLowerCase() + '/' + sys.id;
};

StaticPage.prototype.generate = function() {
  console.log('generating', util.inspect(this.record.entity, {depth: 5}));
  var self = this;
  self.s3.putObject({
    ACL: 'public-read',
    Bucket: self.config.aws.s3.bucket,
    Key: self.key(),
    Body: self.body(),
    ContentType: self.template.contentType
  }, function(err, result) {
    console.log(err, result);
    if (err) {
      self.resolver.reject(err);
    } else {
      self.resolver.fulfill(self.statistics);
    }
  });
  return self.promise;
};

module.exports = StaticPage;
