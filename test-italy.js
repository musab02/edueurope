async function test() {
  try {
    let page = 1;
    let allCorsi = [];
    
    while (true) {
      const url = `https://universitaly-backend.cineca.it/api/offerta-formativa/cerca-corsi?searchType=u&page=${page}&lingua=EN`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const corsi = data.corsi || [];
      if (corsi.length === 0) break;
      
      allCorsi = allCorsi.concat(corsi);
      if (allCorsi.length >= data.totalResults || page >= data.totalPages) {
        break;
      }
      page++;
    }

    console.log('Total Corsi retrieved:', allCorsi.length);

    // 1. Unique degrees
    const degrees = new Map();
    allCorsi.forEach(c => {
      const en = c.tipoLaurea ? c.tipoLaurea.descrizioneEn : 'N/A';
      const it = c.tipoLaurea ? c.tipoLaurea.descrizione : 'N/A';
      degrees.set(en, it);
    });
    console.log('Unique degree types (EN => IT):', Array.from(degrees.entries()));

    // 2. Locations (sede) analysis
    let nullSedeCount = 0;
    const sediSample = [];
    allCorsi.forEach(c => {
      if (c.sede === null || c.sede === undefined) {
        nullSedeCount++;
      } else {
        if (sediSample.length < 10) sediSample.push(c.sede);
      }
    });
    console.log(`Corsi with null sede: ${nullSedeCount} / ${allCorsi.length}`);
    console.log('Sample non-null sedi:', sediSample);

    // Let's check some courses with non-null sede in detail
    const sampleWithSede = allCorsi.find(c => c.sede !== null);
    if (sampleWithSede) {
      console.log('Sample course with sede:', JSON.stringify(sampleWithSede, null, 2));
    }
  } catch (e) {
    console.error('Error fetching Italy API:', e);
  }
}

test();
