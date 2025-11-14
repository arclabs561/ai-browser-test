/**
 * Playwright Page Mock Utilities
 * 
 * Provides mock implementations of Playwright Page objects for testing
 * without requiring actual browser automation.
 */

/**
 * Create a mock Playwright Page object
 * 
 * @param {Object} options - Mock options
 * @returns {Object} Mock Page object
 */
export function createMockPage(options = {}) {
  const {
    html = '<html><body>Test</body></html>',
    viewport = { width: 1280, height: 720 },
    gameState = null,
    criticalCSS = {},
    domStructure = {}
  } = options;

  const mockPage = {
    viewportSize: async () => viewport,
    
    setViewportSize: async (size) => {
      Object.assign(viewport, size);
    },
    
    url: () => 'https://mock-page.example.com', // Playwright page.url() method
    
    goto: async (url, options = {}) => {
      // Mock navigation
      return { url, status: 200 };
    },
    
    content: async () => html,
    
    screenshot: async (options = {}) => {
      // Return mock screenshot path
      const path = options.path || `test-results/mock-${Date.now()}.png`;
      return Buffer.from('mock-screenshot-data');
    },
    
    evaluate: async (fn) => {
      // Execute function in mock context
      if (typeof fn === 'function') {
        // Create mock DOM environment
        const createMockElement = (selector) => {
          const element = {
            textContent: `Mock ${selector}`,
            classList: {
              contains: (cls) => false
            },
            getBoundingClientRect: () => ({
              x: 0, y: 0, width: 100, height: 50,
              top: 0, left: 0, bottom: 50, right: 100
            }),
            querySelector: (sel) => mockDocument.querySelector(sel),
            querySelectorAll: (sel) => mockDocument.querySelectorAll(sel)
          };
          return element;
        };
        
        // Create mock stylesheet
        const createMockStyleSheet = () => ({
          href: null,
          cssRules: [],
          [Symbol.iterator]: function* () {
            // Empty iterator for now, but make it iterable
          }
        });
        
        const mockDocument = {
          querySelector: (selector) => {
            // Return mock element for known selectors
            if (['#pride-parade', '#pride-footer', '#payment-code', '#game-paddle', '#game-ball', '.flag-row', '.code', 'body'].includes(selector)) {
              return createMockElement(selector);
            }
            return null;
          },
          querySelectorAll: (selector) => {
            const el = mockDocument.querySelector(selector);
            return el ? [el] : [];
          },
          title: 'Mock Page',
          activeElement: { tagName: 'BODY' },
          documentElement: {
            classList: {
              contains: (cls) => false
            }
          },
          // Add styleSheets for extractRenderedCode
          styleSheets: (() => {
            const sheets = [{
              href: null,
              cssRules: [{
                selectorText: 'body',
                cssText: 'body { color: black; }',
                style: {
                  getPropertyValue: (prop) => prop === 'color' ? 'black' : null
                }
              }]
            }];
            // Make iterable
            sheets[Symbol.iterator] = function* () {
              for (let i = 0; i < this.length; i++) {
                yield this[i];
              }
            };
            return sheets;
          })()
        };
        
        const mockWindow = {
          innerWidth: viewport.width,
          innerHeight: viewport.height,
          getComputedStyle: (el) => {
            if (!el) return {};
            return {
              position: 'static',
              top: '0px',
              bottom: 'auto',
              left: '0px',
              right: 'auto',
              width: '100px',
              height: '50px',
              backgroundColor: 'rgb(0, 0, 0)',
              color: 'rgb(255, 255, 255)',
              display: 'block',
              visibility: 'visible',
              zIndex: 'auto',
              transform: 'none',
              opacity: '1'
            };
          },
          matchMedia: (query) => ({ matches: false }),
          scrollBy: (x, y) => {},
          gameState: gameState || {
            gameActive: false,
            bricks: [],
            ball: null,
            paddle: null
          },
          document: mockDocument
        };
        
        // Make document available globally in the function context
        const context = {
          document: mockDocument,
          window: mockWindow,
          getComputedStyle: mockWindow.getComputedStyle.bind(mockWindow),
          querySelector: mockDocument.querySelector.bind(mockDocument),
          querySelectorAll: mockDocument.querySelectorAll.bind(mockDocument)
        };
        
        // Execute function with document and window in scope
        try {
          return fn.call(context, context);
        } catch (e) {
          // If function expects document/window as globals, try direct call
          // This handles cases where the function uses document directly
          const fnStr = fn.toString();
          if (fnStr.includes('document.') || fnStr.includes('window.')) {
            // Create a new function that has document/window in scope
            const wrappedFn = new Function(
              'document', 'window', 'getComputedStyle',
              `return (${fnStr})();`
            );
            return wrappedFn(mockDocument, mockWindow, mockWindow.getComputedStyle);
          }
          throw e;
        }
      }
      return fn;
    },
    
    waitForTimeout: async (ms) => {
      // Mock timeout
      return new Promise(resolve => setTimeout(resolve, Math.min(ms, 10)));
    },
    
    locator: (selector) => {
      return {
        first: () => ({
          isVisible: async () => true,
          click: async () => {},
          fill: async (text) => {}
        })
      };
    }
  };
  
  return mockPage;
}

/**
 * Create a mock Page with specific HTML content
 */
export function createMockPageWithHTML(html) {
  return createMockPage({ html });
}

/**
 * Create a mock Page with game state
 */
export function createMockPageWithGameState(gameState) {
  return createMockPage({ gameState });
}

