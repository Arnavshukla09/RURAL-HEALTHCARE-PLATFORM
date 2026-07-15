export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone: string
}

export interface SymptomResult {
  symptoms?: string[]
  urgency?: string
  possibleConditions?: string[]
  bodyArea?: string
}

export interface Doctor {
  id: string
  user_id: string
  name: string
  specialty: string
  specialization: string
  location: string
  phone: string
  rating: number
  govt: boolean
}
