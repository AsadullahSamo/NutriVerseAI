import { createContext, useContext, useEffect, useState } from "react"

const defaultPreferences = {
  accentColor: "#0ea5e9",
  notifications: true,
  dietaryPreferences: [],
  region: ""
}

const UserPreferencesContext = createContext(undefined)

export function UserPreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("userPreferences")
    return saved
      ? { ...defaultPreferences, ...JSON.parse(saved) }
      : defaultPreferences
  })

  useEffect(() => {
    localStorage.setItem("userPreferences", JSON.stringify(preferences))

    // Always enforce dark mode
    document.documentElement.classList.remove("light")
    document.documentElement.classList.add("dark")

    // Apply accent color
    document.documentElement.style.setProperty(
      "--accent-color",
      preferences.accentColor
    )
  }, [preferences])

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const resetPreferences = () => {
    setPreferences(defaultPreferences)
  }

  return (
    <UserPreferencesContext.Provider
      value={{ preferences, updatePreference, resetPreferences }}
    >
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    )
  }
  return context
}
