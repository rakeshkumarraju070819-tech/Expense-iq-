const fs = require('fs');
const execSync = require('child_process').execSync;
const path = require('path');

try {
  const gitPath = path.join(__dirname, 'expenseiq', 'frontend', '.git');
  if (fs.existsSync(gitPath)) {
    fs.rmSync(gitPath, { recursive: true, force: true });
    console.log("Deleted frontend/.git");
  } else {
    console.log("frontend/.git not found");
  }
} catch(e) {
  console.log("Error deleting .git: ", e.message);
}

const run = (cmd) => {
  try {
    console.log(`Running: ${cmd}`);
    execSync(cmd, {stdio: 'inherit'});
  } catch(e) {
    console.log(`Error running ${cmd}: ${e.message}`);
  }
};

run("git init");
run("git add .");
run("git commit -m \"first commit\"");
run("git branch -M main");
run("git remote remove origin");
run("git remote add origin https://github.com/rakeshkumarraju070819-tech/Expense-iq-.git");
run("git push -u origin main");
