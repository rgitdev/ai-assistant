import { IMemoryRepository } from "../../repository/memory/IMemoryRepository";

export const memoryResourceDefinitions = [
  {
    uri: "memory://recent",
    name: "Recent Memories",
    description: "The 10 most recent memory records",
    mimeType: "application/json",
  },
  {
    uri: "memory://all",
    name: "All Memories",
    description: "All memory records in the system",
    mimeType: "application/json",
  },
];

export interface MemoryResourceServices {
  memoryRepository: IMemoryRepository;
}

export async function memoryResourceHandler(
  uri: string,
  services: MemoryResourceServices
) {
  switch (uri) {
    case "memory://recent": {
      const memories = await services.memoryRepository.getRecentMemories(10);
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(memories, null, 2),
          },
        ],
      };
    }

    case "memory://all": {
      const memories = await services.memoryRepository.getAllMemories();
      return {
        contents: [
          {
            uri,
            mimeType: "application/json",
            text: JSON.stringify(memories, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}
