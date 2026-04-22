import https from 'https';
import fs from 'fs';

https.get('https://restcountries.com/v3.1/all', { headers: { 'User-Agent': 'Node.js' } }, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const countries = JSON.parse(data);
      if (!Array.isArray(countries)) {
        console.error('Not an array:', countries);
        return;
      }
      const questions = countries.map((c: any, i: number) => {
        if (!c.capital || !c.capital[0] || !c.cca3) return null;
        return `    { id: "wcap_ext_${i}", text: "Locate ${c.capital[0]} (Capital of ${c.name.common})", targetId: "${c.cca3}", targetName: "${c.name.common}", category: "capitals" }`;
      }).filter(Boolean);
      fs.writeFileSync('/capitals.txt', questions.join(',\\n'));
      console.log('Done');
    } catch (e) {
      console.error(e);
    }
  });
});
