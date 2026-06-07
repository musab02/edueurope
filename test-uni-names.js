async function test() {
  try {
    const url = 'https://universitaly-backend.cineca.it/api/offerta-formativa/cerca-corsi?searchType=u&page=1&lingua=EN';
    const response = await fetch(url);
    const data = await response.json();
    
    // Fetch all pages to get all unique university names
    let page = 1;
    let unis = new Set();
    
    while (true) {
      const u = `https://universitaly-backend.cineca.it/api/offerta-formativa/cerca-corsi?searchType=u&page=${page}&lingua=EN`;
      const res = await fetch(u);
      const d = await res.json();
      const corsi = d.corsi || [];
      if (corsi.length === 0) break;
      
      corsi.forEach(c => {
        if (c.nomeStruttura) unis.add(c.nomeStruttura);
      });
      
      if (page >= d.totalPages) break;
      page++;
    }
    
    console.log('Unique universities in Italy:', Array.from(unis).sort());
  } catch (e) {
    console.error(e);
  }
}

test();
