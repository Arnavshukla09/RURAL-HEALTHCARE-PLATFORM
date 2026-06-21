"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Users, Activity, MapPin, Shield, Search, CheckCircle, XCircle, BarChart3, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AdminDashboardProps { user: any; setCurrentPage: (page: string) => void; language: string }

export function AdminDashboard({ user, setCurrentPage, language }: AdminDashboardProps) {
  const en = language === "en"
  const [userFilter, setUserFilter] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState({ totalUsers: 0, activeProviders: 0, totalAppts: 0, totalProviders: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const supabase = createClient()

        // Fetch all patients (users)
        const { data: patients, count: patientCount } = await supabase
          .from('patients')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })

        // Fetch providers
        const { data: providers, count: providerCount } = await supabase
          .from('healthcare_providers')
          .select('*', { count: 'exact' })

        // Count appointments
        const { count: apptCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })

        // Count verified providers
        const { count: verifiedCount } = await supabase
          .from('healthcare_providers')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', true)

        setStats({
          totalUsers: patientCount || 0,
          activeProviders: verifiedCount || 0,
          totalAppts: apptCount || 0,
          totalProviders: providerCount || 0
        })

        // Build user list combining patients
        const userList = (patients || []).map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'User',
          role: p.role || 'patient',
          status: 'active',
          joined: new Date(p.created_at).toLocaleDateString(en ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        }))

        setUsers(userList)
      } catch (err) {
        console.error('Failed to fetch admin data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAdminData()
  }, [])

  const filtered = users.filter(u => u.name.toLowerCase().includes(userFilter.toLowerCase()))

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 to-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">{en ? "Admin Dashboard" : "एडमिन डैशबोर्ड"}</h1>
          <p className="text-muted-foreground text-sm">{en ? "Platform management and analytics" : "प्लेटफ़ॉर्म प्रबंधन और विश्लेषण"}</p>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ icon: Users, label: en ? "Total Users" : "कुल उपयोगकर्ता", value: String(stats.totalUsers), color: "text-blue-600 bg-blue-50" },
            { icon: Activity, label: en ? "Active Providers" : "सक्रिय प्रदाता", value: String(stats.activeProviders), color: "text-green-600 bg-green-50" },
            { icon: BarChart3, label: en ? "Consultations" : "परामर्श", value: String(stats.totalAppts), color: "text-purple-600 bg-purple-50" },
            { icon: MapPin, label: en ? "Providers" : "प्रदाता", value: String(stats.totalProviders), color: "text-amber-600 bg-amber-50" },
          ].map((s, i) => { const I = s.icon; return (
            <Card key={i} className="hover-lift"><CardContent className="p-4 text-center">
              <div className={`h-10 w-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}><I className="h-5 w-5" /></div>
              <p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent></Card>
          )})}
        </div>
        {/* User Management */}
        <Card><CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center"><Shield className="h-5 w-5 mr-2 text-purple-600" />{en ? "User Management" : "उपयोगकर्ता प्रबंधन"} ({users.length})</CardTitle>
            <div className="relative"><Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <input className="pl-8 h-8 text-sm border rounded-lg w-48" placeholder={en ? "Search users..." : "खोजें..."} value={userFilter} onChange={e => setUserFilter(e.target.value)} />
            </div>
          </div>
        </CardHeader>
          <CardContent>
            {filtered.length > 0 ? (
              <div className="space-y-2">{filtered.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center font-semibold text-purple-700 text-sm">{u.name.charAt(0)}</div>
                    <div><p className="font-medium text-sm">{u.name}</p><p className="text-xs text-muted-foreground">{u.role} · {u.joined}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${u.role === 'doctor' ? 'bg-blue-100 text-blue-700' : u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{u.role}</Badge>
                    <Badge className="text-xs bg-green-100 text-green-700">{u.status}</Badge>
                  </div>
                </div>
              ))}</div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{en ? "No users found" : "कोई उपयोगकर्ता नहीं मिला"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
