#!/usr/bin/env node

'use strict';
 
const ANSWERS_YES = ['yes', 'y'];
const TERMINAL_GREEN = '\x1b[32m';
const TERMINAL_RED = '\x1b[31m';
const TERMINAL_YELLOW = '\x1b[33m';
const TERMINAL_RESET = '\x1b[0m';
const ERROR_PLACE_HOLDER = 'error:';

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

const printInstructions = () => {
  console.log('Version', require('./package.json').version);
  console.log(TERMINAL_GREEN, "\n* <Up> & <Down> to navigate\n* <Space> to select\n* <Enter> to proceed or exit\n* <Esc> to cancel\n", TERMINAL_RESET);
};

const exit = () => {
  //Reset terminal color
  console.log(TERMINAL_RESET);
  process.exit(0);
}

const makeList = (branches) => {
  branches.forEach(function(branch) {
    list.option(branch);
  });
  list.list();
  
  list.on('select', function(options){
    if (options !== null && options.length === 0) {
      exit();
    }

    var rl = require('readline').createInterface(process.stdin, process.stdout);
    rl.question('\nDelete the selected branches? (yes/no) ', (answer) => {
      if (ANSWERS_YES.includes(answer.toLowerCase())) {
        deleteBranches(options.map((option) => option.value.replace('*', '').trim()));
      }
      exit();
    });
  });
  
  list.on('cancel', function(options){
    exit();
  });
};

const deleteBranches = (branches) => {
  var exec = require('child_process').execSync;

  var deleteCount = 0;
  var errors = new Array();

  branches.forEach((branch) => {
    try {
      var commandOutput = exec('(cd ' + location +' && git branch -d ' + branch + ')', {stdio: 'pipe'}).toString();

      if (commandOutput.trim().toLowerCase().startsWith('deleted branch')) {
        deleteCount++;
      } else {
        errors.push(errorMessageFromOutput(commandOutput));
      }
    } catch (e) {
      errors.push(errorMessageFromOutput(e.message));
    }
  });

  if (deleteCount > 0) console.log(TERMINAL_GREEN, deleteCount + ' branche(s) deleted');

  errors = errors.filter(Boolean);
  if (errors.length > 0) printErrors(errors);
};

const printErrors = (errors) => {
  console.log(TERMINAL_RED, '\nSome branches could not be deleted:\n');
  errors.forEach((error) => {
    console.log(TERMINAL_RED, '\n=> ', error);
  });
}

const errorMessageFromOutput = (errorOutput) => {
  const errorPlaceHolderIndex = errorOutput.indexOf(ERROR_PLACE_HOLDER);
  if (errorOutput.length <= 1) return null;
  if (errorPlaceHolderIndex === -1) return errorOutput.trim();
  return errorOutput.substr(errorPlaceHolderIndex + ERROR_PLACE_HOLDER.length).trim();
};

const parseLocation = () => {
  return process.argv[2] || '.';
};

// Main execution
var location = parseLocation();

printInstructions();

var exec = require('child_process').exec;
exec('(cd ' + location +' && git branch)', (error, stdout, stderr) => {
  var branches = stdout.trim().split('\n')
    .map((item) => item.trim())
    .filter((item) => item);

  if (branches.length === 0) {
    console.log(TERMINAL_YELLOW, 'No branches found at ', location);
    exit();
  } else {
    makeList(branches);
  }
});


