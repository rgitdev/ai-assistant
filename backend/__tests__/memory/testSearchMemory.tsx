import { MemoryRepositoryFactory } from "@backend/repository/memory/MemoryRepositoryFactory";

const memoryRepository = new MemoryRepositoryFactory().build();
const memory = await memoryRepository.searchMemories("what music does Radek like");
console.log(memory);


