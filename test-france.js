async function test() {
  try {
    const url = 'https://tie-api.campusfrance.org/sgetprograms/1';
    console.log('Fetching France catalog:', url);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log('Status code:', response.status);
    const data = await response.json();
    console.log('Response keys:', Object.keys(data));
    console.log('Programs count:', data.programs ? data.programs.length : 'undefined');
    if (data.programs && data.programs.length > 0) {
      console.log('Sample program item:', JSON.stringify(data.programs[0], null, 2));
    }
  } catch (e) {
    console.error('Error fetching France API:', e);
  }
}

test();
