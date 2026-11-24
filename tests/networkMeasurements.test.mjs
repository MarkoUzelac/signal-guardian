import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMegabitsPerSecond, summarizeLatency } from '../src/lib/networkMeasurements.mjs';

test('calculates Mbps from actual transferred bytes and elapsed milliseconds', () => {
  assert.equal(calculateMegabitsPerSecond(1_000_000, 1_000), 8);
  assert.equal(calculateMegabitsPerSecond(500_000, 2_000), 2);
});

test('rejects empty or invalid throughput measurements', () => {
  assert.throws(() => calculateMegabitsPerSecond(0, 1_000), RangeError);
  assert.throws(() => calculateMegabitsPerSecond(-1, 1_000), RangeError);
  assert.throws(() => calculateMegabitsPerSecond(1_000, 0), RangeError);
  assert.throws(() => calculateMegabitsPerSecond(1_000, Number.NaN), RangeError);
});

test('calculates mean latency and population jitter from measured samples', () => {
  const result = summarizeLatency([10, 20, 30]);
  assert.equal(result.latencyMs, 20);
  assert.equal(result.jitterMs, Math.sqrt(200 / 3));
});

test('rejects missing, negative, and non-finite latency samples', () => {
  assert.throws(() => summarizeLatency([]), RangeError);
  assert.throws(() => summarizeLatency([10, -1]), RangeError);
  assert.throws(() => summarizeLatency([10, Number.POSITIVE_INFINITY]), RangeError);
});
