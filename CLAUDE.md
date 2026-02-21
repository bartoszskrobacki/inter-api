# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS REST API (`inter-api`) - standard TypeScript/NestJS application using modular architecture.

## Package Manager

**Use `yarn` exclusively** - project is configured with `yarn.lock`.

## Common Commands

### Development
```bash
yarn install              # Install dependencies
yarn start:dev            # Run in watch mode (development)
yarn start:debug          # Run with debugger attached
yarn start:prod           # Run production build
```

### Testing
```bash
yarn test                 # Run unit tests
yarn test:watch           # Run tests in watch mode
yarn test:cov             # Run tests with coverage
yarn test:e2e             # Run E2E tests

# Single test file
yarn test path/to/file.spec.ts
```

### Code Quality
```bash
yarn lint                 # Run ESLint with auto-fix
yarn format               # Format code with Prettier
yarn build                # Compile TypeScript
```

## Architecture

### Module Structure
- **Modular NestJS architecture** - każdy feature ma własny moduł (controller + service + DTOs)
- Aktualny feature: `PromotionModule` w `src/promotion/`
- Główny moduł: `AppModule` importuje feature modules

### Entry Point
- `src/main.ts` - bootstrap aplikacji, port 3000 (lub `process.env.PORT`)

### Test Configuration
- **Unit tests**: `*.spec.ts` w `src/`, rootDir: `src/`, pattern: `.*\.spec\.ts$`
- **E2E tests**: `*.e2e-spec.ts` w `test/`, config: `test/jest-e2e.json`

### TypeScript Config
- Module system: `nodenext` (ESM compatible)
- Target: `ES2023`
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Strict null checks: ON, implicit any: OFF
