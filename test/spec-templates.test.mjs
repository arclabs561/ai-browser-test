/**
 * Spec Templates Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  createSpecFromTemplate,
  composeTemplates,
  inheritTemplate,
  registerTemplate,
  listTemplates,
  getTemplate,
  validateTemplate,
  TEMPLATES
} from '../src/spec-templates.mjs';
import { validateSpec, parseSpec } from '../src/natural-language-specs.mjs';

describe('Spec Templates', () => {
  
  test('createSpecFromTemplate - basic game template', () => {
    const spec = createSpecFromTemplate('game', {
      url: 'example.com',
      activationKey: 'g',
      selector: ', selector: #game-paddle'
    });
    
    assert.ok(spec.includes('example.com'));
    assert.ok(spec.includes("press 'g'"));
    assert.ok(spec.includes('#game-paddle'));
    assert.ok(spec.includes('Given I visit'));
    assert.ok(spec.includes('When I activate'));
    assert.ok(spec.includes('Then the game should be playable'));
  });
  
  test('createSpecFromTemplate - accessibility template', () => {
    const spec = createSpecFromTemplate('accessibility', {
      url: 'example.com'
    });
    
    assert.ok(spec.includes('example.com'));
    assert.ok(spec.includes('should be accessible'));
    assert.ok(spec.includes('WCAG standards'));
  });
  
  test('createSpecFromTemplate - with temporal', () => {
    const spec = createSpecFromTemplate('game', {
      url: 'game.example.com',
      activationKey: 'g',
      selector: ', selector: #game-element',
      temporal: ', fps: 2, duration: 10 seconds, temporal: true'
    });
    
    assert.ok(spec.includes('fps: 2'));
    assert.ok(spec.includes('duration: 10 seconds'));
    assert.ok(spec.includes('temporal: true'));
  });
  
  test('createSpecFromTemplate - throws on invalid template', () => {
    assert.throws(() => {
      createSpecFromTemplate('nonexistent');
    }, /Template "nonexistent" not found/);
  });
  
  test('listTemplates - returns all templates', () => {
    const templates = listTemplates();
    
    assert.ok(templates.length > 0);
    assert.ok(templates.some(t => t.name === 'Game Testing'));
    assert.ok(templates.some(t => t.name === 'Accessibility Testing'));
  });
  
  test('getTemplate - returns template by name', () => {
    const template = getTemplate('game');
    
    assert.ok(template);
    assert.strictEqual(template.name, 'Game Testing');
    assert.ok(template.spec);
    assert.ok(template.variables);
  });
  
  test('getTemplate - throws on invalid template', () => {
    assert.throws(() => {
      getTemplate('nonexistent');
    }, /Template "nonexistent" not found/);
  });
  
  test('registerTemplate - registers custom template', () => {
    const customTemplate = {
      name: 'Custom Test',
      description: 'A custom template',
      spec: 'Given {action}\nThen {result}',
      variables: {
        action: 'I do something',
        result: 'something happens'
      }
    };
    
    registerTemplate('custom', customTemplate);
    
    const retrieved = getTemplate('custom');
    assert.strictEqual(retrieved.name, 'Custom Test');
  });
  
  test('validateTemplate - validates correct template', () => {
    const template = {
      name: 'Test Template',
      spec: 'Given {action}\nThen {result}',
      variables: {
        action: 'I do something',
        result: 'something happens'
      }
    };
    
    const validation = validateTemplate(template);
    
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.errors.length, 0);
  });
  
  test('validateTemplate - detects missing name', () => {
    const template = {
      spec: 'Given {action}',
      variables: { action: 'test' }
    };
    
    const validation = validateTemplate(template);
    
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.some(e => e.includes('name')));
  });
  
  test('validateTemplate - detects missing placeholder variable', () => {
    const template = {
      name: 'Test',
      spec: 'Given {action}\nThen {result}',
      variables: {
        action: 'test'
        // Missing 'result' variable
      }
    };
    
    const validation = validateTemplate(template);
    
    assert.strictEqual(validation.valid, false);
    assert.ok(validation.errors.some(e => e.includes('result')));
  });
  
  test('inheritTemplate - inherits from base template', () => {
    const inherited = inheritTemplate('game', {
      name: 'Custom Game',
      variables: {
        url: 'custom-game.com'
      }
    });
    
    assert.strictEqual(inherited.name, 'Custom Game');
    assert.strictEqual(inherited.variables.url, 'custom-game.com');
    // Should inherit other variables from base
    assert.strictEqual(inherited.variables.activationKey, 'g');
  });
  
  test('composeTemplates - sequential composition', () => {
    const template1 = { spec: 'Given step 1' };
    const template2 = { spec: 'Then step 2' };
    
    const composed = composeTemplates([template1, template2], 'sequential');
    
    assert.ok(composed.includes('Given step 1'));
    assert.ok(composed.includes('Then step 2'));
  });
  
  test('composeTemplates - throws on invalid composition type', () => {
    assert.throws(() => {
      composeTemplates([], 'invalid');
    }, /Unknown composition type: invalid/);
  });
  
  test('all built-in templates are valid', () => {
    for (const [name, template] of Object.entries(TEMPLATES)) {
      const validation = validateTemplate(template);
      assert.strictEqual(validation.valid, true);
    }
  });
  
  test('template examples generate valid, parseable specs', async () => {
    for (const [name, template] of Object.entries(TEMPLATES)) {
      if (!template.examples || template.examples.length === 0) {
        continue; // Skip templates without examples
      }
      
      for (const example of template.examples) {
        // Generate spec from example
        const spec = createSpecFromTemplate(name, example.values);
        
        // Validate structure
        const validation = validateSpec(spec);
        assert.strictEqual(validation.valid, true,
          `Template ${name} example "${example.name}" generates invalid spec: ${validation.errors.join(', ')}`);
        
        // Parse spec
        const parsed = await parseSpec(spec, { useLLM: false });
        assert.ok(parsed.interfaces.length > 0,
          `Template ${name} example "${example.name}" doesn't map to interfaces`);
        
        // Check context extraction (if URL provided)
        if (example.values.url) {
          assert.ok(parsed.context?.url,
            `Template ${name} example "${example.name}" doesn't extract URL`);
        }
      }
    }
  });
  
  describe('All Templates - Systematic Testing', () => {
    const allTemplates = ['game', 'accessibility', 'browser_experience', 'state_validation', 'temporal', 'property'];
    
    for (const templateName of allTemplates) {
      test(`${templateName} template - generates valid spec`, () => {
        const spec = createSpecFromTemplate(templateName, {});
        const validation = validateSpec(spec);
        
        assert.strictEqual(validation.valid, true,
          `Template ${templateName} generates invalid spec: ${validation.errors.join(', ')}`);
      });
      
      test(`${templateName} template - parses correctly`, async () => {
        const spec = createSpecFromTemplate(templateName, {});
        const parsed = await parseSpec(spec, { useLLM: false });
        
        assert.ok(parsed.interfaces.length > 0,
          `Template ${templateName} doesn't map to any interfaces`);
      });
      
      test(`${templateName} template - extracts context`, async () => {
        const spec = createSpecFromTemplate(templateName, {
          url: 'test.example.com'
        });
        const parsed = await parseSpec(spec, { useLLM: false });
        
        // Templates that include URL in their spec structure should extract it
        // Templates like state_validation and temporal don't have URL in their structure
        const templatesWithUrl = ['game', 'accessibility', 'browser_experience'];
        if (templatesWithUrl.includes(templateName)) {
          assert.ok(parsed.context?.url,
            `Template ${templateName} doesn't extract URL from spec`);
        }
        // For other templates, just verify parsing works
        assert.ok(parsed.context !== undefined,
          `Template ${templateName} doesn't extract any context`);
      });
    }
  });
});

