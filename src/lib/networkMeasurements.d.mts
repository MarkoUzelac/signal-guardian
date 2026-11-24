export declare function calculateMegabitsPerSecond(byteLength: number, elapsedMilliseconds: number): number;

export declare function summarizeLatency(samples: readonly number[]): {
  latencyMs: number;
  jitterMs: number;
};
