#!/usr/bin/env node

'use strict';
 
const ANSWERS_YES = ['yes', 'y'];

var list = require('select-shell')(
  {
    pointer: ' ▸ ',
    pointerColor: 'yellow',
    checked: ' ◉  ',
    unchecked:' ◎  ',
    checkedColor: 'blue',
    msgCancel: 'No selected options!',
    msgCancelColor: 'orange',
    multiSelect: true,
    inverse: true,
    prepend: true,
    disableInput: true
  }
);

const sanitizeOutput = (output) => {
  return output.trim().split('\n').map((item) => item.trim());
};

const makeList = (branches) => {
  branches.forEach(function(branch) {
    list.option(branch);
  });
  list.list();
  
  list.on('select', function(options){
    var rl = require('readline').createInterface(process.stdin, process.stdout);
    rl.question('Delete the selected branches? ', (answer) => {
      if (ANSWERS_YES.includes(answer.toLowerCase())) {
        deleteBranches(options.map((option) => option.value.replace('*', '').trim()));
      }
      process.exit(0);
    });
  });
  
  list.on('cancel', function(options){
    process.exit(0);
  });
};

const deleteBranches = (branches) => {
  var exec = require('child_process').execSync;

  var deleteCount = 0;
  var errors = new Array();

  branches.forEach((branch) => {
    try {
      var commandOutput = exec('(cd ' + location +' && git branch -d ' + branch + ')', {stdio: 'pipe'}).toString();
      console.log('****', commandOutput);
      if (commandOutput.toLowerCase.startsWith('deleted branch')) {
        deleteCount++;
      } else {
        errors.push(errorMessageFromOutput(commandOutput));
      }
    } catch (e) {
      errors.push(errorMessageFromOutput(e.message));
    }
  });

  if (deleteCount > 0) console.log('\x1b[32m', deleteCount + ' branche(s) deleted');
  if (errors.length > 0){
    console.log('\x1b[31m', '\nSome branches could not be deleted:\n');
    errors.forEach((error) => {
      console.log('\x1b[31m', '\n=> ', error);
    });
  }

  //Reset terminal color
  console.log('\x1b[0m');
};

const ERROR_PLACE_HOLDER = 'error:';

const errorMessageFromOutput = (errorOutput) => {
  return errorOutput.substr(errorOutput.indexOf(ERROR_PLACE_HOLDER));
}


// Main execution
var location = process.argv[2];

var exec = require('child_process').exec;
exec('(cd ' + location +' && git branch)', (error, stdout, stderr) => {
  var branches = sanitizeOutput(stdout);
  makeList(branches);
});


