/**
 * API Sub-Modules Tests
 * 
 * Tests that verify sub-module exports work correctly.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('API Sub-Modules', () => {
  
  describe('validators sub-module', () => {
    it('should export validators', async () => {
      const validators = await import('../src/validators/index.mjs');
      
      assert.ok(validators.StateValidator, 'Should export StateValidator');
      assert.ok(validators.AccessibilityValidator, 'Should export AccessibilityValidator');
      assert.ok(validators.PromptBuilder, 'Should export PromptBuilder');
      assert.ok(validators.BatchValidator, 'Should export BatchValidator');
      assert.ok(typeof validators.getContrastRatio === 'function', 'Should export getContrastRatio');
      assert.ok(typeof validators.checkElementContrast === 'function', 'Should export checkElementContrast');
    });
  });
  
  describe('temporal sub-module', () => {
    it('should export temporal functions', async () => {
      const temporal = await import('../src/temporal/index.mjs');
      
      assert.ok(typeof temporal.aggregateTemporalNotes === 'function', 'Should export aggregateTemporalNotes');
      assert.ok(temporal.TemporalDecisionManager, 'Should export TemporalDecisionManager');
      assert.ok(temporal.TemporalPreprocessingManager, 'Should export TemporalPreprocessingManager');
      assert.ok(typeof temporal.captureTemporalScreenshots === 'function', 'Should export captureTemporalScreenshots');
    });
  });
  
  describe('multi-modal sub-module', () => {
    it('should export multi-modal functions', async () => {
      const multiModal = await import('../src/multi-modal/index.mjs');
      
      assert.ok(typeof multiModal.multiModalValidation === 'function', 'Should export multiModalValidation');
      assert.ok(typeof multiModal.extractRenderedCode === 'function', 'Should export extractRenderedCode');
      assert.ok(typeof multiModal.multiPerspectiveEvaluation === 'function', 'Should export multiPerspectiveEvaluation');
    });
  });
  
  describe('ensemble sub-module', () => {
    it('should export ensemble functions', async () => {
      const ensemble = await import('../src/ensemble/index.mjs');
      
      assert.ok(ensemble.EnsembleJudge, 'Should export EnsembleJudge');
      assert.ok(typeof ensemble.detectBias === 'function', 'Should export detectBias');
      assert.ok(typeof ensemble.detectPositionBias === 'function', 'Should export detectPositionBias');
      assert.ok(typeof ensemble.evaluateWithCounterBalance === 'function', 'Should export evaluateWithCounterBalance');
    });
  });
  
  describe('persona sub-module', () => {
    it('should export persona functions', async () => {
      const persona = await import('../src/persona/index.mjs');
      
      assert.ok(typeof persona.experiencePageAsPersona === 'function', 'Should export experiencePageAsPersona');
      assert.ok(persona.ExperienceTrace, 'Should export ExperienceTrace');
      assert.ok(persona.ExperienceTracerManager, 'Should export ExperienceTracerManager');
    });
  });
  
  describe('specs sub-module', () => {
    it('should export spec functions', async () => {
      const specs = await import('../src/specs/index.mjs');
      
      assert.ok(typeof specs.parseSpec === 'function', 'Should export parseSpec');
      assert.ok(typeof specs.executeSpec === 'function', 'Should export executeSpec');
      assert.ok(specs.TEMPLATES, 'Should export TEMPLATES');
      assert.ok(typeof specs.createSpecFromTemplate === 'function', 'Should export createSpecFromTemplate');
    });
  });
  
  describe('utils sub-module', () => {
    it('should export utility functions', async () => {
      const utils = await import('../src/utils/index.mjs');
      
      assert.ok(typeof utils.getCached === 'function', 'Should export getCached');
      assert.ok(typeof utils.createConfig === 'function', 'Should export createConfig');
      assert.ok(utils.AIBrowserTestError, 'Should export AIBrowserTestError');
      assert.ok(utils.CACHE_CONSTANTS, 'Should export CACHE_CONSTANTS');
    });
  });
  
  describe('package.json exports field', () => {
    it('should support sub-module imports via package.json exports', async () => {
      // This test verifies the package.json exports field is configured correctly
      // In a real package, you'd import from 'ai-visual-test/validators'
      // Here we test the structure exists
      const pkg = JSON.parse(await import('fs').then(m => m.promises.readFile('package.json', 'utf-8')));
      
      assert.ok(pkg.exports, 'package.json should have exports field');
      assert.ok(pkg.exports['./validators'], 'Should export validators sub-module');
      assert.ok(pkg.exports['./temporal'], 'Should export temporal sub-module');
      assert.ok(pkg.exports['./multi-modal'], 'Should export multi-modal sub-module');
      assert.ok(pkg.exports['./ensemble'], 'Should export ensemble sub-module');
      assert.ok(pkg.exports['./persona'], 'Should export persona sub-module');
      assert.ok(pkg.exports['./specs'], 'Should export specs sub-module');
      assert.ok(pkg.exports['./utils'], 'Should export utils sub-module');
    });
  });
});

