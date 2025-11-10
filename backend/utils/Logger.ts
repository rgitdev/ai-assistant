/**
 * Generic Logger utility
 * Reusable logger that can be used across the application
 */

export class Logger {
  private enabled: boolean;
  private readonly icon: string;
  private readonly name: string;

  constructor(name: string, icon: string = '📝', enabled?: boolean) {
    this.name = name;
    this.icon = icon;

    // Check environment variable based on logger name
    const envVar = `${name.toUpperCase()}_LOGGING_ENABLED`;
    const envEnabled = process.env[envVar]?.toLowerCase() === 'true';
    this.enabled = enabled !== undefined ? enabled : envEnabled;
  }

  /**
   * Enable or disable logging at runtime
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log an info message
   */
  log(message: string): void {
    if (!this.enabled) return;
    console.log(`${this.icon} [${this.name}] ${message}`);
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    if (!this.enabled) return;
    console.warn(`${this.icon} [${this.name}] ⚠️  ${message}`);
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    if (!this.enabled) return;
    console.error(`${this.icon} [${this.name}] ❌ ${message}`);
  }
}
