# Contributing to MarkFlow-Pro

Thank you for your interest in contributing to MarkFlow-Pro! This guide will help you get started.

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** >= 2.30.0

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/markflow-pro.git
   cd markflow-pro
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build the Project**

   ```bash
   npm run build
   ```

4. **Run Tests**

   ```bash
   npm test
   ```

5. **Start Development Mode** (watch for changes)

   ```bash
   npm run dev
   ```

## Code Style

- Use **TypeScript** with strict mode enabled.
- Follow the existing code style and conventions.
- Use **2 spaces** for indentation (no tabs).
- Add **JSDoc comments** to all public APIs.
- Keep functions small and focused.
- Use descriptive variable and function names.

### Linting

Run the linter before committing:

```bash
npm run lint
```

## Submitting Pull Requests

1. **Create a Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**

   Implement your feature or fix, ensuring all tests pass.

3. **Write Tests**

   Add tests for any new functionality. Maintain or improve code coverage.

4. **Commit**

   Use clear, descriptive commit messages:

   ```
   feat: add new built-in function for grid layout
   fix: resolve parser issue with nested function calls
   docs: update API documentation for renderer
   ```

5. **Push and Open a PR**

   ```bash
   git push origin feature/your-feature-name
   ```

   Open a Pull Request against the `main` branch with a clear description of your changes.

## Issue Guidelines

### Reporting Bugs

When reporting a bug, please include:

- A clear description of the problem.
- Minimal reproduction steps.
- The expected behavior vs. actual behavior.
- Your environment (Node.js version, OS, etc.).
- Any relevant log output or error messages.

### Requesting Features

When requesting a feature, please include:

- A clear description of the desired feature.
- The use case it addresses.
- Any examples or mockups if applicable.

### Questions

For questions about usage, please check the documentation first. If your question is not answered, feel free to open an issue.

## Project Structure

```
markflow-pro/
├── src/
│   ├── parser/      # Lexer, parser, and AST types
│   ├── engine/      # Evaluator, scope, and built-in functions
│   ├── renderer/    # HTML, PDF, slide renderers, and themes
│   ├── cli/         # Command-line interface
│   └── index.ts     # Main entry point
├── web/             # Web editor
├── tests/           # Test files
└── examples/        # Example .mf documents
```

## Thank You

Thank you for contributing to MarkFlow-Pro! Your efforts help make this project better for everyone.
