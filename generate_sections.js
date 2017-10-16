var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var fs = require('fs-extra');

var categories = require('./categories.json');
var resources = 0;

var doc = new GoogleSpreadsheet('1VfrT-1Kjv8gYRo-YBltUhb67OWHxmODlBAzwkgebgeE');
var sheet;

function toSlug(str) {
  return str.replace(/ /g, '-').replace(/[()]/g, '').toLowerCase();
}

function sectionFilename(category) {
  return filename = '_sections/' +
                    (Object.keys(categories).indexOf(category) + 1).toString().padStart(2, '0') + '-' +
                    toSlug(category) + '.md';
}

function appendResource(category, resource) {
  if(category = categories[resource.category]) {
    var filename = sectionFilename(resource.category);

    var line = `* [${resource.name}](${resource.url})`
    if(resource.description) line += ` - ${resource.description}`;
    line += '\n';

    fs.appendFileSync(filename, line, (err) => {
      if (err) throw err;
    });
  } else {
    console.log('Skipping unknown category ' + resource.category);
  };
  process.stdout.write('.');
}

async.series([
  function setAuth(step) {
    var creds = require('./google-creds.json');

    doc.useServiceAccountAuth(creds, step);
  },
  function init(step) {
    doc.getInfo(function(err, info) {
      console.log('Loaded doc: ' + info.title);
      sheet = info.worksheets[0];

      fs.removeSync('_sections');
      fs.mkdirSync('_sections');

      for (category in categories) {
        var filename = sectionFilename(category);
        var slug = categories[category].slug || toSlug(category);

        var header = `---\nlayout: page\ntitle:  "${category}"\npermalink: /${slug}/\n---\n`
        if(categories[category].intro) header += categories[category].intro + '\n\n';

        fs.appendFileSync(filename, header, (err) => {
          if (err) throw err;
        });
      }

      step();
    });
  },
  function generateSections(step) {
    sheet.getRows({
      offset: 1,
      limit: 1000
    }, function( err, rows ){
      console.log('Read '+ rows.length +' rows');
      rows.forEach(function(row) {
        appendResource(row.category, row);
        resources++;
      });
      step();
    });
  },
  function done(step) {
    console.log(' DONE');
    console.log(resources + ' resources parsed')

    step();
  }], function(err){
    if( err ) {
      console.log('Error: '+err);
    }
});
