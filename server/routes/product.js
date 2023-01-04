const express = require("express");
const productRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

productRoutes.route("/products").get(async function (req, res) {
  try {
    let db_connect = dbo.getDb("store");
    const name = req.query.name;
    const sort = req.query.sort;
    let search = {};
    let sortCriteria = {};
    if (name) {
      search.name = { $regex: new RegExp(name), $options: "i" };
    }
    if (sort) {
      sortCriteria.price = sort === "desc" ? -1 : 1;
    }
    let result;
    if (sort) {
      result = await db_connect
        .collection("products")
        .find(search)
        .sort(sortCriteria)
        .toArray();
    } else {
      result = await db_connect.collection("products").find(search).toArray();
    }
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

productRoutes.route("/products/:id").get(async function (req, res) {
  try {
    let db_connect = dbo.getDb("store");
    let myquery = { _id: ObjectId(req.params.id) };
    let result = await db_connect.collection("products").findOne(myquery);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

productRoutes.route("/products/:id").put(function (req, response) {
  let db_connect = dbo.getDb("store");
  let myquery = { _id: ObjectId(req.params.id) };
  let newValues = {
    $set: {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      quantity: req.body.quantity,
      unit: req.body.unit,
      available: req.body.available,
    },
  };
  db_connect
    .collection("products")
    .updateOne(myquery, newValues, function (err, res) {
      if (err) throw err;
      console.log("1 document updated successfully");
      response.send(res);
    });
});

productRoutes.route("/products").post(async function (req, res) {
  try {
    let db_connect = dbo.getDb("store");
    let name = req.body.name;

    const existingProduct = await db_connect
      .collection("products")
      .findOne({ name: name });
    if (existingProduct) {
      res.status(400).send("A product with the same name already exists");
      return;
    }

    let product = {
      name: name,
      price: req.body.price,
      quantity: req.body.quantity,
      unit: req.body.unit,
      available: req.body.available,
    };
    const result = await db_connect.collection("products").insertOne(product);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

productRoutes.route("/products/:id").delete(async function (req, res) {
  try {
    let db_connect = dbo.getDb("store");
    let myquery = { _id: ObjectId(req.params.id) };
    const result = await db_connect.collection("products").deleteOne(myquery);
    console.log("1 document deleted");
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

productRoutes.route("/raport").get(async function (req, res) {
  try {
    let db_connect = dbo.getDb("store");
    const search = {};
    const name = req.query.name;
    if (name) {
      search.name = { $regex: new RegExp(name), $options: "i" };
      result = await db_connect
        .collection("products")
        .aggregate([
          {
            $match: search,
          },
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: "$quantity" },
              totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
            },
          },
          {
            $project: {
              _id: 0,
              name: name,
              totalQuantity: 1,
              totalValue: 1,
            },
          },
        ])
        .toArray();
    } else {
      result = await db_connect
        .collection("products")
        .aggregate([
          {
            $group: {
              _id: null,
              totalQuantity: { $sum: "$quantity" },
              totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
            },
          },
          { $project: { _id: 0, totalQuantity: 1, totalValue: 1 } },
        ])
        .toArray();
    }
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});
module.exports = productRoutes;
