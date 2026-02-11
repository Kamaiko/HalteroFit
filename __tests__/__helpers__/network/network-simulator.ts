/**
 * Network Simulator for Offline-First Testing
 *
 * Simulates various network conditions to test offline-first behavior:
 * - Offline/Online states
 * - Slow connections (high latency)
 * - Intermittent connections (random drops)
 * - Connection failures
 *
 * @module network-simulator
 */

import { http, HttpResponse, delay } from 'msw';
import { mockSupabaseServer } from './mock-supabase';

// ============================================================================
// Types
// ============================================================================

/**
 * Network state enum
 */
export enum NetworkState {
  ONLINE = 'online',
  OFFLINE = 'offline',
  SLOW = 'slow',
  INTERMITTENT = 'intermittent',
}

/**
 * Network simulator configuration
 */
export interface NetworkConfig {
  state: NetworkState;
  latency?: number; // ms
  dropRate?: number; // 0-1 (e.g., 0.3 = 30% drop rate)
  timeout?: number; // ms
}

// ============================================================================
// Network Simulator Class
// ============================================================================

/**
 * Simulates network conditions for testing offline-first behavior
 */
export class NetworkSimulator {
  private currentState: NetworkState = NetworkState.ONLINE;
  private latency: number = 0;
  private dropRate: number = 0;

  /**
   * Set network to offline state (all requests fail)
   */
  goOffline(): void {
    this.currentState = NetworkState.OFFLINE;

    // Override all handlers to return network error
    mockSupabaseServer.use(
      http.post('*', () => {
        return HttpResponse.error();
      }),
      http.get('*', () => {
        return HttpResponse.error();
      })
    );
  }

  /**
   * Set network to online state (normal operation)
   */
  goOnline(): void {
    this.currentState = NetworkState.ONLINE;
    this.latency = 0;
    this.dropRate = 0;

    // Reset handlers to defaults
    mockSupabaseServer.resetHandlers();
  }

  /**
   * Simulate slow network with high latency
   * @param latencyMs - Delay in milliseconds (default: 3000ms)
   */
  simulateSlow(latencyMs: number = 3000): void {
    this.currentState = NetworkState.SLOW;
    this.latency = latencyMs;

    // Add delay to all handlers
    mockSupabaseServer.use(
      http.post('*', async () => {
        await delay(this.latency);
        // Forward to original handlers
        return passthrough();
      }),
      http.get('*', async () => {
        await delay(this.latency);
        return passthrough();
      })
    );
  }

  /**
   * Simulate intermittent connection (random drops)
   * @param dropRate - Probability of request failing (0-1, default: 0.3 = 30%)
   */
  simulateIntermittent(dropRate: number = 0.3): void {
    this.currentState = NetworkState.INTERMITTENT;
    this.dropRate = dropRate;

    // Randomly fail requests based on drop rate
    mockSupabaseServer.use(
      http.post('*', async () => {
        if (Math.random() < this.dropRate) {
          return HttpResponse.error();
        }
        return passthrough();
      }),
      http.get('*', async () => {
        if (Math.random() < this.dropRate) {
          return HttpResponse.error();
        }
        return passthrough();
      })
    );
  }

  /**
   * Apply custom network configuration
   */
  applyConfig(config: NetworkConfig): void {
    switch (config.state) {
      case NetworkState.OFFLINE:
        this.goOffline();
        break;
      case NetworkState.SLOW:
        this.simulateSlow(config.latency);
        break;
      case NetworkState.INTERMITTENT:
        this.simulateIntermittent(config.dropRate);
        break;
      case NetworkState.ONLINE:
      default:
        this.goOnline();
        break;
    }
  }

  /**
   * Get current network state
   */
  getState(): NetworkState {
    return this.currentState;
  }

  /**
   * Check if network is online
   */
  isOnline(): boolean {
    return this.currentState !== NetworkState.OFFLINE;
  }

  /**
   * Reset to online state
   */
  reset(): void {
    this.goOnline();
  }
}

// ============================================================================
// Helper: passthrough (for msw)
// ============================================================================

/**
 * Passthrough to original handler (msw pattern)
 * Note: msw doesn't have built-in passthrough for node, so we reset handlers
 */
function passthrough(): Response {
  // This is a placeholder - actual implementation would reset to original handlers
  // For now, we'll throw to indicate the handler should be skipped
  throw new Error('PASSTHROUGH_TO_ORIGINAL_HANDLER');
}

// ============================================================================
// Global Network Simulator Instance
// ============================================================================

/**
 * Global network simulator instance for tests
 */
export const networkSimulator = new NetworkSimulator();

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Wait for network to reconnect (polling utility)
 * @param checkFn - Function to check if network is ready
 * @param timeout - Max wait time in ms (default: 10000)
 * @param interval - Check interval in ms (default: 100)
 */
export async function waitForNetwork(
  checkFn: () => boolean | Promise<boolean>,
  timeout: number = 10000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await checkFn()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Network check timeout after ${timeout}ms`);
}

/**
 * Simulate connection drop mid-operation
 * @param dropAfterMs - Time before dropping connection (ms)
 */
export async function dropConnectionAfter(dropAfterMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, dropAfterMs));
  networkSimulator.goOffline();
}

/**
 * Simulate connection restoration
 * @param restoreAfterMs - Time before restoring connection (ms)
 */
export async function restoreConnectionAfter(restoreAfterMs: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, restoreAfterMs));
  networkSimulator.goOnline();
}

/**
 * Test network resilience pattern
 * @param operation - Async operation to test
 * @param config - Network configuration to simulate
 */
export async function testWithNetworkCondition<T>(
  operation: () => Promise<T>,
  config: NetworkConfig
): Promise<T> {
  try {
    networkSimulator.applyConfig(config);
    return await operation();
  } finally {
    networkSimulator.reset();
  }
}
