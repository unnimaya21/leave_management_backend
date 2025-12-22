const express = require("express");
const router = express.Router();
const fs = require("fs");
const Product = require("../Models/productsModel");
const apiFeatures = require("../Utils/apiFeatures");
const CustomError = require("../Utils/customError");
const asyncErrorHandler = require("../Utils/asyncErrorHandler");

//GET ALL PRODUCTS OR FILTERED PRODUCTS BASED ON QUERY PARAMS
exports.getProducts = asyncErrorHandler(async (req, res) => {
  let queryParams = req.query;
  console.log(queryParams);

  const apiFeature = new apiFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const filteredProducts = await apiFeature.query;
  res.json({
    status: "success",
    results: filteredProducts.length,
    data: filteredProducts,
  });

  //   if (Object.keys(queryParams).length === 0) {
  //     try {
  //       const allProducts = await Product.find();
  //       res.json({
  //         status: "success",
  //         count: allProducts.length,
  //         data: allProducts,
  //       });
  //       return;
  //     } catch (err) {
  //       res.status(404).json({
  //         status: "error",
  //         message: err.message,
  //       });
  //     }
  //   } else {
  //     if (queryParams.id) {
  //       try {
  //         // filteredProducts =awsit Product.find({ _id: queryParams.id });
  //         const filteredProducts = await Product.findById(queryParams.id);

  //         return res.json({
  //           status: "success",
  //           data: filteredProducts,
  //         });
  //       } catch (err) {
  //         res.status(404).json({
  //           status: "error",
  //           message: err.message,
  //         });
  //       }
  //     }
  //     if (queryParams.name) {
  //       try {
  //         const filteredProducts = await Product.find({ name: queryParams.name });
  //         return res.json({
  //           status: "success",
  //           data: filteredProducts,
  //         });
  //       } catch (err) {
  //         res.status(404).json({
  //           status: "error",
  //           message: err.message,
  //         });
  //       }
  //     }
  //     if (queryParams.fields) {
  //       try {
  //         const fields = queryParams.fields.split(",").join(" ");
  //         const filteredProducts = await Product.find().select(fields);
  //         return res.json({
  //           status: "success",
  //           data: filteredProducts,
  //         });
  //       } catch (err) {
  //         res.status(404).json({
  //           status: "error",
  //           message: err.message,
  //         });
  //       }
  //     }
  //     if (queryParams.sort) {
  //       try {
  //         const sortBy = queryParams.sort.split(",").join(" ");
  //         const filteredProducts = await Product.find().sort(sortBy);
  //         return res.json({
  //           status: "success",
  //           data: filteredProducts,
  //         });
  //       } catch (err) {
  //         res.status(404).json({
  //           status: "error",
  //           message: err.message,
  //         });
  //       }
  //     }
  //     if (queryParams.limit || queryParams.page) {
  //       let skip;
  //       let page;
  //       try {
  //         page = queryParams.page * 1 || 1;
  //         const limit = queryParams.limit * 1 || 10;
  //         skip = (page - 1) * limit;
  //         const filteredProducts = await Product.find().skip(skip).limit(limit);
  //         return res.json({
  //           status: "success",
  //           count: filteredProducts.length,
  //           data: filteredProducts,
  //         });
  //       } catch (err) {
  //         res.status(404).json({
  //           status: "error",
  //           message: err.message,
  //         });
  //       }
  //     }
  //   }
});

// CREATE NEW PRODUCT
exports.AddProducts = asyncErrorHandler(async (req, res, next) => {
  const savedProduct = await Product.create(req.body);

  res.status(201).json({
    status: "success",
    data: savedProduct,
  });
});

//PATCH/UPDATE PRODUCT BY ID
exports.UpdateProducts = async (req, res, next) => {
  console.log(
    "UpdateProducts called" + req.params.id + JSON.stringify(req.body)
  );

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    console.log(updatedProduct);
    if (!updatedProduct) {
      return next(new CustomError("Product not found", 404));
    }

    res.json({
      status: "update success",
      data: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
};

//DELETE PRODUCT BY ID
exports.deleteProducts = asyncErrorHandler(async (req, res, next) => {
  const deletedProduct = await Product.findByIdAndDelete(req.params.id);

  if (!deletedProduct) {
    return next(new CustomError("Product not found", 404));
  }

  res.json({
    status: "deletion success",
    data: deletedProduct,
  });
});

//GET PRODUCT STATISTICS- AGGREGATION PIPELINE
exports.getproductStats = asyncErrorHandler(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $match: { rating: { $gte: 4.5 } },
    },
    //   {
    //     $group: {
    //       _id: "$currency",   //grouping based on _id field -here currency
    //       numProducts: { $sum: 1 },
    //       avgRating: { $avg: "$rating" },
    //       avgPrice: { $avg: "$price" },
    //       minPrice: { $min: "$price" },
    //       maxPrice: { $max: "$price" },
    //     },
    //   },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.json({
    status: "success",
    count: stats.length,
    data: stats,
  });
});
//UNWIND EXAMPLE
exports.getProductsByTag = asyncErrorHandler(async (req, res, next) => {
  const tag = req.params.tag;

  const stats = await Product.aggregate([
    {
      $unwind: "$tags",
    },
    {
      $group: {
        _id: "$tags",
        numProducts: { $sum: 1 },
        products: { $push: "$name" },
        avgRating: { $avg: "$rating" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    { $addFields: { tag: "$_id" } },
    { $project: { _id: 0 } },
    { $match: { tag: tag } },
    {
      $sort: { numProducts: -1 },
    },
  ]);

  res.json({
    status: "success",

    data: stats,
  });
});
