const net = require('net');

/**
 * Check if a port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is available, false otherwise
 */
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
};

/**
 * Find an available port starting from the preferred port
 * @param {number} preferredPort - The preferred port to start checking from
 * @param {number} maxAttempts - Maximum number of ports to try (default: 10)
 * @returns {Promise<number>} - Available port number
 */
const findAvailablePort = async (preferredPort, maxAttempts = 10) => {
  for (let i = 0; i < maxAttempts; i++) {
    const portToCheck = preferredPort + i;
    const available = await isPortAvailable(portToCheck);
    
    if (available) {
      return portToCheck;
    }
  }
  
  throw new Error(`Could not find an available port after checking ${maxAttempts} ports starting from ${preferredPort}`);
};

/**
 * Get the process using a specific port (Windows only)
 * @param {number} port - Port number to check
 * @returns {Promise<string|null>} - Process information or null if not found
 */
const getPortProcess = async (port) => {
  try {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
          resolve(null);
          return;
        }
        
        const lines = stdout.trim().split('\n');
        const listeningLine = lines.find(line => line.includes('LISTENING'));
        
        if (listeningLine) {
          const parts = listeningLine.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          resolve(`PID: ${pid}`);
        } else {
          resolve(null);
        }
      });
    });
  } catch (error) {
    return null;
  }
};

module.exports = {
  isPortAvailable,
  findAvailablePort,
  getPortProcess
};