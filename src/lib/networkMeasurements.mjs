export function calculateMegabitsPerSecond(byteLength, elapsedMilliseconds) {
  if (!Number.isSafeInteger(byteLength) || byteLength <= 0) {
    throw new RangeError('byteLength must be a positive safe integer.');
  }
  if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds <= 0) {
    throw new RangeError('elapsedMilliseconds must be a positive finite number.');
  }

  return (byteLength * 8) / (elapsedMilliseconds * 1000);
}

export function summarizeLatency(samples) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new RangeError('At least one latency sample is required.');
  }
  if (!samples.every((sample) => Number.isFinite(sample) && sample >= 0)) {
    throw new RangeError('Latency samples must be finite, non-negative numbers.');
  }

  const mean = samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
  const variance = samples.reduce((sum, sample) => sum + ((sample - mean) ** 2), 0) / samples.length;

  return {
    latencyMs: mean,
    jitterMs: Math.sqrt(variance),
  };
}
