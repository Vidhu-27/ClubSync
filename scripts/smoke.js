(async () => {
  const base = 'http://localhost:3000'
  try {
    console.log('POST /api/auth/login')
    const loginRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'director@mitwpu.edu.in', password: 'Director@123' })
    })
    const loginJson = await loginRes.json().catch(() => null)
    console.log('login status', loginRes.status)
    console.log('login body', JSON.stringify(loginJson, null, 2))

    if (!loginJson || !loginJson.token) {
      console.error('No token returned; aborting dashboard fetch')
      process.exit(loginRes.status || 1)
    }

    const token = loginJson.token
    console.log('\nGET /api/dashboard/director')
    const dashRes = await fetch(base + '/api/dashboard/director', {
      headers: { Authorization: 'Bearer ' + token }
    })
    console.log('dashboard status', dashRes.status)
    const dashText = await dashRes.text()
    console.log('dashboard body (first 1k chars):', dashText.slice(0, 1000))

    process.exit(0)
  } catch (e) {
    console.error('error running smoke tests', e)
    process.exit(2)
  }
})()
