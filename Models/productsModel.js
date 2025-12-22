const mongoose = require("mongoose");
const fs = require("fs");
const validator = require("validator");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      minlength: 5,
      maxlength: 100,
      unique: true,
      //****** Using validator package */
      validate: {
        validator: function (val) {
          return validator.isAlpha(val);
        },
        message: "Product name must contain only alphabetic characters",
      },
    },
    categoty: { type: String, default: "General" },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: 5,
      max: 10000,
    },
    currency: { type: String, default: "USD" },
    description: { type: String },
    imageUrl: { type: String },
    tags: [String],
    manufacturingDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    inStock: { type: Boolean, default: true },
    rating: {
      type: Number,
      default: 0.0,
      //*****Build in validator */
      //   min: [1, "Rating must be 1 or above"],
      //   max: [5, "Rating must 5 or below"],
      //*****Custom validator */
      //   validate: {
      //     validator: function (val) {
      //       return val >= 1 && val <= 5;
      //     },
      //     message: "Rating ({VALUE}) must be between 1 and 5",
      //   },
      //****** Using validator package */
      validate: {
        validator: function (val) {
          return validator.isFloat(val.toString(), { min: 1, max: 5 });
        },
        message: "Rating ({VALUE}) must be between 1 and 5",
      },
    },
  },
  {
    toJSON: { virtuals: true }, //to include virtuals when data is output as JSON
    toObject: { virtuals: true }, //to include virtuals when data is output as JSON or Object
  }
);

productSchema.virtual("expireIn").get(function () {
  if (this.expiryDate) {
    const now = new Date();
    const diffTime = this.expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    if (years > 0)
      return years + " years " + months + " months " + days + " days";
    if (months > 0) return months + " months " + days + " days";
    return diffDays + " days";
  }
  return 0;
});

// MIDDLEWARE EXAMPLES
// Pre-save middleware only for 'save' and 'create' operations
// It will not run for 'insertMany', 'update', 'findOneAndUpdate', etc.
// Use 'pre' hook for pre-save operations
//save is only for save and create operations

//**********  DOCUMENT MIDDLEWARE */
productSchema.pre("save", async function () {
  console.log("pre save hook");
  // do async work
});
// Post-save middleware
//only for 'save' and 'create' operations
//not for 'insertMany', 'update', 'findOneAndUpdate', etc.
productSchema.post("save", function (doc) {
  fs.writeFileSync(
    "./logs/product_log.txt",
    `Product Saved: ${doc.name} at ${new Date().toISOString()}\n`,
    { flag: "a" }
  );
  console.log("After saving product: ", doc);
});
//******* QUERY MIDDLEWARE */
productSchema.pre("find", async function () {
  this.startTime = Date.now();
});

productSchema.post("find", function (docs) {
  const endTime = Date.now();
  console.log(
    `Query took ${endTime - this.startTime} milliseconds and returned ${
      docs.length
    } documents`
  );
});

//******** AGGREGATION MIDDLEWARE */
productSchema.pre("aggregate", async function () {
  console.log("Aggregation Pipeline: ", this.pipeline()); //this refers to the aggregation object
  this.startTime = Date.now();
});

productSchema.post("aggregate", function (result) {
  const endTime = Date.now();
  console.log(
    `Aggregation took ${endTime - this.startTime} milliseconds and returned ${
      result.length
    } documents`
  );
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
