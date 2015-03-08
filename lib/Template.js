'use strict';

var dot = require('dot');
var TEXT_HTML = 'text/html';

var Template = function(entity) {
  this.entity = entity;
  this.contentType = TEXT_HTML;
};

Template.load = function(path) {
  Template.dots = dot.process({path: path});
  return Template;
};

Template.prototype.render = function() {
  var self = this;
  var contentType = self.entity.sys.contentType;
  if (contentType) {
    return Template.dots[contentType.sys.id](self.entity);
  } else {
    return Template.dots[self.entity.sys.type.toLowerCase()](self.entity);
  }
};

module.exports = Template;
