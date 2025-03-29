import { OpenAPIV3 } from 'openapi-types';

type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options";

type ExampleParams = {
  method: string;
  path: string;
  params: {
    path: Record<string, any>;
    query: Record<string, any>;
    body?: any;
  };
};

class OpenAPICodeGenerator {
  private openApi: OpenAPIV3.Document;
  private baseUrl: string;

  constructor(openApi: OpenAPIV3.Document, serverUrl?: string) {
    this.openApi = openApi;
    this.baseUrl = serverUrl || this.getDefaultServerUrl();
  }

  private getDefaultServerUrl(): string {
    return this.openApi.servers?.[0]?.url || "http://localhost";
  }

  private resolveSchemaExample(schema?: OpenAPIV3.SchemaObject): any {
    if (!schema) return "unknown";
    if (schema.example !== undefined) return schema.example;

    switch (schema.type) {
      case "string":
        return schema.format === "uuid"
          ? "00000000-0000-0000-0000-000000000000"
          : "string";
      case "number":
      case "integer":
        return 0;
      case "boolean":
        return true;
      case "object":
        return Object.entries(schema.properties || {}).reduce(
          (acc, [key, val]) => {
            acc[key] = this.resolveSchemaExample(val as OpenAPIV3.SchemaObject);
            return acc;
          },
          {} as Record<string, any>
        );
      case "array":
        return schema.items
          ? [this.resolveSchemaExample(schema.items as OpenAPIV3.SchemaObject)]
          : [];
      default:
        return "unknown";
    }
  }

  private collectExamples(): ExampleParams[] {
    const examples: ExampleParams[] = [];

    for (const [path, pathItem] of Object.entries(this.openApi.paths || {})) {
      if (!pathItem) continue;
      
      for (const method of Object.keys(pathItem).filter(k => 
        ["get", "post", "put", "delete", "patch", "head", "options"].includes(k)
      ) as HttpMethod[]) {
        const operation = pathItem[method] as OpenAPIV3.OperationObject;
        if (!operation || !["get", "post", "put", "delete"].includes(method))
          continue;

        const params = {
          path: {} as Record<string, any>,
          query: {} as Record<string, any>,
          body: null as any,
        };

        operation.parameters?.forEach((param) => {
          const parameter = param as OpenAPIV3.ParameterObject;
          const example = this.resolveSchemaExample(
            parameter.schema as OpenAPIV3.SchemaObject
          );
          if (parameter.in === "path") params.path[parameter.name] = example;
          if (parameter.in === "query") params.query[parameter.name] = example;
        });

        const requestBody = operation.requestBody as OpenAPIV3.RequestBodyObject;
        if (requestBody?.content?.["application/json"]) {
          const mediaType = requestBody.content[
            "application/json"
          ] as OpenAPIV3.MediaTypeObject;
          params.body = this.resolveSchemaExample(
            mediaType.schema as OpenAPIV3.SchemaObject
          );
        }

        examples.push({
          method: method.toUpperCase(),
          path,
          params,
        });
      }
    }

    return examples;
  }

  private generateCurlExample(example: ExampleParams): string {
    const { method, path, params } = example;
    const encodedQuery = new URLSearchParams(params.query).toString();
    const fullUrl = `${this.baseUrl}${path.replace(
      /{(\w+)}/g,
      (_, k) => params.path[k]
    )}${encodedQuery ? `?${encodedQuery}` : ""}`;

    return [
      `curl -X ${method}`,
      ...(params.body
        ? [
            '-H "Content-Type: application/json"',
            `-d '${JSON.stringify(params.body)}'`,
          ]
        : []),
      `'${fullUrl}'`,
    ].join(" ");
  }

  private generatePythonExample(example: ExampleParams): string {
    const { method, path, params } = example;
    const basePath = path.replace(/{(\w+)}/g, (_, k) => params.path[k]);

    const lines = [
      "import requests",
      "",
      `response = requests.${method.toLowerCase()}("${
        this.baseUrl
      }${basePath}"`,
    ];

    if (Object.keys(params.query).length) {
      lines.push(`    params=${JSON.stringify(params.query)},`);
    }

    if (params.body) {
      lines.push(`    json=${JSON.stringify(params.body)}`);
    }

    lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, "");
    lines.push(")");

