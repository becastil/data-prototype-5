/**
 * PDF Exporter using Puppeteer
 * Singleton service for generating PDFs from dashboard pages
 */

import type { PdfExportOptions, PdfExportResult, PagePath } from './types'

// Puppeteer types - will be imported in actual implementation
type Browser = any
type Page = any
type PDFOptions = any

// #region agent log helper
const logDebug = (location: string, message: string, data: any, hypothesisId: string) => {
  try {
    const fs = require('fs')
    const path = require('path')
    const cwd = process.cwd()
    const logDir = path.join(cwd, '.cursor')
    const logPath = path.join(logDir, 'debug.log')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    const logEntry = JSON.stringify({ location, message, data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId, cwd }) + '\n'
    fs.appendFileSync(logPath, logEntry, 'utf8')
    // Also log to console as fallback
    console.log(`[DEBUG] ${location}: ${message}`, data)
  } catch (e) {
    console.error('[DEBUG LOG FAILED]', location, message, e)
  }
}
// #endregion

/**
 * PDF Exporter Class (Singleton)
 */
export class PdfExporter {
  private static instance: PdfExporter | null = null
  private browser: Browser | null = null
  private initialized: boolean = false
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): PdfExporter {
    if (!PdfExporter.instance) {
      PdfExporter.instance = new PdfExporter()
    }
    return PdfExporter.instance
  }
  
  /**
   * Initialize Puppeteer browser
   */
  public async init(): Promise<void> {
    // #region agent log
    const os = require('os')
    const fs = require('fs')
    const path = require('path')
    logDebug('packages/lib/src/pdf/export.ts:36', 'init() entry', { 
      initialized: this.initialized, 
      hasBrowser: !!this.browser,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      homeDir: os.homedir(),
      cwd: process.cwd(),
      envPUPPETEER_CACHE_DIR: process.env.PUPPETEER_CACHE_DIR || null,
      hasOptRender: fs.existsSync('/opt/render'),
      hasHomeCache: fs.existsSync(path.join(os.homedir(), '.cache')),
      hasOptRenderCache: fs.existsSync('/opt/render/.cache/puppeteer'),
    }, 'A')
    // #endregion
    if (this.initialized && this.browser) {
      return
    }
    
    // Dynamic import of puppeteer (Node.js only)
    const puppeteer = require('puppeteer')
    // #region agent log
    logDebug('packages/lib/src/pdf/export.ts:66', 'puppeteer module loaded', { 
      puppeteerVersion: puppeteer.version || 'unknown',
      hasExecutablePath: typeof puppeteer.executablePath === 'function',
    }, 'A')
    // #endregion
    
    // Get the executable path for Chrome
    // First try puppeteer's executablePath, then try @puppeteer/browsers
    let executablePath: string | undefined
    try {
      // Try to get the executable path from puppeteer
      executablePath = puppeteer.executablePath()
      // #region agent log
      logDebug('packages/lib/src/pdf/export.ts:49', 'puppeteer.executablePath() result', { executablePath: executablePath || null }, 'A')
      // #endregion
      const fs = require('fs')
      const pathExists = executablePath ? fs.existsSync(executablePath) : false
      // #region agent log
      logDebug('packages/lib/src/pdf/export.ts:51', 'executablePath exists check', { executablePath: executablePath || null, exists: pathExists }, 'A')
      // #endregion
      if (!executablePath || !pathExists) {
        throw new Error('Executable path not found')
      }
    } catch (error) {
      // #region agent log
      logDebug('packages/lib/src/pdf/export.ts:53', 'puppeteer.executablePath() failed', { error: error instanceof Error ? error.message : String(error) }, 'B')
      // #endregion
      // If that fails, try using @puppeteer/browsers to get the path
      try {
        const { computeExecutablePath, Browser, install, getInstalledBrowsers } = require('@puppeteer/browsers')
        const fs = require('fs')
        const os = require('os')
        const path = require('path')
        
        // First, try to get the cache directory that Puppeteer actually uses
        // This is the directory where Chrome was installed during the build
        let cacheDir = process.env.PUPPETEER_CACHE_DIR
        // #region agent log
        logDebug('packages/lib/src/pdf/export.ts:97', 'cache directory selection start', {
          envCacheDir: cacheDir || null,
        }, 'B')
        // #endregion

        // If not set, try to detect where Puppeteer installed Chrome
        if (!cacheDir) {
          try {
            const homeDir = os.homedir()
            // Expanded list of possible cache directories
            const defaultCacheDirs = [
              '/opt/render/project/.cache/puppeteer', // Render project cache (npm installs here)
              '/opt/render/project/node_modules/.cache/puppeteer', // Alternative npm location
              path.join(homeDir, '.cache', 'puppeteer'),
              '/opt/render/.cache/puppeteer', // Render user cache
              path.join(homeDir, '.local', 'share', 'puppeteer'),
              '/tmp/puppeteer', // Fallback temp location
            ]

            // Try to use getInstalledBrowsers if available to find where Chrome is actually installed
            // Note: getInstalledBrowsers is async in newer versions
            if (typeof getInstalledBrowsers === 'function') {
              // Check which cache directory actually has Chrome installed
              for (const testCacheDir of defaultCacheDirs) {
                try {
                  // getInstalledBrowsers may be sync or async depending on version
                  let installedBrowsers = getInstalledBrowsers({ cacheDir: testCacheDir })
                  // Handle both sync and async versions
                  if (installedBrowsers && typeof installedBrowsers.then === 'function') {
                    installedBrowsers = await installedBrowsers
                  }
                  // #region agent log
                  logDebug('packages/lib/src/pdf/export.ts:120', 'checking for installed browsers', {
                    cacheDir: testCacheDir,
                    installedBrowsers: installedBrowsers ? installedBrowsers.map((b: any) => ({ browser: b.browser, path: b.path })) : [],
                  }, 'B')
                  // #endregion
                  if (installedBrowsers && installedBrowsers.length > 0) {
                    cacheDir = testCacheDir
                    // #region agent log
                    logDebug('packages/lib/src/pdf/export.ts:127', 'found installed browsers, using cache dir', {
                      cacheDir,
                    }, 'B')
                    // #endregion
                    break
                  }
                } catch (checkError) {
                  // Continue to next cache directory
                  continue
                }
              }
            }

            // If still not found, manually scan for Chrome in known locations
            if (!cacheDir) {
              for (const testCacheDir of defaultCacheDirs) {
                try {
                  if (fs.existsSync(testCacheDir)) {
                    // Look for chrome directory structure
                    const contents = fs.readdirSync(testCacheDir)
                    if (contents.some((item: string) => item.includes('chrome'))) {
                      cacheDir = testCacheDir
                      // #region agent log
                      logDebug('packages/lib/src/pdf/export.ts:145', 'found chrome directory via manual scan', {
                        cacheDir,
                        contents,
                      }, 'B')
                      // #endregion
                      break
                    }
                  }
                } catch {
                  continue
                }
              }
            }

            // If still not found, use environment-based detection
            if (!cacheDir) {
              const hasOptRender = fs.existsSync('/opt/render')
              // #region agent log
              logDebug('packages/lib/src/pdf/export.ts:139', 'environment detection (no installed browsers found)', {
                homeDir,
                hasOptRender,
                optRenderExists: fs.existsSync('/opt/render'),
                hasGetInstalledBrowsers: typeof getInstalledBrowsers === 'function',
              }, 'B')
              // #endregion
              if (hasOptRender) {
                // Likely on Render.com - use project cache first
                cacheDir = '/opt/render/project/.cache/puppeteer'
              } else {
                cacheDir = path.join(homeDir, '.cache', 'puppeteer')
              }
              // #region agent log
              logDebug('packages/lib/src/pdf/export.ts:149', 'cache directory selected', {
                cacheDir,
                cacheDirExists: fs.existsSync(cacheDir),
              }, 'B')
              // #endregion
            }
          } catch (cacheDirError) {
            cacheDir = path.join(os.homedir(), '.cache', 'puppeteer')
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:156', 'cache directory selection error, using fallback', {
              error: cacheDirError instanceof Error ? cacheDirError.message : String(cacheDirError),
              fallbackCacheDir: cacheDir,
            }, 'B')
            // #endregion
          }
        }
        
        // Try multiple cache directory locations (including the one we detected)
        const possibleCacheDirs = [
          cacheDir, // Use detected/selected cache directory first
          process.env.PUPPETEER_CACHE_DIR,
          '/opt/render/project/.cache/puppeteer', // Render project cache (npm installs here)
          '/opt/render/project/node_modules/.cache/puppeteer', // Alternative npm location
          path.join(os.homedir(), '.cache', 'puppeteer'), // Standard user cache
          '/opt/render/.cache/puppeteer', // Render user cache
          path.join(os.homedir(), '.local', 'share', 'puppeteer'), // Alternative location
          '/tmp/puppeteer', // Fallback temp location
        ].filter(Boolean) as string[]
        
        // Remove duplicates
        const uniqueCacheDirs = Array.from(new Set(possibleCacheDirs))
        
        // #region agent log
        logDebug('packages/lib/src/pdf/export.ts:65', 'cache directories to check', { possibleCacheDirs: uniqueCacheDirs, envCacheDir: process.env.PUPPETEER_CACHE_DIR || null, homeDir: os.homedir(), selectedCacheDir: cacheDir }, 'C')
        // #endregion
        
        let foundExecutable = false
        for (const testCacheDir of uniqueCacheDirs) {
          try {
            // #region agent log
            const cacheDirExists = fs.existsSync(testCacheDir)
            let cacheDirContents: string[] = []
            try {
              if (cacheDirExists) {
                cacheDirContents = fs.readdirSync(testCacheDir)
              }
            } catch (readError) {
              // Ignore read errors
            }
            logDebug('packages/lib/src/pdf/export.ts:132', 'checking cache directory', { 
              cacheDir: testCacheDir, 
              exists: cacheDirExists,
              contents: cacheDirContents,
              canRead: cacheDirExists,
            }, 'C')
            // #endregion
            
            const computedPath = computeExecutablePath({
              browser: Browser.CHROME,
              cacheDir: testCacheDir,
            })
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:139', 'computed path for cache dir', { cacheDir: testCacheDir, computedPath }, 'C')
            // #endregion
            
            // Verify the executable exists
            const exists = fs.existsSync(computedPath)
            // #region agent log
            let executableStats = null
            try {
              if (exists) {
                executableStats = {
                  isFile: fs.statSync(computedPath).isFile(),
                  isExecutable: (fs.statSync(computedPath).mode & parseInt('111', 8)) !== 0,
                  size: fs.statSync(computedPath).size,
                }
              }
            } catch (statError) {
              // Ignore stat errors
            }
            logDebug('packages/lib/src/pdf/export.ts:145', 'computed path exists check', { 
              computedPath, 
              exists,
              stats: executableStats,
              parentDir: path.dirname(computedPath),
              parentDirExists: fs.existsSync(path.dirname(computedPath)),
            }, 'C')
            // #endregion
            if (exists) {
              executablePath = computedPath
              foundExecutable = true
              console.log(`Found Chrome executable at: ${executablePath}`)
              break
            }
          } catch (dirError) {
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:157', 'cache dir error', { cacheDir: testCacheDir, error: dirError instanceof Error ? dirError.message : String(dirError), stack: dirError instanceof Error ? dirError.stack : null }, 'C')
            // #endregion
            // Try next cache directory
            continue
          }
        }
        
        // If Chrome not found, try to install it
        if (!foundExecutable && cacheDir) {
          // #region agent log
          logDebug('packages/lib/src/pdf/export.ts:165', 'no executable found, attempting to install Chrome', { 
            cacheDir,
            cacheDirExists: fs.existsSync(cacheDir),
            cacheDirWritable: (() => {
              try {
                if (!fs.existsSync(cacheDir)) {
                  fs.mkdirSync(cacheDir, { recursive: true })
                }
                const testFile = path.join(cacheDir, '.test-write')
                fs.writeFileSync(testFile, 'test')
                fs.unlinkSync(testFile)
                return true
              } catch {
                return false
              }
            })(),
          }, 'D')
          // #endregion
          try {
            console.log(`Chrome not found. Installing Chrome to ${cacheDir}...`)
            // Ensure cache directory exists
            const cacheDirExisted = fs.existsSync(cacheDir)
            if (!cacheDirExisted) {
              fs.mkdirSync(cacheDir, { recursive: true })
              // #region agent log
              logDebug('packages/lib/src/pdf/export.ts:172', 'created cache directory', { cacheDir, created: true }, 'D')
              // #endregion
            }
            
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:175', 'starting Chrome installation', { 
              cacheDir,
              browser: Browser.CHROME,
            }, 'D')
            // #endregion
            
            // Install Chrome
            const installStartTime = Date.now()
            const installedBrowser = await install({
              browser: Browser.CHROME,
              cacheDir,
            })
            const installDuration = Date.now() - installStartTime
            
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:185', 'Chrome installation completed', { 
              installDuration,
              installedBrowser: installedBrowser ? 'success' : 'failed',
            }, 'D')
            // #endregion
            
            // Get the path to the installed browser
            executablePath = computeExecutablePath({
              browser: Browser.CHROME,
              cacheDir,
            })
            
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:193', 'post-install executable path computation', { 
              executablePath,
              exists: fs.existsSync(executablePath),
            }, 'D')
            // #endregion
            
            // Verify it exists
            if (fs.existsSync(executablePath)) {
              foundExecutable = true
              console.log(`Chrome installed and found at: ${executablePath}`)
            } else {
              // #region agent log
              const parentDir = path.dirname(executablePath)
              let parentContents: string[] = []
              try {
                if (fs.existsSync(parentDir)) {
                  parentContents = fs.readdirSync(parentDir)
                }
              } catch (readError) {
                // Ignore
              }
              logDebug('packages/lib/src/pdf/export.ts:201', 'executable not found after installation', { 
                executablePath,
                parentDir,
                parentDirExists: fs.existsSync(parentDir),
                parentContents,
              }, 'D')
              // #endregion
            }
          } catch (installError) {
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:210', 'Chrome installation failed', { 
              error: installError instanceof Error ? installError.message : String(installError),
              stack: installError instanceof Error ? installError.stack : null,
              cacheDir,
              cacheDirExists: fs.existsSync(cacheDir),
            }, 'D')
            // #endregion
            console.warn('Failed to install Chrome automatically:', installError instanceof Error ? installError.message : String(installError))
          }
        }
        
        if (!foundExecutable) {
          // #region agent log
          logDebug('packages/lib/src/pdf/export.ts:88', 'no executable found in cache dirs after install attempt', { checkedDirs: uniqueCacheDirs }, 'D')
          // #endregion
          console.warn('Chrome executable not found. Puppeteer will attempt to find Chrome automatically, but this may fail.')
          executablePath = undefined
        }
      } catch (browsersError) {
        // #region agent log
        logDebug('packages/lib/src/pdf/export.ts:92', '@puppeteer/browsers error', { error: browsersError instanceof Error ? browsersError.message : String(browsersError) }, 'E')
        // #endregion
        console.warn('Could not determine Chrome executable path using @puppeteer/browsers, Puppeteer will attempt to find it automatically')
        executablePath = undefined
      }
    }
    
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--single-process',
      ],
    }
    
    // Set executablePath if we found one
    if (executablePath) {
      launchOptions.executablePath = executablePath
      console.log(`Using Chrome executable at: ${executablePath}`)
      // #region agent log
      logDebug('packages/lib/src/pdf/export.ts:231', 'executable path set in launch options', { 
        executablePath,
        exists: fs.existsSync(executablePath),
      }, 'A')
      // #endregion
    } else {
      console.warn('No explicit Chrome executable path set, Puppeteer will attempt to find Chrome automatically')
      // If we couldn't find Chrome, provide a helpful error message
      try {
        const suggestedCacheDir = process.env.PUPPETEER_CACHE_DIR || 
                                  (fs.existsSync('/opt/render') ? '/opt/render/.cache/puppeteer' : path.join(os.homedir(), '.cache', 'puppeteer'))
        console.warn(`If Chrome is not found, ensure it's installed by running: npx puppeteer browsers install chrome`)
        console.warn(`Expected cache directory: ${suggestedCacheDir}`)
        // #region agent log
        logDebug('packages/lib/src/pdf/export.ts:241', 'no executable path, will rely on puppeteer auto-detection', { 
          suggestedCacheDir,
          suggestedCacheDirExists: fs.existsSync(suggestedCacheDir),
        }, 'A')
        // #endregion
      } catch {
        // Ignore errors in warning message
      }
    }
    // #region agent log
    logDebug('packages/lib/src/pdf/export.ts:248', 'launch options before puppeteer.launch', { 
      hasExecutablePath: !!launchOptions.executablePath, 
      executablePath: launchOptions.executablePath || null, 
      args: launchOptions.args,
      headless: launchOptions.headless,
    }, 'A')
    // #endregion
    
    try {
      this.browser = await puppeteer.launch(launchOptions)
      // #region agent log
      logDebug('packages/lib/src/pdf/export.ts:119', 'puppeteer.launch() succeeded', { hasBrowser: !!this.browser }, 'A')
      // #endregion
    } catch (launchError) {
      // #region agent log
      logDebug('packages/lib/src/pdf/export.ts:119', 'puppeteer.launch() failed', { error: launchError instanceof Error ? launchError.message : String(launchError), stack: launchError instanceof Error ? launchError.stack : null, launchOptions }, 'A')
      // #endregion
      
      // Provide a more helpful error message
      const errorMessage = launchError instanceof Error ? launchError.message : String(launchError)
      if (errorMessage.includes('Could not find Chrome') || errorMessage.includes('No usable sandbox')) {
        try {
          const os = require('os')
          const fs = require('fs')
          const path = require('path')
          const suggestedCacheDir = process.env.PUPPETEER_CACHE_DIR || 
                                    (fs.existsSync('/opt/render') ? '/opt/render/.cache/puppeteer' : path.join(os.homedir(), '.cache', 'puppeteer'))
          throw new Error(
            `Chrome not found for PDF generation. Please ensure Chrome is installed by running: ` +
            `npx puppeteer browsers install chrome. ` +
            `Expected cache directory: ${suggestedCacheDir}. ` +
            `Original error: ${errorMessage}`
          )
        } catch (enhancedError) {
          throw enhancedError instanceof Error ? enhancedError : launchError
        }
      }
      throw launchError
    }
    
    this.initialized = true
  }
  
  /**
   * Close browser instance
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.initialized = false
    }
  }
  
  /**
   * Export a single page to PDF
   */
  public async exportPage(url: string): Promise<Buffer> {
    if (!this.initialized || !this.browser) {
      await this.init()
    }
    
    const page: Page = await this.browser.newPage()
    
    try {
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1280,
        height: 1024,
        deviceScaleFactor: 2, // High DPI for crisp rendering
      })
      
      // Navigate to page - use 'domcontentloaded' for faster initial load
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      })

      // Wait for content to be ready (shorter timeout)
      await page.waitForSelector('.report-card', { timeout: 5000 }).catch(() => {
        // Content may already be rendered, continue
      })

      // Brief wait for any final rendering (reduced from 2000ms)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Generate PDF
      const pdfOptions: PDFOptions = {
        format: 'Letter',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.75in',
          left: '0.5in',
        },
        displayHeaderFooter: false,
      }
      
      // Generate PDF
      const buffer = await page.pdf(pdfOptions)
      
      return Buffer.from(buffer)
    } finally {
      await page.close()
    }
  }
  
  /**
   * Export multiple pages to a single PDF
   */
  public async export(options: PdfExportOptions): Promise<PdfExportResult> {
    try {
      const { baseUrl, clientId, planYearId, pages, filename } = options
      
      // For now, export first page only
      // Full implementation would merge multiple PDFs
      if (pages.length === 0) {
        return {
          success: false,
          filename: filename || 'report.pdf',
          error: 'No pages specified',
          pageCount: 0,
        }
      }
      
      const firstPageUrl = `${baseUrl}${pages[0]}?clientId=${clientId}&planYearId=${planYearId}&print=true`
      const buffer = await this.exportPage(firstPageUrl)
      
      return {
        success: true,
        filename: filename || 'medical-report.pdf',
        buffer,
        pageCount: 1,
      }
    } catch (error) {
      return {
        success: false,
        filename: options.filename || 'report.pdf',
        error: error instanceof Error ? error.message : 'Unknown error',
        pageCount: 0,
      }
    }
  }
  
  /**
   * Get default template page order
   */
  public static getTemplatePageOrder(): PagePath[] {
    return [
      '/dashboard/executive',
      '/dashboard/monthly',
      '/dashboard/hcc',
      '/dashboard/plan/hdhp',
      '/dashboard/plan/ppo-base',
      '/dashboard/plan/ppo-buyup',
      '/dashboard/inputs',
      '/dashboard/summary',
    ]
  }
}

/**
 * Get singleton instance (convenience export)
 */
export function getPdfExporter(): PdfExporter {
  return PdfExporter.getInstance()
}

