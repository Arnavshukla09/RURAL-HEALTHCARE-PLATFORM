const fs = require('fs');
['components/Header.tsx', 'components/Footer.tsx', 'components/BottomTabBar.tsx'].forEach(f => {
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace('"use client"`n', '"use client"\n');
  fs.writeFileSync(f, s);
});
console.log("Fixed files");
