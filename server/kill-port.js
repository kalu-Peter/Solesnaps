#!/usr/bin/env node

const { exec } = require('child_process');
const { isPortAvailable, getPortProcess } = require('./src/utils/portUtils');

/**
 * Kill process using a specific port (Windows)
 * @param {number} port - Port number
 */
const killPortProcess = async (port) => {
  try {
    return new Promise((resolve, reject) => {
      // Find the process using the port
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          console.log(`No process found using port ${port}`);
          resolve(false);
          return;
        }

        const lines = stdout.trim().split('\n');
        const listeningLine = lines.find(line => line.includes('LISTENING'));

        if (!listeningLine) {
          console.log(`No listening process found on port ${port}`);
          resolve(false);
          return;
        }

        const parts = listeningLine.trim().split(/\s+/);
        const pid = parts[parts.length - 1];

        console.log(`Found process ${pid} using port ${port}`);
        
        // Kill the process
        exec(`taskkill /PID ${pid} /F`, (killError, killStdout) => {
          if (killError) {
            console.error(`Error killing process ${pid}:`, killError.message);
            reject(killError);
          } else {
            console.log(`Successfully killed process ${pid}`);
            resolve(true);
          }
        });
      });
    });
  } catch (error) {
    console.error('Error in killPortProcess:', error.message);
    return false;
  }
};

/**
 * Main function to handle port conflicts
 */
const main = async () => {
  const port = process.argv[2] ? parseInt(process.argv[2]) : 8080;
  
  console.log(`🔍 Checking port ${port}...`);
  
  const available = await isPortAvailable(port);
  
  if (available) {
    console.log(`✅ Port ${port} is available`);
    return;
  }
  
  console.log(`❌ Port ${port} is in use`);
  
  const processInfo = await getPortProcess(port);
  if (processInfo) {
    console.log(`🔍 Process info: ${processInfo}`);
  }
  
  // Ask if user wants to kill the process
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question(`Do you want to kill the process using port ${port}? (y/N): `, async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log(`🔄 Attempting to kill process using port ${port}...`);
      
      const killed = await killPortProcess(port);
      
      if (killed) {
        // Wait a moment and check again
        setTimeout(async () => {
          const nowAvailable = await isPortAvailable(port);
          if (nowAvailable) {
            console.log(`✅ Port ${port} is now available`);
          } else {
            console.log(`❌ Port ${port} is still in use`);
          }
          rl.close();
        }, 1000);
      } else {
        console.log(`❌ Could not kill process using port ${port}`);
        rl.close();
      }
    } else {
      console.log('Operation cancelled');
      rl.close();
    }
  });
};

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { killPortProcess };