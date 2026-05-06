# Known Issues & Suggested Fixes

## Current Status
✅ **Backend**: API routes created  
✅ **Database**: Schema with RLS policies  
✅ **Offline**: Local storage + sync infrastructure  
✅ **Frontend**: Components and authentication  
✅ **Video**: Jitsi integration skeleton  

## Issues to Address

### 1. **Vite vs Next.js Mismatch**
**Issue**: Project structure is Vite (React) but API requires Next.js  
**Impact**: API routes won't work without proper Next.js setup  
**Fix**:
\`\`\`bash
# Option A: Migrate to full Next.js
npx create-next-app@latest --typescript --tailwind
# Copy src/components to app/components
# Move API routes from app/api to app/api

# Option B: Run separate backend
# Create separate Next.js backend server
# Update API_URL env to point to backend
npm run dev  # Frontend on port 5173
npm run api  # Backend on port 3000 (separate)
\`\`\`

### 2. **Database Migrations Not Applied**
**Issue**: Scripts created but not executed in Supabase  
**Fix**:
\`\`\`bash
# Log into Supabase Dashboard → SQL Editor
# Copy content of scripts/001_create_tables.sql
# Paste and execute
# Copy content of scripts/002_create_trigger.sql
# Paste and execute

# Or use Supabase CLI (preferred):
npm install -g supabase
supabase db push  # If using Supabase CLI locally
\`\`\`

### 3. **Service Worker Not Registered (Offline Sync)**
**Issue**: Offline functionality won't work without PWA setup  
**Fix**:
\`\`\`tsx
// Add to src/main.tsx or app/layout.tsx
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered', reg))
    .catch(err => console.log('SW registration failed', err));
}
\`\`\`

**Create `/public/sw.js`:**
\`\`\`js
self.addEventListener('install', event => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Implement cache-first or network-first strategies
});
\`\`\`

### 4. **Lucide React Version Incompatibility**
**Issue**: lucide-react 0.487.0 has breaking changes  
**Fix**:
\`\`\`bash
npm uninstall lucide-react
npm install lucide-react@latest
# Or pin to stable version:
npm install lucide-react@0.263.1
\`\`\`

### 5. **Jitsi Room Creation Missing**
**Issue**: No backend endpoint to generate Jitsi room IDs  
**Fix**: Already created in `/app/api/teleconsult/room/route.ts`
**Verify**: Call endpoint before opening Jitsi iframe

### 6. **RLS Policies Blocking Queries**
**Issue**: Supabase RLS policies may block legitimate requests  
**Fix**:
\`\`\`sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies;

-- Test with service role (for admin operations):
-- Use SUPABASE_SERVICE_ROLE_KEY in backend only
\`\`\`

### 7. **Offline Sync Conflicts**
**Issue**: Concurrent edits may cause sync conflicts  
**Fix**: Implement last-write-wins strategy
\`\`\`ts
// lib/offline/sync.ts - Add version tracking
interface SyncOperation {
  id: string;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  version: number;  // <-- Add this
  timestamp: number;
}
\`\`\`

### 8. **No Auth Redirect Guards**
**Issue**: Protected routes accessible without login  
**Fix**: Add middleware or ProtectedRoute wrapper
\`\`\`tsx
// lib/protected-route.tsx
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login');
      else setUser(session.user);
    });
  }, []);

  return user ? children : null;
}
\`\`\`

### 9. **Image Upload to Storage Not Tested**
**Issue**: Medical record file uploads may fail  
**Fix**: Test in `/app/api/upload/route.ts`
\`\`\`ts
// Verify file size limits (max 10MB recommended)
// Check MIME types (only PDF, PNG, JPG)
// Test with actual Supabase bucket permissions
\`\`\`

### 10. **No Error Boundaries**
**Issue**: Frontend crashes not caught  
**Fix**: Add React Error Boundary
\`\`\`tsx
// components/error-boundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    return this.state.hasError ? <ErrorFallback /> : this.props.children;
  }
}
\`\`\`

## Testing Checklist

- [ ] Run `npm run seed` → Verify 3+ facilities in Supabase
- [ ] Run `npm test` → Verify 8+ endpoints pass
- [ ] Run `npm run lint` → No errors
- [ ] Test offline toggle in DevTools → Verify localStorage has data
- [ ] Test Jitsi room creation → Verify room opens
- [ ] Test patient signup → Verify profile created in DB
- [ ] Test appointment sync → Verify offline data syncs when online

## Performance Optimization

1. **Lazy load Jitsi script** - Load on-demand in TeleconsultationModal
2. **Cache provider list** - Implement SWR with 5-min revalidation
3. **Compress medical images** - Use Sharp in upload endpoint
4. **Add database indexes** - On user_id, appointment_date for queries

## Security Audit Checklist

- [ ] All API routes verify auth token
- [ ] RLS policies restrict data access per user
- [ ] Password stored hashed (Supabase handles)
- [ ] File uploads validated (size, MIME type)
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize user input)
- [ ] CORS configured for frontend domain
