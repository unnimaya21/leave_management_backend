const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const retry = require("async-retry"); // Recommended: npm install async-retry

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const schema = {
  description: "Recipe object",
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    ingredients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    instructions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    cook_time: { type: SchemaType.STRING },
  },
  required: ["title", "ingredients", "instructions", "cook_time"],
};

const model = genAI.getGenerativeModel({
  // ⚡️ Switched to flash-8b for better availability and speed
  model: "gemini-1.5-flash-8b",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

exports.generateRecipeFromPantry = async (pantryItems) => {
  console.log("Generating recipe for pantry items:", pantryItems);
  // Use 'retry' to handle temporary 503/429 errors from Google
  return await retry(
    async (bail) => {
      try {
        const prompt = `Generate a recipe using: ${pantryItems.join(", ")}`;
        const result = await model.generateContent(prompt);

        return JSON.parse(result.response.text());
      } catch (error) {
        // If it's a safety block or bad request, don't retry, just stop
        if (error.status === 400) {
          return bail(new Error("Inappropriate content or invalid items."));
        }

        console.warn("Gemini temporary failure, retrying...", error.message);
        throw error; // Throwing triggers the retry
      }
    },
    {
      retries: 2,
      minTimeout: 1000, // Wait 1s, then 2s
    }
  ).catch((err) => {
    // Final fallback if all retries fail
    console.error("Final Gemini Error:", err);
    return {
      title: "Chef is taking a break",
      ingredients: [],
      instructions: [
        "The AI is currently busy. Please tap generate again in a few seconds.",
      ],
      cook_time: "N/A",
    };
  });
};
