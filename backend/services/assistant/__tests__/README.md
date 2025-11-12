# AssistantServiceWithTools Tests

This directory contains comprehensive tests for the `AssistantServiceWithTools` class with memory search tools integration.

## Test Types

### Unit Tests (`AssistantServiceWithTools.test.ts`)
Fast, isolated tests that use fake embeddings and don't make external API calls.

### Integration Tests (`AssistantServiceWithToolsIT.test.ts`)
End-to-end tests that make REAL OpenAI API calls. Requires `OPENAI_API_KEY` and may incur costs.

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

### Unit Tests (Fast, No API Calls)

```bash
# Run all unit tests
bun test backend/services/assistant/__tests__/AssistantServiceWithTools.test.ts

# Run with verbose output
bun test backend/services/assistant/__tests__/AssistantServiceWithTools.test.ts --verbose

# Run specific test suite
bun test backend/services/assistant/__tests__/AssistantServiceWithTools.test.ts -t "SearchMemoriesTool"
```

### Integration Tests (Requires OPENAI_API_KEY)

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-..."

# Run integration tests
bun test backend/services/assistant/__tests__/AssistantServiceWithToolsIT.test.ts

# Run all tests (unit + integration)
bun test backend/services/assistant/__tests__/
```

**Note**: Integration tests make real API calls and may incur OpenAI costs (~$0.01-0.05 per test run).

## Test Files

- **AssistantServiceWithTools.test.ts**: Unit tests with fake embeddings (30+ tests)
- **AssistantServiceWithToolsIT.test.ts**: Integration tests with real OpenAI API calls (5 tests)
- **test-memories.json**: Static test data with 8 sample memories across different categories
- **test-vectors.json**: Generated during unit tests, cleaned up after completion
- **test-vectors-it.json**: Generated during integration tests with real embeddings, cleaned up after completion
- **README.md**: This documentation file

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

### 7. AssistantServiceWithTools (Unit Tests)
- Service initialization with tools
- Tool availability verification

### 8. Integration Tests (AssistantServiceWithToolsIT)
- **Real OpenAI API Integration**: Actual calls to `sendConversationWithTools`
- **Memory Search Tool Invocation**: Tests OpenAI automatically calling search_memories tool
- **Category Search Tool Invocation**: Tests OpenAI calling search_memories_by_category tool
- **Multi-Turn Conversations**: Validates context preservation across multiple messages
- **Tool Enable/Disable**: Tests conversation with and without tools enabled
- **Real Embedding Quality**: Validates semantic search with actual OpenAI embeddings

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

## Integration Tests Deep Dive

### What Makes Them Different?

Integration tests (`AssistantServiceWithToolsIT.test.ts`) differ from unit tests in these key ways:

1. **Real API Calls**: Makes actual HTTP requests to OpenAI's API
2. **Real Embeddings**: Uses OpenAI's embedding model instead of fake embeddings
3. **Real Tool Calling**: Tests the complete OpenAI function calling flow
4. **Slower Execution**: ~5-10 seconds per test vs milliseconds for unit tests
5. **Requires API Key**: Must have valid `OPENAI_API_KEY` environment variable
6. **Incurs Costs**: Each test run costs ~$0.01-0.05 in OpenAI API usage

### Integration Test Scenarios

#### 1. Memory Search with Natural Language
Tests OpenAI's ability to understand a user query and automatically invoke the `search_memories` tool:

```typescript
const messages = [
  {
    role: "user",
    content: "What do you know about my programming language preferences?"
  }
];

const response = await assistantService.sendConversationWithTools(
  systemPrompt,
  messages
);
```

**Expected behavior**: OpenAI recognizes the need to search memories, calls the tool, and incorporates the results into its response.

#### 2. Category-Specific Search
Tests the `search_memories_by_category` tool invocation:

```typescript
const messages = [
  {
    role: "user",
    content: "Search my task-related memories for authentication."
  }
];
```

**Expected behavior**: OpenAI chooses the category-specific tool and correctly specifies the "task" category.

#### 3. Multi-Turn Conversation
Validates that conversation context is preserved across multiple exchanges:

```typescript
// First turn: Ask about goals
// Second turn: Ask about TypeScript knowledge
// Both should successfully use tools and maintain context
```

#### 4. Semantic Search Quality
Compares real OpenAI embeddings vs fake embeddings for search accuracy:

```typescript
// Real embeddings should find semantically similar content
// even when exact keywords don't match
const result = await toolRegistry.executeTool("search_memories", {
  query: "coding style and best practices"
});
```

### Running Integration Tests Safely

1. **Use a test API key** if possible to avoid mixing with production usage
2. **Monitor costs** in your OpenAI dashboard
3. **Run selectively** - don't run on every commit
4. **Consider CI/CD** - only run in specific environments with secrets configured

### Expected Output

When running integration tests, you'll see detailed logging:

```
=== Starting Integration Test: Memory Search ===
Sending conversation to OpenAI...
Response received in 2341ms
Assistant response: Based on my memory search, I can see that you prefer TypeScript...
=== Integration Test Complete ===
```

### Troubleshooting

**Error: "OPENAI_API_KEY environment variable is required"**
- Solution: Set your API key: `export OPENAI_API_KEY="sk-..."`

**Tests timing out**
- Solution: Increase timeout in test configuration (default: 60 seconds)
- Check your internet connection
- Verify OpenAI API status

**High costs**
- Solution: Integration tests use minimal tokens but check your OpenAI pricing tier
- Consider using a separate billing account for testing
