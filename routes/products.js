const express = require('express');
const router = express.Router();
const axios = require('axios');
const Product = require('../models/Product');

// POST /api/fetch-products
// Body: { category: 'smartphones' } (optional)
// Fetch products from DummyJSON API, save to DB, and return saved data

router.post('/fetch-products', async (req, res) => {
  try {
    const { category } = req.body;
    let apiUrl = 'https://dummyjson.com/products';

    if (category) {
      apiUrl = `https://dummyjson.com/products/category/${encodeURIComponent(category)}`;
    }

    // Fetch data from DummyJSON API
    const response = await axios.get(apiUrl);
    const products = response.data.products || response.data;

    // Upsert products in MongoDB
    const upsertPromises = products.map(p =>
      Product.findOneAndUpdate(
        { id: p.id },
        {
          id: p.id,
          title: p.title,
          price: p.price,
          description: p.description,
          category: p.category,
          image: p.thumbnail, // Using 'thumbnail' instead of 'image'
          rating: {
            rate: p.rating || 0,
            count: 0 // DummyJSON doesn't provide count, default to 0
          }
        },
        { upsert: true, new: true, runValidators: true }
      )
    );

    const savedProducts = await Promise.all(upsertPromises);
    res.json(savedProducts);

  } catch (error) {
    console.error('Error fetching products:', error.message);
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
    console.error('Error retrieving products from DB:', error.message);
    res.status(500).json({ error: 'Failed to fetch products from DB' });
  }
});

module.exports = router;
