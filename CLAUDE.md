# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Install dependencies**: `bun install`
- **Start development (frontend)**: `bun dev` - runs the main React app with hot reload
- **Start webapp**: `bun webapp` - runs the webapp frontend with hot reload  
- **Start backend**: `bun backend` - runs the API server with hot reload
- **Build for production**: `bun build ./src/index.html --outdir=dist --sourcemap --target=browser --minify --define:process.env.NODE_ENV='\"production\"' --env='BUN_PUBLIC_*'`
- **Start production**: `bun start`

## Architecture Overview

This is a Bun-based React application with a separate backend API server that provides AI assistant functionality via OpenAI integration.

### Project Structure

- **`src/`** - Main React application entry point and components
- **`webapp/`** - Full-featured web application with chat interface
  - `components/` - React components for chat UI (ChatApp, MessageList, ChatInput, etc.)
  - `client/` - AssistantClient for API communication
  - `config/` - Chat configuration
  - `styles/` - CSS including markdown styling
- **`backend/`** - API server and AI assistant logic
  - `api/assistant/` - REST API controller and sample responses
  - `assistant/` - Core Assistant class and system prompts
  - `client/openai/` - OpenAI service integration with factory pattern

### Key Components

**Backend Architecture:**
- `Assistant.tsx` - Main assistant class that orchestrates OpenAI communication
- `OpenAIService.ts` - Service interface with chat, image, and embedding capabilities
- `OpenAIServiceFactory.ts` - Factory for creating OpenAI service instances
- `AssistantController.tsx` - HTTP API controller handling REST endpoints

**Frontend Architecture:**
- `AssistantClient.tsx` - Client SDK for communicating with backend API
- `ChatApp.tsx` - Main chat interface component
- `ChatMarkdownMessage.tsx` - Renders markdown responses from assistant

### API Endpoints

- `POST /api/assistant/chat` - Send message to assistant
- `GET /api/assistant/conversations/:id` - Get conversation history
- `DELETE /api/assistant/conversations/:id` - Clear conversation
- `GET /api/assistant/health` - Health check endpoint

### Environment Setup

Requires `OPENAI_API_KEY` environment variable in `.env` file.

### Development Notes

- Uses Bun as runtime and package manager
- TypeScript with React JSX
- Two separate servers: webapp (frontend) and backend (API)
- OpenAI integration with Langfuse monitoring support
- Hot reload enabled for development
- Do not add features that are not requested

### Design Principles

- **Keep related data together**: Place related types, constants, and utilities in the same file or module. For example, if you have a `MemoryCategory` type, place any related constants like `MEMORY_CATEGORIES` in the same file (`Memory.ts`). This improves maintainability and reduces the need to hunt across multiple files for related definitions.

- **KISS Principle (Keep It Simple, Stupid)**: Prefer simple solutions over complex ones. A simple function is better than a complex class when it does the job. Choose the most straightforward approach that meets the requirements. Avoid over-engineering and unnecessary abstractions.