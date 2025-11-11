import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spearmanCorrelation, pearsonCorrelation, calculateRankAgreement } from '../src/metrics.mjs';

describe('Metrics', () => {
  describe('Spearman Correlation', () => {
    it('should calculate perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [1, 2, 3, 4, 5];
      const rho = spearmanCorrelation(x, y);
      
      assert.ok(Math.abs(rho - 1.0) < 0.001);
    });
    
    it('should calculate perfect negative correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 4, 3, 2, 1];
      const rho = spearmanCorrelation(x, y);
      
      assert.ok(Math.abs(rho - (-1.0)) < 0.001);
    });
    
    it('should handle ties correctly', () => {
      const x = [1, 2, 2, 4, 5];
      const y = [1, 2, 3, 4, 5];
      const rho = spearmanCorrelation(x, y);
      
      assert.ok(rho !== null);
      assert.ok(rho >= -1 && rho <= 1);
    });
    
    it('should return null for insufficient data', () => {
      assert.strictEqual(spearmanCorrelation([1], [2]), null);
      assert.strictEqual(spearmanCorrelation([], []), null);
      assert.strictEqual(spearmanCorrelation([1, 2], [3]), null);
    });
    
    it('should handle null values', () => {
      const x = [1, 2, null, 4, 5];
      const y = [1, 2, 3, 4, 5];
      const rho = spearmanCorrelation(x, y);
      
      assert.ok(rho !== null);
    });
  });
  
  describe('Pearson Correlation', () => {
    it('should calculate perfect positive correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      const r = pearsonCorrelation(x, y);
      
      assert.ok(Math.abs(r - 1.0) < 0.001);
    });
    
    it('should return null for no variance', () => {
      const x = [5, 5, 5, 5, 5];
      const y = [1, 2, 3, 4, 5];
      const r = pearsonCorrelation(x, y);
      
      assert.strictEqual(r, null);
    });
  });
  
  describe('Rank Agreement', () => {
    it('should calculate agreement metrics', () => {
      const ranking1 = [1, 2, 3, 4, 5];
      const ranking2 = [1, 2, 3, 4, 5];
      const agreement = calculateRankAgreement(ranking1, ranking2);
      
      assert.ok(agreement.spearman !== null);
      assert.ok(Math.abs(agreement.spearman - 1.0) < 0.001);
      assert.strictEqual(agreement.exactMatches, 5);
      assert.strictEqual(agreement.agreementRate, 1.0);
    });
    
    it('should detect disagreement', () => {
      const ranking1 = [1, 2, 3, 4, 5];
      const ranking2 = [5, 4, 3, 2, 1];
      const agreement = calculateRankAgreement(ranking1, ranking2);
      
      assert.ok(agreement.spearman !== null);
      assert.ok(agreement.spearman < 0);
      assert.strictEqual(agreement.exactMatches, 1); // Only middle matches
    });
  });
});

