#!/usr/bin/env node

var fs = require('fs');
var util = require('util');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExist = function(infile) {
  var instr = infile.toString();
  if (!fs.existsSync(instr)) {
    console.log("%s does not exist. Exiting.", instr);
    process.exit(1);
  }
  return instr;
};

var cheerioHtmlFile = function(htmlfile) {
  return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
  $ = cheerioHtmlFile(htmlfile);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for (var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var makeCheck = function(htmlfile, checksfile) {
  var checkJson = checkHtmlFile(htmlfile, checksfile);
  var outJson = JSON.stringify(checkJson, null, 4);
  console.log(outJson);
};

var buildfn = function(checksfile) {
  var responseToCheck = function(result, response) {
    if (result instanceof Error) {
      console.error('Error: ' + util.format(response.message));
    } else {
      var tmpfile = "tmp.html";
      fs.writeFileSync(tmpfile, result);
      makeCheck(tmpfile, checksfile);
    }
  };
  return responseToCheck;
};

var clone = function(fn) {
  return fn.bind({});
};

if (require.main == module) {
  program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExist), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExist), HTMLFILE_DEFAULT)
    .option('-u, --url <html_url>', 'URL of index.html', 'none')
    .parse(process.argv);
  if (program.url === 'none') {
    makeCheck(program.file, program.checks);
  } else {
    var responseToCheck = buildfn(program.checks);
    restler.get(program.url).on('complete', responseToCheck);  
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
}
