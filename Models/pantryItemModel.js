const mongoose = require("mongoose");

const PantryItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ["Produce", "Dairy", "Meat", "Pantry", "Frozen", "Other"],
    default: "Other",
  },
  expiryDate: { type: Date, required: true },
  quantity: { type: String }, // e.g., "2 lbs" or "1 carton"
  addedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["active", "consumed", "expired"],
    default: "active",
  },
});

// Indexing for the Expiry Cron Job
PantryItemSchema.index({ expiryDate: 1 });

const PantryItem = mongoose.model("PantryItem", PantryItemSchema);
