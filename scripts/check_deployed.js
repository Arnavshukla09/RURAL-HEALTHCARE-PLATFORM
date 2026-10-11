// Check deployed Supabase keys on live site
async function checkKeys() {
  const res = await fetch('https://rural-healthcare-platform.vercel.app/');
  const html = await res.text();
  
  // Find all JS chunk URLs
  const chunkRegex = /\/_next\/static\/[^"]+\.js/g;
  const chunks = html.match(chunkRegex) || [];
  console.log('Found', chunks.length, 'JS chunks');
  
  for (let i = 0; i < Math.min(chunks.length, 10); i++) {
    const chunkUrl = 'https://rural-healthcare-platform.vercel.app' + chunks[i];
    const chunkRes = await fetch(chunkUrl);
    const body = await chunkRes.text();
    
    if (body.includes('supabase') || body.includes('boyzdml') || body.includes('sb_')) {
      console.log('\n--- Chunk', i, '---');
      console.log('URL:', chunks[i].substring(0, 60));
      
      const urlRefs = body.match(/boyzdml[a-z]+\.supabase\.co/g);
      if (urlRefs) console.log('Supabase URL refs:', urlRefs);
      
      const keys = body.match(/sb_[a-zA-Z0-9_-]+/g);
      if (keys) console.log('Publishable keys:', keys);
      
      const jwts = body.match(/eyJ[a-zA-Z0-9._-]{20,}/g);
      if (jwts) console.log('JWT tokens:', jwts.map(j => j.substring(0, 40) + '...'));
      
      // Look for ANON_KEY references
      if (body.includes('ANON_KEY')) console.log('Contains ANON_KEY reference');
      if (body.includes('PUBLISHABLE_KEY')) console.log('Contains PUBLISHABLE_KEY reference');
    }
  }
}

checkKeys().catch(console.error);
