// Use native fetch (available in Node 18+)
const ADMIN_EMAIL = "vijesharumugam26@gmail.com";
const BACKEND_URL = "http://localhost:5000/api/admin/stats";

async function testAdminStats() {
    console.log(`Testing connection to ${BACKEND_URL}...`);
    try {
        const response = await fetch(BACKEND_URL, {
            headers: {
                'x-admin-email': ADMIN_EMAIL,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`❌ Request failed with status: ${response.status}`);
            const text = await response.text();
            console.error(`Response body: ${text}`);
            return;
        }

        const data = await response.json();
        console.log('✅ Success! Data received:');
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('❌ Network error:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testAdminStats();
