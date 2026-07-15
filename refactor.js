const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

const routeMapping = {
  "home": "/",
  "dashboard": "/dashboard",
  "auth": "/login",
  "symptom-checker": "/symptom-checker",
  "consultation": "/consultation",
  "appointments": "/appointments",
  "records": "/records",
  "emergency": "/emergency",
  "locations": "/locations",
  "directory": "/directory",
  "camps": "/camps",
  "health-info": "/health-info",
  "doctor-patients": "/doctor/patients",
  "doctor-requests": "/doctor/requests",
  "admin-users": "/admin/users",
  "admin-campaigns": "/admin/campaigns",
  "admin-notifications": "/admin/notifications",
  "admin-appointments": "/admin/appointments",
  "admin-records": "/admin/records",
  "jitsi": "/appointments"
};

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (['Header.tsx', 'Footer.tsx', 'FloatingChat.tsx', 'BottomTabBar.tsx', 'AccessibilityBar.tsx', 'Authentication.tsx'].includes(file)) continue;

  let changed = false;

  if (content.includes('setCurrentPage')) {
    
    // Replace all calls first
    content = content.replace(/setCurrentPage\(\s*(['"])([^'"]+)\1\s*\)/g, (match, quote, page) => {
      const route = routeMapping[page] || `/${page}`;
      return `router.push("${route}")`;
    });
    
    // Replace setCurrentPage variables (e.g. setCurrentPage?.(action.page))
    content = content.replace(/setCurrentPage\?\.\(([^)]+)\)/g, 'router.push(`/${$1}`)');
    content = content.replace(/setCurrentPage\(([^)]+)\)/g, 'router.push(`/${$1}`)');

    // Remove from interface
    content = content.replace(/\s*setCurrentPage(?:\?)?:\s*\([^)]*\)\s*=>\s*void;?/g, '');
    
    // Remove from function parameters
    content = content.replace(/,\s*setCurrentPage/g, '');
    content = content.replace(/setCurrentPage,\s*/g, '');
    content = content.replace(/\{\s*setCurrentPage\s*\}/g, '{}');

    // Add router import if missing
    if (!content.includes('next/navigation')) {
      content = content.replace(/^(import.*)$/m, 'import { useRouter } from "next/navigation"\n$1');
    }

    // Inject const router = useRouter() inside the component
    const funcRegex = /export function ([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/;
    content = content.replace(funcRegex, (match) => {
      return match + '\n  const router = useRouter();';
    });

    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Refactored ${file}`);
  }
}
