/**
 * TestLogger - Universal test logger for clean test output
 *
 * Simple wrapper around Logger that formats test output with:
 * - Testing icon (🧪)
 * - Test class name
 * - Test name
 *
 * Usage:
 * ```typescript
 * const testLogger = new TestLogger('MyTestClass');
 * testLogger.log('my test name', 'Setting up test environment...');
 * testLogger.warn('my test name', 'Warning: something unexpected');
 * testLogger.error('my test name', 'Test failed');
 * ```
 */

import { Logger } from "./Logger";

export class TestLogger {
  private logger: Logger;
  private readonly testClassName: string;

  constructor(testClassName: string, enabled?: boolean) {
    this.testClassName = testClassName;

    // Use TEST_LOGGING_ENABLED env var or default to true for tests
    const envEnabled = process.env.TEST_LOGGING_ENABLED?.toLowerCase() !== 'false';
    this.logger = new Logger(
      'Test',
      '🧪', // Test tube icon for testing
      enabled !== undefined ? enabled : envEnabled
    );
  }

  /**
   * Enable or disable logging at runtime
   */
  setEnabled(enabled: boolean): void {
    this.logger.setEnabled(enabled);
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.logger.isEnabled();
  }

  /**
   * Log a test message with test class and test name
   * @param testName The name of the current test
   * @param message The message to log
   */
  log(testName: string, message: string): void {
    if (!this.logger.isEnabled()) return;
    console.log(`🧪 [Test] [${this.testClassName}::${testName}] ${message}`);
  }

  /**
   * Log a warning message
   * @param testName The name of the current test
   * @param message The warning message
   */
  warn(testName: string, message: string): void {
    if (!this.logger.isEnabled()) return;
    console.warn(`🧪 [Test] [${this.testClassName}::${testName}] ⚠️  ${message}`);
  }

  /**
   * Log an error message
   * @param testName The name of the current test
   * @param message The error message
   */
  error(testName: string, message: string): void {
    if (!this.logger.isEnabled()) return;
    console.error(`🧪 [Test] [${this.testClassName}::${testName}] ❌ ${message}`);
  }

  /**
   * Log a setup/teardown message (no test name required)
   * @param message The message to log
   */
  setup(message: string): void {
    if (!this.logger.isEnabled()) return;
    console.log(`🧪 [Test] [${this.testClassName}::setup] ${message}`);
  }

  /**
   * Log a teardown message (no test name required)
   * @param message The message to log
   */
  teardown(message: string): void {
    if (!this.logger.isEnabled()) return;
    console.log(`🧪 [Test] [${this.testClassName}::teardown] ${message}`);
  }
}
