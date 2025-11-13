/**
 * ServiceContainer - Lightweight Dependency Injection Container
 *
 * Provides centralized service registration and lazy singleton instantiation.
 * Follows KISS principle with zero external dependencies.
 *
 * Key features:
 * - Lazy initialization: services created only when first requested
 * - Singleton pattern: each service instantiated once and cached
 * - Type-safe: full TypeScript support with generics
 * - Simple API: register, get, has, clear
 *
 * @example
 * ```typescript
 * // Registration
 * ServiceContainer.register('MyService', () => new MyService(dep1, dep2));
 *
 * // Resolution
 * const service = ServiceContainer.get<MyService>('MyService');
 *
 * // Testing
 * ServiceContainer.clear();
 * ServiceContainer.register('MyService', () => mockService);
 * ```
 */
export class ServiceContainer {
  private static instances = new Map<string, any>();

  /**
   * Register a service with a factory function.
   * The factory will be called once on first access to create the singleton instance.
   *
   * @param key - Unique identifier for the service
   * @param factory - Function that creates the service instance
   */
  static register<T>(key: string, factory: () => T): void {
    this.instances.set(key, factory);
  }

  /**
   * Get a service instance by key.
   * Creates the instance on first access using the registered factory.
   * Returns cached instance on subsequent calls.
   *
   * @param key - Service identifier
   * @returns The service instance
   * @throws Error if service not registered
   */
  static get<T>(key: string): T {
    const factory = this.instances.get(key);
    if (!factory) {
      throw new Error(`Service '${key}' not registered in container`);
    }

    // Lazy singleton: create on first access, cache thereafter
    if (typeof factory === 'function') {
      const instance = factory();
      this.instances.set(key, instance);
      return instance;
    }
    return factory;
  }

  /**
   * Check if a service is registered.
   *
   * @param key - Service identifier
   * @returns True if service is registered
   */
  static has(key: string): boolean {
    return this.instances.has(key);
  }

  /**
   * Clear all registered services.
   * Useful for testing to reset container state between tests.
   */
  static clear(): void {
    this.instances.clear();
  }

  /**
   * Get all registered service keys.
   * Useful for debugging and introspection.
   *
   * @returns Array of registered service keys
   */
  static keys(): string[] {
    return Array.from(this.instances.keys());
  }
}
