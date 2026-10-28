/**
 * FixIt Now - Test Runner & Log Generator
 * Executes tests/srs_functional_requirements.test.js via Child Process,
 * captures raw output directly into test_run_log.txt, and prints execution results.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const logFile = path.resolve(projectRoot, 'test_run_log.txt');

console.log('Running automated test suite via node --test...');

const child = spawn(process.execPath, ['--test', 'tests/srs_functional_requirements.test.js'], {
  cwd: projectRoot,
  env: { ...process.env, NODE_ENV: 'test' },
});

let stdoutBuffer = '';
let stderrBuffer = '';

child.stdout.on('data', (data) => {
  const str = data.toString();
  stdoutBuffer += str;
  process.stdout.write(str);
});

child.stderr.on('data', (data) => {
  const str = data.toString();
  stderrBuffer += str;
  process.stderr.write(str);
});

child.on('close', (exitCode) => {
  const fullLog = `================================================================================
FIXIT NOW - AUTOMATED TEST EXECUTION LOG
Command: node --test tests/srs_functional_requirements.test.js
Date: ${new Date().toISOString()}
Exit Code: ${exitCode}
================================================================================

--- STDOUT ---
${stdoutBuffer}

--- STDERR ---
${stderrBuffer}
================================================================================
`;

  fs.writeFileSync(logFile, fullLog, 'utf8');
  console.log(`\nRaw test runner output recorded into ${logFile}`);
});
