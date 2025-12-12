const { join } = require('path');

/**
 * Puppeteer configuration for both local development and Render deployment
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Use environment variable if set, otherwise detect based on environment
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR ||
    (process.env.RENDER ? '/opt/render/project/.cache/puppeteer' :
    join(require('os').homedir(), '.cache', 'puppeteer')),
};
