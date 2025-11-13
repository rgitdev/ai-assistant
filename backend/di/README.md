# Dependency Injection Container

This directory contains the lightweight Dependency Injection (DI) container implementation for the AI Assistant backend.

## Architecture

```
backend/
├── di/
│   ├── ServiceContainer.ts       # Core container (register, get, has, clear)
│   ├── test-container.ts         # Test script
│   └── README.md                 # This file
│
├── client/register.ts            # Registers client services
├── repository/register.ts        # Registers repositories
├── services/register.ts          # Registers business services
├── assistant/register.ts         # Registers assistant orchestrators
└── registerServices.ts           # Main orchestrator
```

## Design Principles

1. **No circular dependencies** - ServiceContainer has no business logic imports
2. **Modular registration** - Each module registers its own services
3. **Clear dependency order** - Registration order shows dependency graph
4. **Keep related together** - Registration lives with the services it registers
5. **Zero external dependencies** - Pure TypeScript implementation

## Usage

### Initialization

Call `registerAllServices()` once at application startup:

```typescript
import { registerAllServices } from '@backend/registerServices';
import { ServiceContainer } from '@backend/di/ServiceContainer';

// Initialize DI container at startup
registerAllServices();

// Resolve services as needed
const assistant = ServiceContainer.get<Assistant>('Assistant');
```

### Testing

In tests, clear the container and register mocks:

```typescript
import { ServiceContainer } from '@backend/di/ServiceContainer';

describe('MyService', () => {
  beforeEach(() => {
    ServiceContainer.clear();

    // Register mocks
    ServiceContainer.register('AssistantService', () => mockAssistantService);
    ServiceContainer.register('ConversationService', () => mockConversationService);
  });

  it('should work', () => {
    const service = ServiceContainer.get<MyService>('MyService');
    // test...
  });
});
```

## Registered Services

### Client Layer
- `VectorStore` - Vector storage for embeddings
- `OpenAIEmbeddingService` - OpenAI embedding service
- `DatabaseService` - SQLite database service

### Repository Layer
- `ConversationRepository` - Conversation data access
- `MemoryRepository` - Memory data access

### Service Layer
- `ConversationService` - Conversation management
- `AssistantService` - OpenAI communication
- `MemoryCreator` - Memory creation
- `MemoryProvider` - Memory retrieval and formatting
- `MemorySearchService` - Memory search with vectors
- `QueryService` - Query extraction
- `MemoryQueryResolver` - Memory query resolution

### Assistant Layer
- `AssistantMemories` - Memory orchestration
- `Assistant` - Main assistant orchestrator

## Testing

Run the test script to verify the container works:

```bash
bun run backend/di/test-container.ts
```

This will:
1. Test basic registration and resolution
2. Test singleton behavior
3. Register all services
4. Verify all services can be resolved

## Benefits

✅ **Testability** - Easy to inject mocks and test in isolation
✅ **Loose Coupling** - Services depend on interfaces, not concrete implementations
✅ **Maintainability** - Centralized dependency management
✅ **Visibility** - Clear dependency graph in registration order
✅ **Scalability** - Easy to add new services without modifying existing code
✅ **KISS Aligned** - Simple implementation, no decorators, no magic
✅ **Zero Dependencies** - No external libraries needed
✅ **Lifecycle Management** - Singleton pattern built-in
