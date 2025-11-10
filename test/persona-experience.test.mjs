/**
 * Tests for persona-experience.mjs
 * Requires mocking Playwright Page objects
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  experiencePageAsPersona,
  experiencePageWithPersonas
} from '../src/persona-experience.mjs';
import { createMockPage } from './helpers/mock-page.mjs';

describe('experiencePageAsPersona', () => {
  it('should experience page from persona perspective', async () => {
    const mockPage = createMockPage({
      html: '<html><body><h1>Test Page</h1></body></html>'
    });
    
    const persona = {
      name: 'Test Persona',
      device: 'desktop',
      goals: ['read', 'click button']
    };
    
    const result = await experiencePageAsPersona(mockPage, persona, {
      url: 'about:blank',
      captureScreenshots: false,
      timeScale: 'human'
    });
    
    assert.ok(typeof result === 'object');
    assert.strictEqual(result.persona, 'Test Persona');
    assert.strictEqual(result.device, 'desktop');
    assert.ok(Array.isArray(result.notes));
    assert.ok(result.notes.length > 0);
    assert.ok(typeof result.duration === 'number');
    assert.strictEqual(result.timeScale, 'human');
  });

  it('should handle different device types', async () => {
    const mockPage = createMockPage();
    
    const personas = [
      { name: 'Mobile', device: 'mobile' },
      { name: 'Tablet', device: 'tablet' },
      { name: 'Desktop', device: 'desktop' }
    ];
    
    for (const persona of personas) {
      const result = await experiencePageAsPersona(mockPage, persona, {
        captureScreenshots: false,
        timeScale: 'human'
      });
      
      assert.strictEqual(result.device, persona.device);
      assert.ok(result.viewport);
    }
  });

  it('should handle personas with goals', async () => {
    const mockPage = createMockPage();
    
    const persona = {
      name: 'Interactive Persona',
      goals: ['click button', 'type input', 'scroll']
    };
    
    const result = await experiencePageAsPersona(mockPage, persona, {
      captureScreenshots: false,
      timeScale: 'human'
    });
    
    assert.ok(result.notes.some(note => note.step?.includes('interaction')));
  });

  it('should use human time scale by default', async () => {
    const mockPage = createMockPage();
    
    const persona = { name: 'Test' };
    
    const result = await experiencePageAsPersona(mockPage, persona, {
      captureScreenshots: false
    });
    
    assert.strictEqual(result.timeScale, 'human');
  });

  it('should capture state when requested', async () => {
    const mockPage = createMockPage({
      gameState: { gameActive: true, score: 100 }
    });
    
    const persona = { name: 'Test' };
    
    const result = await experiencePageAsPersona(mockPage, persona, {
      captureState: true,
      captureScreenshots: false
    });
    
    assert.ok(result.pageState);
  });
});

describe('experiencePageWithPersonas', () => {
  it('should experience page with multiple personas', async () => {
    const mockPage = createMockPage();
    
    const personas = [
      { name: 'Persona 1', device: 'desktop' },
      { name: 'Persona 2', device: 'mobile' }
    ];
    
    const results = await experiencePageWithPersonas(mockPage, personas, {
      captureScreenshots: false
    });
    
    assert.ok(Array.isArray(results));
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].persona, 'Persona 1');
    assert.strictEqual(results[1].persona, 'Persona 2');
  });
});

