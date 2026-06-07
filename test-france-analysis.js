async function test() {
  try {
    const url = 'https://tie-api.campusfrance.org/sgetprograms/1';
    console.log('Fetching France catalog:', url);
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await response.json();
    const programs = data.programs || [];
    
    console.log('Total raw programs:', programs.length);
    
    const fullyEnglish = programs.filter(p => p.taughtenAll === 1);
    console.log('Total 100% English-taught programs:', fullyEnglish.length);

    // Get unique levels
    const levels = {};
    fullyEnglish.forEach(p => {
      levels[p.levelObtainedId] = (levels[p.levelObtainedId] || 0) + 1;
    });
    console.log('Unique levelObtainedId counts:', levels);

    // Let's print out 5 sample programs with their levels
    console.log('Sample program levels:');
    fullyEnglish.slice(0, 5).forEach(p => {
      console.log(`Program: ${p.programLabel} | Level ID: ${p.levelObtainedId}`);
    });
  } catch (e) {
    console.error(e);
  }
}

test();
