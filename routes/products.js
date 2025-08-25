const express = require('express');
const router = express.Router();
const axios = require('axios');
const Product = require('../models/Product');

// POST /api/fetch-products
// Body: { category: 'electronics' } (optional)
// Fetch products from Fake Store API by category, save to DB, and return saved data

router.post('/fetch-products', async (req, res) => {
  try {
    const { category } = req.body;
    let apiUrl = 'https://fakestoreapi.com/products';

    if (category) {
      apiUrl += `/category/${encodeURIComponent(category)}`;
    }

    // Fetch data from Fake Store API
    const response = await axios.get(apiUrl);
    const products = response.data;

    // Upsert products in MongoDB (to avoid duplicates)
    const upsertPromises = products.map(p =>
  Product.findOneAndUpdate(
    { id: p.id },
    {
      title: p.title,
      price: p.price,
      description: p.description,
      category: p.category,
      image: p.image,
      rating: p.rating
    },
    { upsert: true, new: true, runValidators: true }
  )
);

    const savedProducts = await Promise.all(upsertPromises);

    res.json(savedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch and save products' });
  }
});

// GET /api/products
// Get all stored products from DB
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products from DB' });
  }
});

module.exports = router;
