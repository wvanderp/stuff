import { action } from "./_generated/server";
import { v } from "convex/values";

export const generateMetadata = action({
  args: {
    photoUrls: v.array(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY as string;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable not set");
    }

    // Take up to 5 photos
    const photos = args.photoUrls.slice(0, 5);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://stuff-manager.app",
        "X-Title": "Stuff Manager",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-2025-04-01",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze the provided images and generate metadata for this item. Return a JSON object with:
- title: a short, descriptive title (3-6 words)
- description: a detailed description of the item (1-2 sentences)
- keywords: an array of searchable keywords (5-10 keywords)

Focus on identifying the item type, brand, model, condition, and notable features. Make the keywords useful for searching (include categories, brands, colors, materials, etc.).

Return ONLY valid JSON in this exact format:
{
  "title": "string",
  "description": "string",
  "keywords": ["string", "string", ...]
}`,
              },
              ...photos.map((url) => ({
                type: "image_url" as const,
                image_url: { url },
              })),
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No response from LLM");
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || "",
        description: parsed.description || "",
        keywords: parsed.keywords || [],
      };
    } catch (parseError) {
      throw new Error(`Failed to parse LLM response: ${content}`, { cause: parseError });
    }
  },
});
