/**
 * MongoDB Connection Test Script
 * Run with: node scripts/test-mongo.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI not found in .env.local');
  console.log('\nPlease add MONGODB_URI to your .env.local file:');
  console.log('MONGODB_URI=mongodb://localhost:27017/GutHib');
  process.exit(1);
}

console.log('🔄 Testing MongoDB connection...');
console.log('URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('\n✅ SUCCESS! MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port || 'N/A (Atlas)');
    
    // Test creating a sample document
    console.log('\n🔄 Testing document creation...');
    
    const TestSchema = new mongoose.Schema({
      name: String,
      timestamp: Date,
    });
    
    const Test = mongoose.model('Test', TestSchema);
    
    return Test.create({
      name: 'Connection Test',
      timestamp: new Date(),
    });
  })
  .then((doc) => {
    console.log('✅ Test document created:', doc._id);
    
    // Clean up test document
    return mongoose.connection.db.collection('tests').deleteMany({});
  })
  .then(() => {
    console.log('✅ Test document cleaned up');
    console.log('\n🎉 All tests passed! MongoDB is ready to use.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ FAILED! MongoDB connection error:');
    console.error(err.message);
    console.log('\nCommon solutions:');
    console.log('1. Check if MongoDB is running (for local)');
    console.log('2. Verify MONGODB_URI in .env.local');
    console.log('3. Check network access settings (for Atlas)');
    console.log('4. Verify username and password (for Atlas)');
    process.exit(1);
  });
