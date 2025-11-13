import { registerClients } from '@backend/client/register';
import { registerRepositories } from '@backend/repository/register';
import { registerServices } from '@backend/services/register';
import { registerAssistant } from '@backend/assistant/register';

/**
 * Main orchestrator for registering all services in the DI container.
 *
 * ORDER MATTERS! Services must be registered in dependency order:
 * 1. Clients (no dependencies)
 * 2. Repositories (no dependencies)
 * 3. Services (depend on clients and repositories)
 * 4. Assistant (depends on services)
 *
 * This registration order makes the dependency graph clear and explicit.
 *
 * Call this function once at application startup before resolving any services.
 */
export function registerAllServices(): void {
  // Layer 1: Infrastructure clients (OpenAI, VectorStore, Database)
  registerClients();

  // Layer 2: Data access repositories
  registerRepositories();

  // Layer 3: Business services
  registerServices();

  // Layer 4: High-level orchestrators (Assistant)
  registerAssistant();
}
