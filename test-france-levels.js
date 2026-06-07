async function test() {
  try {
    const listUrl = 'https://tie-api.campusfrance.org/sgetprograms/1';
    const response = await fetch(listUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await response.json();
    const programs = data.programs || [];
    
    const levelIds = [10, 11, 12, 21, 22, 23, 25, 26, 40, 41];
    
    for (const lvl of levelIds) {
      const prog = programs.find(p => p.levelObtainedId === lvl && p.taughtenAll === 1);
      if (!prog) {
        console.log(`No 100% English program found for level ${lvl}`);
        continue;
      }
      
      const detailUrl = `https://tie-api.campusfrance.org/sgetprogram/${prog.programId}`;
      const detailRes = await fetch(detailUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const detail = await detailRes.json();
      
      console.log(`Level ${lvl}:`);
      console.log(`  Title: ${detail.programLabel}`);
      console.log(`  Diploma EN: ${detail.diplomaEn}`);
      console.log(`  Diploma FR: ${detail.diplomaFr}`);
      console.log(`  Degree Type: ${detail.degreeTypeEn || detail.degreeTypeFr}`);
    }
  } catch (e) {
    console.error(e);
  }
}

test();
