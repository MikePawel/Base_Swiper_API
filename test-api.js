/**
 * Simple test script to verify the API is working
 * Run with: node test-api.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing Base Swiper API...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', health.data.message);

    // Test 2: Get FEATURED tokens
    console.log('\n2. Testing FEATURED tokens endpoint...');
    const featured = await axios.get(`${API_BASE}/api/tokens/featured?limit=5`);
    console.log(`✅ Found ${featured.data.data.length} FEATURED tokens`);
    
    if (featured.data.data.length > 0) {
      const firstToken = featured.data.data[0];
      console.log(`   First token: ${firstToken.name} (${firstToken.address})`);
    }

    // Test 3: Get stats
    console.log('\n3. Testing stats endpoint...');
    const stats = await axios.get(`${API_BASE}/api/tokens/stats`);
    console.log('✅ Stats:', {
      totalTokens: stats.data.data.totalTokens,
      byListType: stats.data.data.byListType
    });

    // Test 4: Manual refresh (if you want to test)
    console.log('\n4. Testing manual refresh...');
    const refresh = await axios.post(`${API_BASE}/api/tokens/refresh`);
    console.log('✅ Manual refresh completed:', refresh.data.message);

    console.log('\n🎉 All tests passed! Your API is working correctly.');
    console.log('\n📝 Available endpoints:');
    console.log('   GET  /health - Health check');
    console.log('   GET  /api/tokens/featured - Get FEATURED tokens');
    console.log('   GET  /api/tokens/stats - Get database stats');
    console.log('   POST /api/tokens/refresh - Manual refresh');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    console.log('\n💡 Make sure your API is running: npm run dev');
  }
}

testAPI();
