import { addAllDummyProducts } from './addDummyProducts.js';

// Run this to add dummy products to the database
const runAddProducts = async () => {
  try {
    console.log('Starting to add products...');
    const results = await addAllDummyProducts();
    console.log('Finished adding products:', results);
  } catch (error) {
    console.error('Error adding products:', error);
  }
};

// Call the function
runAddProducts();
