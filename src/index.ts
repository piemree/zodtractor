import { z } from 'zod';
import OpenAI from 'openai';

// Zodtractor configuration type
export interface ZodtractorConfig {
  apiKey: string;
  model: string;
  baseURL?: string;
  organization?: string;
}

// Extraction options type
export interface ExtractOptions {
  additionalContext?: string;
  temperature?: number;
  maxTokens?: number;
}

// Zodtractor class
export class Zodtractor {
  private openai: OpenAI;
  private model: string;

  constructor(config: ZodtractorConfig) {
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
    });
    this.model = config.model;
  }

  /**
   * Function to extract data from text
   * @param text Text to extract data from
   * @param schema Zod schema
   * @param schemaDescription Schema description
   * @param options Additional options
   * @returns Extracted data
   */
  async extract<T extends z.ZodTypeAny>(
    text: string,
    schema: T,
    schemaDescription: string,
    options?: ExtractOptions
  ): Promise<z.infer<T>> {
    try {
      // Convert schema structure to JSON schema
      const jsonSchema = this.zodToJsonSchema(schema);
      
      // Create prompt with schema description and structure
      const prompt = this.createPrompt(text, jsonSchema, schemaDescription, options?.additionalContext);
      
      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a json data extraction assistant. Your task is to extract structured data from the given text according to the specified schema.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens,
        response_format: { type: 'json_object' }
      });

      // Get API response
      const content = response.choices[0]?.message.content;
      
      if (!content) {
        throw new Error('API response is empty or invalid');
      }

      // Parse JSON response
      const parsedData = JSON.parse(content);
      
      // Validate with Zod schema
      const validatedData = schema.parse(parsedData);
      
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Schema validation error: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  }

  /**
   * Converts Zod schema to JSON schema
   * @param schema Zod schema
   * @returns JSON schema
   */
  private zodToJsonSchema(schema: z.ZodTypeAny): any {
    // Simple schema converter
    const schemaDescription = this.getSchemaDescription(schema);
    return schemaDescription;
  }

  /**
   * Creates schema description
   * @param schema Zod schema
   * @returns Schema description
   */
  private getSchemaDescription(schema: z.ZodTypeAny): any {
    if (schema instanceof z.ZodObject) {
      const shape = schema._def.shape();
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(shape)) {
        const zodValue = value as z.ZodTypeAny;
        result[key] = {
          type: this.getZodTypeName(zodValue),
          description: zodValue.description || '',
          ...(zodValue instanceof z.ZodObject ? { properties: this.getSchemaDescription(zodValue) } : {}),
          ...(zodValue instanceof z.ZodArray ? { items: this.getSchemaDescription(zodValue._def.type) } : {})
        };
      }
      
      return result;
    } else if (schema instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.getSchemaDescription(schema._def.type)
      };
    } else {
      return {
        type: this.getZodTypeName(schema),
        description: schema.description || ''
      };
    }
  }

  /**
   * Returns the name of the Zod type
   * @param schema Zod schema
   * @returns Type name
   */
  private getZodTypeName(schema: z.ZodTypeAny): string {
    if (schema instanceof z.ZodString) return 'string';
    if (schema instanceof z.ZodNumber) return 'number';
    if (schema instanceof z.ZodBoolean) return 'boolean';
    if (schema instanceof z.ZodArray) return 'array';
    if (schema instanceof z.ZodObject) return 'object';
    if (schema instanceof z.ZodNull) return 'null';
    if (schema instanceof z.ZodOptional) return this.getZodTypeName(schema._def.innerType);
    return 'unknown';
  }

  /**
   * Creates prompt for API
   * @param text Text
   * @param jsonSchema JSON schema
   * @param schemaDescription Schema description
   * @param additionalContext Additional context
   * @returns Prompt
   */
  private createPrompt(
    text: string,
    jsonSchema: any,
    schemaDescription: string,
    additionalContext?: string
  ): string {
    return `
# Task: Extract Data from Text

## Schema Description
${schemaDescription}

## Schema Structure
\`\`\`json
${JSON.stringify(jsonSchema, null, 2)}
\`\`\`

## Text
\`\`\`
${text}
\`\`\`

${additionalContext ? `## Additional Context\n${additionalContext}\n` : ''}

## Instructions
1. Analyze the text above
2. Extract data according to the schema in JSON format
3. Make reasonable assumptions or use null values for missing information
4. Return only the JSON output, without any additional explanation
`;
  }
}

/**
 * Creates a Zodtractor instance
 * @param config Configuration
 * @returns Zodtractor instance
 */
export function createZodtractor(config: ZodtractorConfig): Zodtractor {
  return new Zodtractor(config);
}
