const { GoogleGenerativeAI } = require("@google/generative-ai");
const CustomError = require("../Utils/customError");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");
const dotenv = require("dotenv");
const generateRecipeFromPantry = require("../Utils/recipeService");
dotenv.config({ path: "./config.env" });
const PantryItem = require("../Models/pantryItemModel");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ---------------------------------- */
/* Utils */
/* ---------------------------------- */

// Clean noisy frontend inputs
const cleanItems = (items) => {
  return items
    .map((item) => item.toLowerCase().trim())
    .filter(
      (item) =>
        /^[a-z\s]+$/.test(item) && // only letters
        item.length > 2
    );
};

// Retry helper for 503 errors
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0 || err.status !== 503) throw err;
    await new Promise((r) => setTimeout(r, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

// Gemini model fallback chain
const generateWithFallback = async (prompt) => {
  const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.0-pro"];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if (err.status !== 503) throw err;
      console.log(`${modelName} overloaded → trying next`);
    }
  }

  throw new Error("All Gemini models overloaded");
};

// Extract JSON safely from Gemini response
const extractJSON = (text) => {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found");
  return JSON.parse(match[0]);
};

/* ---------------------------------- */
/* Controller */
/* ---------------------------------- */

exports.addItemsToPantry = asyncErrorHandler(async (req, res, next) => {
  console.log("addItemsToPantry called with body:", req.body);
  let { items } = req.body;

  if (!items || !Array.isArray(items)) {
    return next(new CustomError("Items must be an array", 400));
  }

  // 🧹 Clean noisy inputs
  const cleanedItems = cleanItems(items);

  if (cleanedItems.length === 0) {
    return next(new CustomError("No valid items found", 400));
  }

  // 🤖 Gemini prompt (short & clear → fewer overloads)
  const prompt = `
Return ONLY a JSON array.
From the list below, keep only valid cooking ingredients.
Ignore brands, electronics, random words, or symbols.

List:
${cleanedItems.join(", ")}
`;

  let aiText;
  try {
    aiText = await retryWithBackoff(() => generateWithFallback(prompt));
  } catch (err) {
    return next(new CustomError("AI service temporarily unavailable", 503));
  }

  let ingredients;
  try {
    ingredients = extractJSON(aiText);
    if (ingredients.length === 0) {
      return res
        .status(400)
        .json({ status: "failed", message: "no item seems edible" });
    } else {
      const itemsToAdd = ingredients.map((name) => ({ name }));
      // Add to user's pantry in DB
      req.user.pantry.push(...itemsToAdd);
      await req.user.save({ validateBeforeSave: false });
      PantryItem.insertMany(itemsToAdd);
      // res.status(200).json({
      //   status: "success",
      //   ingredients,
      // });
      let recipe;
      console.log("Generating recipe for pantry items:", ingredients);
      try {
        recipe = await generateRecipeFromPantry(ingredients);
      } catch (err) {
        return next(new CustomError("Failed to generate recipe", 500));
      }

      return res.status(200).json({
        status: "success",
        recipe,
      });
    }
  } catch (err) {
    res.status(500).json({
      status: "failed",
      err,
    });
    return next(new CustomError("Failed to parse AI response", 500));
  }
});
