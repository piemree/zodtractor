# Zodtractor

Zodtractor is a TypeScript library that extracts structured data from text using OpenAI API according to Zod schemas.

## Features

- Full integration with Zod schemas
- Text analysis powered by OpenAI API
- More accurate data extraction using schema descriptions
- Type safety with Zod validation

## Installation

```bash
npm install zodtractor
```

## Usage

Here's a simple usage example:

```typescript
import { z } from "zod";
import { createZodtractor } from "zodtractor";

// Schema definition
const UserSchema = z.object({
  fullName: z.string().describe("User full name"),
  age: z.number().describe("User age"),
});

// Schema type
type User = z.infer<typeof UserSchema>;

// Sample text
const sampleText = `Hello, my name is John Doe and my age is 25`;

async function main() {
  // Create Zodtractor instance
  const zodtractor = createZodtractor({
    apiKey: "your-openai-api-key",
    model: "gpt-4o-mini",
  });

  // Schema description
  const schemaDescription =
    "This schema contains personal information about a user.";

  // Extract data from text
  const user = await zodtractor.extract(
    sampleText,
    UserSchema,
    schemaDescription,
    {
      additionalContext:
        "If there is missing information in the text, leave it blank or make reasonable assumptions.",
    }
  );

  console.log("Extracted user information:");
  console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error);
```

## Advanced Usage: Extracting Multiple Entities

Zodtractor can also extract arrays of objects from text:

```typescript
import { z } from "zod";
import { createZodtractor } from "zodtractor";

// Schema for multiple users
const UsersSchema = z.object({
  users: z
    .array(
      z.object({
        fullName: z.string().describe("User full name"),
        age: z.number().describe("User age"),
      })
    )
    .describe("Users information"),
});

// Sample text with multiple people
const sampleText = `Hello, my name is John Doe and my age is 25. But my friend's name is Jane Smith and her age is 24.`;

async function main() {
  const zodtractor = createZodtractor({
    apiKey: "your-openai-api-key",
    model: "gpt-4o-mini",
  });

  const result = await zodtractor.extract(
    sampleText,
    UsersSchema,
    "This schema contains information about multiple users.",
    { additionalContext: "Extract all users mentioned in the text." }
  );

  console.log("Extracted users:");
  console.log(JSON.stringify(result, null, 2));
  // Output will contain an array of users with their names and ages
}

main().catch(console.error);
```

## Configuration Options

### ZodtractorConfig

```typescript
interface ZodtractorConfig {
  apiKey: string; // OpenAI API key
  model: string; // Model to use (e.g., 'gpt-4o-mini')
  baseURL?: string; // Custom API URL (optional)
  organization?: string; // OpenAI organization ID (optional)
}
```

### ExtractOptions

```typescript
interface ExtractOptions {
  additionalContext?: string; // Additional context information
  temperature?: number; // Model temperature (between 0-1)
  maxTokens?: number; // Maximum number of tokens
}
```

## How It Works

Zodtractor works by:

1. Converting your Zod schema to a format the AI can understand
2. Creating a prompt that includes your text, schema, and additional context
3. Sending the prompt to OpenAI's API
4. Parsing and validating the response against your Zod schema
5. Returning the structured, type-safe data

## License

MIT
