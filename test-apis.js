// Test Daily.co and Ably API connections
// Run with: node test-apis.js

const DAILY_API_KEY = '8e48004b61c4a821639bc0e758f3b8f9a98401b6098f1d0d80edd988c742a15c';
const ABLY_API_KEY = '5VgiQQ.5m0sdg:09jLRjTeJpfN35J0zcRNb8CWbmNgjfaZETFk60d_fW8';

console.log('🐜 ANT TEST - API Verification\n');

// Test Daily.co
async function testDailyAPI() {
  console.log('Testing Daily.co API...');
  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Daily.co API: CONNECTED');
      console.log(`   Found ${data.data?.length || 0} existing rooms`);
      return true;
    } else {
      console.log('❌ Daily.co API: FAILED');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Daily.co API: ERROR');
    console.log(`   ${error.message}`);
    return false;
  }
}

// Test Ably
async function testAblyAPI() {
  console.log('\nTesting Ably API...');
  try {
    // Ably uses API key directly in the client, not REST API
    // We'll just verify the key format
    if (ABLY_API_KEY && ABLY_API_KEY.includes(':') && ABLY_API_KEY.length > 50) {
      console.log('✅ Ably API Key: VALID FORMAT');
      return true;
    } else {
      console.log('❌ Ably API Key: INVALID FORMAT');
      return false;
    }
  } catch (error) {
    console.log('❌ Ably API: ERROR');
    console.log(`   ${error.message}`);
    return false;
  }
}

// Test Daily.co Room Creation
async function testDailyRoomCreation() {
  console.log('\nTesting Daily.co Room Creation...');
  try {
    const roomName = `geoforge-test-${Date.now()}`;
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          max_participants: 10
        }
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Daily.co Room Creation: SUCCESS');
      console.log(`   Room URL: ${data.url}`);
      console.log(`   Room Name: ${data.name}`);
      
      // Clean up - delete the test room
      await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`
        }
      });
      console.log('   Test room cleaned up');
      
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Daily.co Room Creation: FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Daily.co Room Creation: ERROR');
    console.log(`   ${error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════\n');
  
  const dailyConnection = await testDailyAPI();
  const ablyKey = await testAblyAPI();
  const dailyRoomCreation = await testDailyRoomCreation();
  
  console.log('\n═══════════════════════════════════════');
  console.log('\n📊 TEST SUMMARY:');
  console.log(`   Daily.co Connection: ${dailyConnection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Ably Key Format: ${ablyKey ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Daily.co Room Creation: ${dailyRoomCreation ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = dailyConnection && ablyKey && dailyRoomCreation;
  console.log(`\n   Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 READY FOR HUMAN TESTING!');
    console.log('   Open: http://localhost:5173/dashboard');
    console.log('   Click: "Team Call" button');
    console.log('   Test: Video and messaging features');
  }
  
  console.log('\n═══════════════════════════════════════\n');
}

runTests();

