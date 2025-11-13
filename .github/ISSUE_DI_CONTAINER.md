# Implement Modular Dependency Injection Container

## Problem

The current service initialization has a cascade of manual dependency creation in constructors, making the code harder to maintain and test:

```typescript
export class Assistant {
  assistantService: AssistantService;
  conversationService: ConversationService;
  memoryCreator: MemoryCreator;
  memoryProvider: MemoryProvider;
  assistantMemories: AssistantMemories;
  memorySearchService: MemorySearchService;
  queryService: QueryService;
  memoryQueryResolver: MemoryQueryResolver;

  constructor() {
    // Manual instantiation of all dependencies
    const assistantService = new AssistantService();
    this.assistantService = assistantService;

    const repositoryFactory = new ConversationRepositoryFactory();
    const conversationRepository = repositoryFactory.build();
    this.conversationService = new ConversationService(conversationRepository);

    const memoryCreator = new MemoryCreator();
    const memoryProvider = new MemoryProvider();
    // ... and so on
  }
}
```

**Issues:**
- Hard to test (difficult to inject mocks)
- Tight coupling between classes
- Duplicate instantiation code across classes
- No centralized service lifecycle management
- Difficult to see dependency graph

## Proposed Solution

Implement a lightweight, modular Dependency Injection (DI) container following the KISS principle. Similar to Spring/ASP.NET Core but simpler and TypeScript-native.

### Architecture

```
backend/
├── di/
│   └── ServiceContainer.ts          # Core container class (no registrations)
│
├── client/
│   └── register.ts                  # Registers OpenAI, Vector, etc.
│
├── repository/
│   └── register.ts                  # Registers repositories
│
├── services/
│   └── register.ts                  # Registers business services
│
├── assistant/
│   └── register.ts                  # Registers Assistant, AssistantMemories
│
├── registerServices.ts              # Main orchestrator (root level)
└── index.tsx                        # Calls registerAllServices() at startup
```

### Key Design Principles

1. **No circular dependencies** - ServiceContainer in `di/` has no business logic imports
2. **Modular registration** - Each module registers its own services
3. **Clear dependency order** - Registration order in main orchestrator shows dependency graph
4. **Keep related together** - Registration lives with the services it registers
5. **Zero external dependencies** - Pure TypeScript implementation

## Implementation Plan

### Phase 1: Core Infrastructure

**1. Create ServiceContainer** (`backend/di/ServiceContainer.ts`)
```typescript
export class ServiceContainer {
  private static instances = new Map<string, any>();

  static register<T>(key: string, factory: () => T): void {
    this.instances.set(key, factory);
  }

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

  static has(key: string): boolean {
    return this.instances.has(key);
  }

  static clear(): void {
    this.instances.clear();
  }
}
```

### Phase 2: Module Registration Files

**2. Create registration files per module:**

- `backend/client/register.ts`
- `backend/repository/register.ts`
- `backend/services/register.ts`
- `backend/assistant/register.ts`

Each exports a registration function:
```typescript
// backend/client/register.ts
import { ServiceContainer } from '@backend/di/ServiceContainer';
import { VectorStore } from '@backend/client/vector/VectorStore';
import { OpenAIEmbeddingService } from '@backend/client/openai/OpenAIEmbeddingService';

export function registerClients() {
  ServiceContainer.register('VectorStore', () => new VectorStore());
  ServiceContainer.register('OpenAIEmbeddingService', () => new OpenAIEmbeddingService());
}
```

**3. Create main orchestrator** (`backend/registerServices.ts`)
```typescript
import { registerClients } from '@backend/client/register';
import { registerRepositories } from '@backend/repository/register';
import { registerServices } from '@backend/services/register';
import { registerAssistant } from '@backend/assistant/register';

export function registerAllServices() {
  // Order matters! Register dependencies first
  registerClients();
  registerRepositories();
  registerServices();
  registerAssistant();
}
```

### Phase 3: Refactor Constructors

**4. Update service constructors to accept dependencies:**

Before:
```typescript
constructor() {
  this.assistantService = new AssistantService();
  this.conversationService = new ConversationService(...);
}
```

After:
```typescript
constructor(
  assistantService: AssistantService,
  conversationService: ConversationService,
  assistantMemories: AssistantMemories,
  memorySearchService: MemorySearchService
) {
  this.assistantService = assistantService;
  this.conversationService = conversationService;
  this.assistantMemories = assistantMemories;
  this.memorySearchService = memorySearchService;
}
```

