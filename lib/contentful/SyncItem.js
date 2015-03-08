'use strict';

var SyncItem = function(config, itemData) {
  var documentId = itemData.sys.id;
  this.PartitionKey = documentId;
  this.Data = JSON.stringify({
    entity: itemData,
    config: config
  });
};

module.exports = SyncItem;
