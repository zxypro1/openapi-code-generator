# OpenAPI Example Code Generator

[![npm version](https://img.shields.io/npm/v/openapi-example-code-generator.svg)](https://www.npmjs.com/package/openapi-example-code-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Generate executable code examples from OpenAPI specifications for multiple languages.

## Features

- **Multi-language Support**: Generate code for cURL, Python, Java, JavaScript (Fetch API), and Axios
- **Smart Example Generation**: Automatically handles path/query parameters and request bodies
- **Type Safe**: Built with TypeScript and official OpenAPI types
- **Framework Agnostic**: Works with any OpenAPI 3.0+ specification
- **Multi-runtime Support**: Run in brower (React, Vue, etc.) and Node.js.

## Installation

```bash
npm install openapi-example-code-generator
# or
yarn add openapi-example-code-generator
```

## Usage

### Basic Example

```typescript
import { OpenAPICodeGenerator } from "openapi-example-code-generator";
import type { OpenAPIObject } from "openapi-types";

const openApiSpec: OpenAPIObject = {
  // Your OpenAPI specification
};

const generator = new OpenAPICodeGenerator(
  openApiSpec,
  "https://api.example.com"
);

// Get examples for specific language
const curlExamples = generator.getCurlExamples();
const pythonExamples = generator.getPythonExamples();
const axiosExamples = generator.getAxiosExamples();

// Get all examples
const allExamples = generator.getAllExamples();
```

### Advanced Usage

#### Custom Server URL

```typescript
// Override server URL from specification
const generator = new OpenAPICodeGenerator(
  openApiSpec,
  "https://custom-api.example.com"
);
```

#### Generate Specific Examples

```typescript
// Generate only Python examples
const pythonCode = generator.getPythonExamples();

// Generate Axios examples with TypeScript types
const axiosCode = generator.getAxiosExamples();
```

## Supported Languages

| Language   | Method                      | Example Output                         |
| ---------- | --------------------------- | -------------------------------------- |
| cURL       | `getCurlExamples()`       | `curl -X GET https://api.example...` |
| Python     | `getPythonExamples()`     | `import requests...`                 |
| Java       | `getJavaExamples()`       | `HttpURLConnection conn = ...`       |
| JavaScript | `getJavaScriptExamples()` | `fetch(...)`                         |
| Axios      | `getAxiosExamples()`      | `axios.get(...)`                     |

## API Reference

### `new OpenAPICodeGenerator(spec: OpenAPIObject, serverUrl?: string)`

Create a new generator instance.

**Parameters:**

- `spec`: OpenAPI 3.0+ specification object
- `serverUrl`: Optional base URL override

### Methods

- `getCurlExamples(): string[]`
- `getPythonExamples(): string[]`
- `getJavaExamples(): string[]`
- `getJavaScriptExamples(): string[]`
- `getAxiosExamples(): string[]`
- `getAllExamples(): string[]`

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

## License

MIT © [zxypro1](https://github.com/zxypro1)
