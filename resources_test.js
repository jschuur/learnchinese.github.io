var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

var categories = require('./categories.json');
var resources = [];

var doc = new GoogleSpreadsheet('1VfrT-1Kjv8gYRo-YBltUhb67OWHxmODlBAzwkgebgeE');
var sheet;

async.series([
  function setAuth(step) {
    var creds = require('./google-creds.json');

    doc.useServiceAccountAuth(creds, step);
  },
  function loadResources(step) {
    doc.getInfo(function(err, info) {
      console.log('Loaded doc: ' + info.title);
      sheet = info.worksheets[0];

      sheet.getRows({
        offset: 1,
        limit: 1000
      }, function( err, rows ) {
        console.log('Read '+ rows.length +' rows');
        resources = rows;

        step();
      });
    });
  },
  function processResources(step) {
    console.log(resources.length  + ' resources loaded');

    for (category in categories) {
      youtube_channels = resources.filter(resource => resource.category == 'Youtube Channels (Language)');

      youtube_channels.sort(resource => !resource.highlighted).forEach(resource => {
        console.log(resource.name + ' (' + resource.highlighted + ')');
      });
    };

    step();
  }],
  function (err) {
    if( err ) {
      console.log('Error: '+err);
    }
  });
