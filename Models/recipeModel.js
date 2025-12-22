const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: [{ type: String, required: true }], // Array of strings
  instructions: [{ type: String, required: true }], // Step-by-step
  cookTime: { type: String }, // e.g., "30 mins"
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
  isAiGenerated: { type: Boolean, default: false },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  imageUrl: { type: String },
  tags: [{ type: String }],
});

module.exports = mongoose.model("Recipe", RecipeSchema);
