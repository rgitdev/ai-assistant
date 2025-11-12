# AssistantServiceWithTools Tests

This directory contains comprehensive tests for the `AssistantServiceWithTools` class with memory search tools integration.

## Test Setup

The tests demonstrate proper dependency injection and integration between:

- **MemoryFileRepository**: Uses `test-memories.json` for isolated test data
- **VectorStore**: Creates semantic search embeddings from test memories
- **MemorySearchService**: Injected with test repository for controlled testing
- **SearchMemoriesTool**: Searches across all memory categories
- **SearchMemoriesByCategoryTool**: Searches within specific memory categories
- **ToolRegistry**: Manages and executes tools
- **AssistantServiceWithTools**: Main service orchestrating OpenAI with tools

## Running the Tests

```bash
# Run all tests in this file
bun test backend/services/assistant/__tests__/AssistantServiceWithTools.test.ts

# Run with verbose output
bun test backend/services/assistant/__tests__/AssistantServiceWithTools.test.ts --verbose

# Run specific test suite
bun test backend/services/assistant/__tests__/AssistantServiceWithTools.test.ts -t "SearchMemoriesTool"
```

## Test Files

- **AssistantServiceWithTools.test.ts**: Main test file with comprehensive test suites
- **test-memories.json**: Static test data with 8 sample memories across different categories
- **test-vectors.json**: Generated during test setup, cleaned up after tests complete

## Test Coverage

### 1. ToolRegistry Integration
- Tool registration verification
- OpenAI-compatible tool definition format
- Tool listing and retrieval

### 2. SearchMemoriesTool
- Direct tool execution
- Query variations
- Limit parameter handling
- Result field validation

### 3. SearchMemoriesByCategoryTool
- Category-specific searches (USER_PROFILE, TASK, KNOWLEDGE, GOAL, PREFERENCE)
- Category filtering validation
- Empty result handling
- Limit parameter in category searches

### 4. Memory Data Integrity
- Test data loading verification
- Multiple category representation
- Category-based retrieval

### 5. Error Handling
- Non-existent tool errors
- Missing required parameters
- Graceful failure scenarios

### 6. Integration Tests
- Cross-tool consistency
- Memory ID matching across different search methods
- Data integrity across search variations

### 7. AssistantServiceWithTools
- Service initialization with tools
- Tool availability verification
- (Note: Actual OpenAI API calls are not tested to avoid requiring API keys and making real API calls)

## Test Data

The `test-memories.json` file contains 8 carefully crafted memories:

1. **mem-001**: User profile - TypeScript preference
2. **mem-002**: Conversation - Architecture discussion
3. **mem-003**: Task - Implement authentication
4. **mem-004**: Preference - Dark mode preference
5. **mem-005**: Knowledge - TypeScript best practices
6. **mem-006**: Relationship - Team collaboration
7. **mem-007**: Goal - Master system design
8. **mem-008**: Assistant persona - Coding style

Each memory includes:
- Unique ID
- Title and content
- Category classification
- Importance level (1-5)
- Source references
- Timestamps
- Metadata

## Key Features

### Dependency Injection

The tests properly inject dependencies to ensure isolation:

```typescript
// Create repository with test data
const memoryRepository = new MemoryFileRepository(testMemoriesPath);

// Create services with injected dependencies
const memorySearchService = new MemorySearchService(
  vectorStore,
  undefined, // No OpenAI - uses fake embeddings
  memoryRepository // Injected test repository
);
```

### Vector Search Setup

Before tests run, the setup creates vector embeddings for all test memories:

```typescript
async function setupTestVectors() {
  const memories = await memoryRepository.getAllMemories();
  for (const memory of memories) {
    const searchText = `${memory.title} ${memory.content}`;
    const embedding = vectorStore.fakeEmbed(searchText, 1536);
    await vectorStore.storeVector({
      sourceId: memory.id,
      sourceType: "Memory",
      embedding: embedding,
      metadata: { category: memory.category, title: memory.title }
    });
  }
}
```

### Cleanup

Tests automatically clean up generated files:

```typescript
afterAll(() => {
  if (fs.existsSync(testVectorsPath)) {
    fs.unlinkSync(testVectorsPath);
  }
});
```

## Extending the Tests

To add more tests:

1. Add test memories to `test-memories.json`
2. Create new test suites using `describe()`
3. Use `toolRegistry.executeTool()` to test tool execution
4. Verify results match expected structure and content

## Dependencies Modified

### MemorySearchService

Updated to accept optional `memoryRepository` parameter for dependency injection:

```typescript
constructor(
  vectorStore: VectorStore,
  embeddingService?: OpenAIEmbeddingService,
  memoryRepository?: IMemoryRepository  // NEW: Optional for testing
)
```

This change is backward compatible - existing code continues to work without changes.
