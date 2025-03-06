import { z } from "zod";
import { describe, test, expect } from "@jest/globals";
import { createZodtractor } from "./index";

// API anahtarınızı buraya ekleyin
const apiKey = "your-openai-api-key";
const model = "gpt-4o-mini";

const zodtractor = createZodtractor({ apiKey, model });

describe("Zodtractor Tests", () => {
  test("should extract multiple users from text", async () => {
    // Sample text with information about multiple people
    const sampleText = `Hello, my name is John Doe and my age is 25. 
    But my friend's name is Jane Smith and her age is 24.`;

    // Schema description
    const schemaDescription =
      "This schema contains users personal information.";

    // Additional context to help the AI
    const additionalContext =
      "Extract all users mentioned in the text. If there is missing information, leave it blank or make reasonable assumptions.";

    // Define schema for multiple users
    const UserSchema = z.object({
      users: z
        .array(
          z.object({
            fullName: z.string().describe("User full name"),
            age: z.number().describe("User age"),
          })
        )
        .describe("Users information"),
    });

    // Extract data using Zodtractor
    const result = await zodtractor.extract(
      sampleText,
      UserSchema,
      schemaDescription,
      { additionalContext }
    );

    // Assertions
    expect(result).toBeDefined();
    expect(result).toBeInstanceOf(Object);
    expect(result.users).toBeInstanceOf(Array);
    expect(result.users.length).toBe(2);

    // Check first user
    expect(result.users[0].fullName).toBe("John Doe");
    expect(result.users[0].age).toBe(25);

    // Check second user
    expect(result.users[1].fullName).toBe("Jane Smith");
    expect(result.users[1].age).toBe(24);
  });

  test("should extract single user information", async () => {
    // Sample text with information about a single person
    const sampleText = `Hello, my name is Alice Johnson. I am 30 years old.`;

    // Schema description
    const schemaDescription =
      "This schema contains a user's personal information.";

    // Additional context
    const additionalContext = "Extract the user information from the text.";

    // Define schema for a single user
    const SingleUserSchema = z.object({
      name: z.string().describe("User's full name"),
      age: z.number().describe("User's age"),
    });

    // Extract data using Zodtractor
    const user = await zodtractor.extract(
      sampleText,
      SingleUserSchema,
      schemaDescription,
      { additionalContext }
    );

    // Assertions
    expect(user).toBeDefined();
    expect(user).toBeInstanceOf(Object);
    expect(user.name).toBe("Alice Johnson");
    expect(user.age).toBe(30);
  });
});
