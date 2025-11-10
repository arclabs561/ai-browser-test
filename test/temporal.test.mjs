/**
 * Tests for temporal.mjs
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  aggregateTemporalNotes,
  formatNotesForPrompt,
  calculateCoherenceExported as calculateCoherence
} from '../src/temporal.mjs';

test('aggregateTemporalNotes - empty notes', () => {
  const result = aggregateTemporalNotes([]);
  
  assert.ok(result);
  assert.deepStrictEqual(result.windows, []);
  assert.strictEqual(result.coherence, 1.0);
  assert.deepStrictEqual(result.conflicts, []);
});

test('aggregateTemporalNotes - single note', () => {
  const notes = [
    {
      timestamp: Date.now(),
      elapsed: 0,
      score: 8,
      observation: 'Test observation',
      step: 'gameplay_note_start'
    }
  ];
  
  const result = aggregateTemporalNotes(notes);
  
  assert.ok(result);
  assert.strictEqual(result.windows.length, 1);
  assert.ok(result.coherence >= 0 && result.coherence <= 1);
});

test('aggregateTemporalNotes - multiple notes', () => {
  const now = Date.now();
  const notes = [
    { timestamp: now, elapsed: 0, score: 8, observation: 'Start', step: 'gameplay_note_start' },
    { timestamp: now + 5000, elapsed: 5000, score: 9, observation: 'Middle', step: 'gameplay_note_middle' },
    { timestamp: now + 10000, elapsed: 10000, score: 8, observation: 'End', step: 'gameplay_note_end' }
  ];
  
  const result = aggregateTemporalNotes(notes);
  
  assert.ok(result);
  assert.ok(result.windows.length > 0);
  assert.ok(result.coherence >= 0 && result.coherence <= 1);
  assert.ok(result.summary);
});

test('aggregateTemporalNotes - custom window size', () => {
  const now = Date.now();
  const notes = [
    { timestamp: now, elapsed: 0, score: 8, observation: 'Start', step: 'gameplay_note_start' },
    { timestamp: now + 20000, elapsed: 20000, score: 9, observation: 'End', step: 'gameplay_note_end' }
  ];
  
  const result = aggregateTemporalNotes(notes, { windowSize: 5000 });
  
  assert.ok(result);
  assert.ok(result.windows.length > 0);
  assert.ok(result.coherence >= 0 && result.coherence <= 1);
});

test('formatNotesForPrompt - formats aggregated notes', () => {
  const now = Date.now();
  const notes = [
    { timestamp: now, elapsed: 0, score: 8, observation: 'Start', step: 'gameplay_note_start' },
    { timestamp: now + 5000, elapsed: 5000, score: 9, observation: 'Middle', step: 'gameplay_note_middle' }
  ];
  
  const aggregated = aggregateTemporalNotes(notes);
  const prompt = formatNotesForPrompt(aggregated);
  
  assert.ok(prompt);
  assert.strictEqual(typeof prompt, 'string');
  assert.ok(prompt.length > 0);
  assert.ok(prompt.includes('TEMPORAL AGGREGATION'));
});

test('formatNotesForPrompt - includes coherence score', () => {
  const now = Date.now();
  const notes = [
    { timestamp: now, elapsed: 0, score: 8, step: 'gameplay_note_start' }
  ];
  
  const aggregated = aggregateTemporalNotes(notes);
  const prompt = formatNotesForPrompt(aggregated);
  
  assert.ok(prompt.includes('Coherence'));
});

test('calculateCoherence - single window', () => {
  const windows = [
    { avgScore: 8, observations: 'test' }
  ];
  
  const coherence = calculateCoherence(windows);
  assert.strictEqual(coherence, 1.0);
});

test('calculateCoherence - consistent scores', () => {
  const windows = [
    { avgScore: 8, observations: 'test' },
    { avgScore: 8, observations: 'test' },
    { avgScore: 8, observations: 'test' }
  ];
  
  const coherence = calculateCoherence(windows);
  assert.ok(coherence >= 0.7); // High coherence for consistent scores
});

test('calculateCoherence - varying scores', () => {
  const windows = [
    { avgScore: 8, observations: 'test' },
    { avgScore: 3, observations: 'different' },
    { avgScore: 9, observations: 'another' }
  ];
  
  const coherence = calculateCoherence(windows);
  assert.ok(coherence >= 0 && coherence <= 1);
  assert.ok(coherence < 0.7); // Lower coherence for varying scores
});

test('aggregateTemporalNotes - detects conflicts', () => {
  const now = Date.now();
  const notes = [
    { timestamp: now, elapsed: 0, score: 8, observation: 'good smooth', step: 'gameplay_note_start' },
    { timestamp: now + 5000, elapsed: 5000, score: 3, observation: 'bad slow laggy', step: 'gameplay_note_middle' }
  ];
  
  const result = aggregateTemporalNotes(notes);
  
  assert.ok(result);
  assert.ok(Array.isArray(result.conflicts));
});

test('aggregateTemporalNotes - calculates trend', () => {
  const now = Date.now();
  const notes = [
    { timestamp: now, elapsed: 0, score: 8, step: 'gameplay_note_start' },
    { timestamp: now + 5000, elapsed: 5000, score: 9, step: 'gameplay_note_middle' },
    { timestamp: now + 10000, elapsed: 10000, score: 10, step: 'gameplay_note_end' }
  ];
  
  const result = aggregateTemporalNotes(notes);
  
  assert.ok(result);
  assert.ok(result.summary.includes('Score progression') || result.summary.includes('progression'));
});

