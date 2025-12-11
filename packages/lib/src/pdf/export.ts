/**
 * PDF Exporter using Puppeteer
 * Singleton service for generating PDFs from dashboard pages
 */

import type { PdfExportOptions, PdfExportResult, PagePath } from './types'

// Puppeteer types - will be imported in actual implementation
type Browser = any
type Page = any
type PDFOptions = any

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
      if (!executablePath || !require('fs').existsSync(executablePath)) {
        throw new Error('Executable path not found')
      }
    } catch (error) {
      // If that fails, try using @puppeteer/browsers to get the path
      try {
        const { computeExecutablePath, Browser } = require('@puppeteer/browsers')
        const fs = require('fs')
        const os = require('os')
        
        // Try multiple cache directory locations (Render uses /opt/render/.cache/puppeteer)
        const possibleCacheDirs = [
          process.env.PUPPETEER_CACHE_DIR,
          '/opt/render/.cache/puppeteer', // Render default
          os.homedir() + '/.cache/puppeteer', // Standard user cache
        ].filter(Boolean) as string[]
        
        let foundExecutable = false
        for (const cacheDir of possibleCacheDirs) {
          try {
            const computedPath = computeExecutablePath({
              browser: Browser.CHROME,
              cacheDir,
            })
            
            // Verify the executable exists
            if (fs.existsSync(computedPath)) {
              executablePath = computedPath
              foundExecutable = true
              console.log(`Found Chrome executable at: ${executablePath}`)
              break
            }
          } catch (dirError) {
            // Try next cache directory
            continue
          }
        }
        
        if (!foundExecutable) {
          console.warn('Chrome executable not found in any cache directory. Attempting to use system Chrome.')
          executablePath = undefined
        }
      } catch (browsersError) {
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
    }
    
    this.browser = await puppeteer.launch(launchOptions)
    
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