**5. Update entry point** (`backend/index.tsx`)
```typescript
import { registerAllServices } from '@backend/registerServices';
import { ServiceContainer } from '@backend/di/ServiceContainer';

// Initialize DI container at startup
registerAllServices();

// Resolve services as needed
const assistantController = ServiceContainer.get('AssistantController');
```

### Phase 4: Update Tests

**6. Update test files to use container:**
```typescript
import { ServiceContainer } from '@backend/di/ServiceContainer';

describe('Assistant', () => {
  beforeEach(() => {
    ServiceContainer.clear();

    // Register mocks
    ServiceContainer.register('AssistantService', () => mockAssistantService);
    ServiceContainer.register('ConversationService', () => mockConversationService);
    // ...
  });

  it('should handle message', () => {
    const assistant = ServiceContainer.get<Assistant>('Assistant');
    // test...
  });
});
```

## Benefits

✅ **Testability** - Easy to inject mocks and test in isolation
✅ **Loose Coupling** - Services depend on interfaces, not concrete implementations
✅ **Maintainability** - Centralized dependency management
✅ **Visibility** - Clear dependency graph in registration order
✅ **Scalability** - Easy to add new services without modifying existing code
✅ **KISS Aligned** - Simple implementation, no decorators, no magic
✅ **Zero Dependencies** - No external libraries needed
✅ **Lifecycle Management** - Singleton pattern built-in

## Migration Strategy

**Incremental approach** to minimize risk:

1. ✅ Create ServiceContainer and core infrastructure
2. ✅ Migrate one module (e.g., `client`) as proof of concept
3. ✅ Migrate `repository` module
4. ✅ Migrate `services` module
5. ✅ Migrate `assistant` module
6. ✅ Update all tests
7. ✅ Remove old factory classes (if no longer needed)

Each step can be a separate commit, keeping changes reviewable.

## Alternative Considered

**Awilix** - A lightweight DI library for Node.js/TypeScript. While battle-tested and feature-rich, a custom solution:
- Maintains zero external dependencies
- Provides full control and understanding
- Keeps implementation simple and aligned with KISS principle
- Is sufficient for current project scale (~20 services)

Could migrate to Awilix later if complexity grows significantly.

## Success Criteria

- [ ] All services registered in modular registration files
- [ ] All constructors accept dependencies via parameters
- [ ] No `new ClassName()` calls in constructors (except primitives)
- [ ] All tests updated to use ServiceContainer
- [ ] No circular dependencies between modules
- [ ] Documentation updated with DI usage patterns

## Related Files

Services that will need constructor updates:
- `backend/assistant/Assistant.tsx`
- `backend/assistant/AssistantMemories.tsx`
- `backend/services/assistant/AssistantService.ts`
- `backend/services/memory/MemoryCreator.ts`
- `backend/services/memory/MemoryProvider.ts`
- `backend/services/memory/MemorySearchService.ts`
- `backend/services/query/QueryService.ts`
- `backend/services/memory/MemoryQueryResolver.ts`
- `backend/services/conversation/ConversationService.ts`
- `backend/api/assistant/AssistantController.ts`
- `backend/jobs/assistant/AssistantMemoryJob.ts`

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Create `backend/di/ServiceContainer.ts`
- [ ] Add unit tests for ServiceContainer
- [ ] Create `backend/registerServices.ts` skeleton

### Phase 2: Module Registrations
- [ ] Create `backend/client/register.ts`
- [ ] Create `backend/repository/register.ts`
- [ ] Create `backend/services/register.ts`
- [ ] Create `backend/assistant/register.ts`
- [ ] Implement `registerAllServices()` orchestrator

### Phase 3: Refactor Services
- [ ] Refactor client classes (VectorStore, OpenAI services)
- [ ] Refactor repository classes
- [ ] Refactor service classes (MemoryCreator, MemoryProvider, etc.)
- [ ] Refactor Assistant and AssistantMemories
- [ ] Refactor controllers

### Phase 4: Update Entry Points
- [ ] Update `backend/index.tsx` to call `registerAllServices()`
- [ ] Update `backend/api/assistant/AssistantController.ts` to use container
- [ ] Update `backend/jobs/assistant/AssistantMemoryJob.ts` to use container

### Phase 5: Tests & Documentation
- [ ] Update all unit tests to use ServiceContainer
- [ ] Update integration tests
- [ ] Add DI usage guide to CLAUDE.md
- [ ] Remove obsolete factory classes (if any)

## Estimated Effort

- **Small** (1-2 hours): Core ServiceContainer implementation
- **Medium** (3-4 hours): Module registration files and orchestrator
- **Large** (4-6 hours): Refactor all service constructors
- **Medium** (2-3 hours): Update tests and documentation

**Total: 10-15 hours** (can be done incrementally over multiple sessions)
