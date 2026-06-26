async function test() {
  const url = 'https://tah-app-ruddy.vercel.app/api/employee-auth-sync';
  console.log(`Sending POST request to ${url}...`);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'create',
        username: 'testsync',
      }),
    });

    console.log(`Response Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log("Response Body:", text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

test();
