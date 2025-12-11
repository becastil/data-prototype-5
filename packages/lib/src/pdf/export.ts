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
    logDebug('packages/lib/src/pdf/export.ts:36', 'init() entry', { initialized: this.initialized, hasBrowser: !!this.browser }, 'A')
    // #endregion
    if (this.initialized && this.browser) {
      return
    }
    
    // Dynamic import of puppeteer (Node.js only)
    const puppeteer = require('puppeteer')
    
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
        const { computeExecutablePath, Browser, install } = require('@puppeteer/browsers')
        const fs = require('fs')
        const os = require('os')
        const path = require('path')
        
        // Determine the cache directory - use PUPPETEER_CACHE_DIR if set, otherwise use default
        let cacheDir = process.env.PUPPETEER_CACHE_DIR
        if (!cacheDir) {
          // Try to get the default cache directory from Puppeteer
          try {
            // Puppeteer's default cache is typically in the user's home directory
            // On Render.com, it might be /opt/render/.cache/puppeteer
            // On other systems, it's usually ~/.cache/puppeteer
            const homeDir = os.homedir()
            if (fs.existsSync('/opt/render')) {
              // Likely on Render.com
              cacheDir = '/opt/render/.cache/puppeteer'
            } else {
              cacheDir = path.join(homeDir, '.cache', 'puppeteer')
            }
          } catch {
            cacheDir = path.join(os.homedir(), '.cache', 'puppeteer')
          }
        }
        
        // Try multiple cache directory locations
        const possibleCacheDirs = [
          cacheDir,
          process.env.PUPPETEER_CACHE_DIR,
          '/opt/render/.cache/puppeteer', // Render default
          path.join(os.homedir(), '.cache', 'puppeteer'), // Standard user cache
        ].filter(Boolean) as string[]
        
        // Remove duplicates
        const uniqueCacheDirs = Array.from(new Set(possibleCacheDirs))
        
        // #region agent log
        logDebug('packages/lib/src/pdf/export.ts:65', 'cache directories to check', { possibleCacheDirs: uniqueCacheDirs, envCacheDir: process.env.PUPPETEER_CACHE_DIR || null, homeDir: os.homedir(), selectedCacheDir: cacheDir }, 'C')
        // #endregion
        
        let foundExecutable = false
        for (const testCacheDir of uniqueCacheDirs) {
          try {
            const computedPath = computeExecutablePath({
              browser: Browser.CHROME,
              cacheDir: testCacheDir,
            })
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:70', 'computed path for cache dir', { cacheDir: testCacheDir, computedPath }, 'C')
            // #endregion
            
            // Verify the executable exists
            const exists = fs.existsSync(computedPath)
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:76', 'computed path exists check', { computedPath, exists }, 'C')
            // #endregion
            if (exists) {
              executablePath = computedPath
              foundExecutable = true
              console.log(`Found Chrome executable at: ${executablePath}`)
              break
            }
          } catch (dirError) {
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:82', 'cache dir error', { cacheDir: testCacheDir, error: dirError instanceof Error ? dirError.message : String(dirError) }, 'C')
            // #endregion
            // Try next cache directory
            continue
          }
        }
        
        // If Chrome not found, try to install it
        if (!foundExecutable && cacheDir) {
          // #region agent log
          logDebug('packages/lib/src/pdf/export.ts:88', 'no executable found, attempting to install Chrome', { cacheDir }, 'D')
          // #endregion
          try {
            console.log(`Chrome not found. Installing Chrome to ${cacheDir}...`)
            // Ensure cache directory exists
            if (!fs.existsSync(cacheDir)) {
              fs.mkdirSync(cacheDir, { recursive: true })
            }
            
            // Install Chrome
            const installedBrowser = await install({
              browser: Browser.CHROME,
              cacheDir,
            })
            
            // Get the path to the installed browser
            executablePath = computeExecutablePath({
              browser: Browser.CHROME,
              cacheDir,
            })
            
            // Verify it exists
            if (fs.existsSync(executablePath)) {
              foundExecutable = true
              console.log(`Chrome installed and found at: ${executablePath}`)
            }
          } catch (installError) {
            // #region agent log
            logDebug('packages/lib/src/pdf/export.ts:install', 'Chrome installation failed', { error: installError instanceof Error ? installError.message : String(installError) }, 'D')
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
    } else {
      console.warn('No explicit Chrome executable path set, Puppeteer will attempt to find Chrome automatically')
      // If we couldn't find Chrome, provide a helpful error message
      try {
        const os = require('os')
        const fs = require('fs')
        const path = require('path')
        const suggestedCacheDir = process.env.PUPPETEER_CACHE_DIR || 
                                  (fs.existsSync('/opt/render') ? '/opt/render/.cache/puppeteer' : path.join(os.homedir(), '.cache', 'puppeteer'))
        console.warn(`If Chrome is not found, ensure it's installed by running: npx puppeteer browsers install chrome`)
        console.warn(`Expected cache directory: ${suggestedCacheDir}`)
      } catch {
        // Ignore errors in warning message
      }
    }
    // #region agent log
    logDebug('packages/lib/src/pdf/export.ts:115', 'launch options before puppeteer.launch', { hasExecutablePath: !!launchOptions.executablePath, executablePath: launchOptions.executablePath || null, args: launchOptions.args }, 'A')
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
      
      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })
      
      // Wait for content to be ready
      await page.waitForSelector('.report-card', { timeout: 10000 }).catch(() => {
        console.warn('Report card selector not found, continuing anyway')
      })
      
      // Additional wait for charts to render
      await page.waitForTimeout(2000)
      
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

