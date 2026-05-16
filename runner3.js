const execSync = require('child_process').execSync;
const fs = require('fs');
const path = require('path');

const lockPath = path.join(__dirname, '.git', 'index.lock');
if (fs.existsSync(lockPath)) {
  try {
    fs.unlinkSync(lockPath);
    console.log("Deleted index.lock");
  } catch(e) {
    console.log("Could not delete index.lock: ", e.message);
  }
}

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