    return lines.join("\n");
  }

  private generateJavaExample(example: ExampleParams): string {
    const { method, path, params } = example;
    const encodedQuery = new URLSearchParams(params.query).toString();
    const fullUrl = `${this.baseUrl}${path.replace(
      /{(\w+)}/g,
      (_, k) => params.path[k]
    )}${encodedQuery ? `?${encodedQuery}` : ""}`;

    const lines = [
      `HttpURLConnection conn = (HttpURLConnection) new URL("${fullUrl}").openConnection();`,
      `conn.setRequestMethod("${method}");`,
    ];

    if (params.body) {
      lines.push(
        'conn.setRequestProperty("Content-Type", "application/json");',
        "conn.setDoOutput(true);",
        "OutputStream os = conn.getOutputStream();",
        `os.write(${JSON.stringify(JSON.stringify(params.body))}.getBytes());`,
        "os.flush();",
        "os.close();"
      );
    }

    lines.push("int responseCode = conn.getResponseCode();");

    return lines.join("\n");
  }

  private generateJavaScriptExample(example: ExampleParams): string {
    const { method, path, params } = example;
    const encodedQuery = new URLSearchParams(params.query).toString();
    const fullUrl = `${this.baseUrl}${path.replace(
      /{(\w+)}/g,
      (_, k) => params.path[k]
    )}${encodedQuery ? `?${encodedQuery}` : ""}`;

    const lines = [`fetch('${fullUrl}', {`];

    const options = [`  method: '${method}'`];

    if (params.body) {
      options.push(
        "  headers: {",
        '    "Content-Type": "application/json"',
        "  },",
        `  body: JSON.stringify(${JSON.stringify(params.body)})`
      );
    }

    lines.push(...options, "})");
    lines.push(".then(response => response.json())");
    lines.push(".then(data => console.log(data))");
    lines.push('.catch(error => console.error("Error:", error));');

    return lines.join("\n");
  }

  private generateAxiosExample(example: ExampleParams): string {
    const { method, path, params } = example;
    const basePath = path.replace(/{(\w+)}/g, (_, k) => params.path[k]);
    const fullUrl = `${this.baseUrl}${basePath}`;

    const lines = [
      "import axios from 'axios';",
      "",
      `axios.${method.toLowerCase()}(\`${fullUrl}\`,`,
    ];

    const config = [];

    if (Object.keys(params.query).length) {
      config.push(`  params: ${JSON.stringify(params.query, null, 2)}`);
    }

    if (params.body) {
      config.push(`  data: ${JSON.stringify(params.body, null, 2)}`);
    }

    if (config.length > 0) {
      lines.push("  {");
      lines.push(config.join(",\n"));
      lines.push("  }");
    }

    lines.push(")");
    lines.push(".then(response => console.log(response.data))");
    lines.push(".catch(error => console.error('Error:', error));");

    return lines.join("\n");
  }

  // 公共接口
  public getCurlExamples(): string[] {
    return this.collectExamples().map((example) =>
      this.generateCurlExample(example)
    );
  }

  public getPythonExamples(): string[] {
    return this.collectExamples().map((example) =>
      this.generatePythonExample(example)
    );
  }

  public getJavaExamples(): string[] {
    return this.collectExamples().map((example) =>
      this.generateJavaExample(example)
    );
  }

  public getJavaScriptExamples(): string[] {
    return this.collectExamples().map((example) =>
      this.generateJavaScriptExample(example)
    );
  }

  public getAxiosExamples(): string[] {
    return this.collectExamples().map((example) =>
      this.generateAxiosExample(example)
    );
  }

  public getAllExamples(): string[] {
    return [
      ...this.getCurlExamples(),
      ...this.getPythonExamples(),
      ...this.getJavaExamples(),
      ...this.getJavaScriptExamples(),
      ...this.getAxiosExamples(),
    ];
  }
}

export { OpenAPICodeGenerator };