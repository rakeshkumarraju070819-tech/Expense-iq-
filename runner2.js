const execSync = require('child_process').execSync;
const fs = require('fs');

const run = (cmd) => {
  try {
    console.log(`Running: ${cmd}`);
    execSync(cmd, {stdio: 'inherit'});
  } catch(e) {
    console.log(`Error running ${cmd}: ${e.message}`);
  }
};

run("git reset");
run("git rm -r --cached node_modules");
run("git add .");
run("git commit -m \"first commit\"");
run("git push -u origin main -f");
