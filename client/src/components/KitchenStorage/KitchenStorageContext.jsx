import React, { createContext, useContext, useReducer, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

const initialState = {
  locations: [],
  items: [],
  loading: false,
  error: null,
  smartShoppingList: [],
  spoilagePredictions: [],
  layoutOptimization: { moves: [] }
}

const KitchenStorageContext = createContext(null)

function kitchenStorageReducer(state, action) {
  switch (action.type) {
    case "SET_LOCATIONS":
      return { ...state, locations: action.payload }
    case "SET_ITEMS":
      return { ...state, items: action.payload }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_SHOPPING_LIST":
      return { ...state, smartShoppingList: action.payload }
    case "SET_SPOILAGE_PREDICTIONS":
      return { ...state, spoilagePredictions: action.payload }
    case "SET_LAYOUT_OPTIMIZATION":
      return { ...state, layoutOptimization: action.payload }
    case "ADD_LOCATION":
      return { ...state, locations: [...state.locations, action.payload] }
    case "UPDATE_LOCATION":
      return {
        ...state,
        locations: state.locations.map(loc =>
          loc.id === action.payload.id ? action.payload : loc
        )
      }
    case "DELETE_LOCATION":
      return {
        ...state,
        locations: state.locations.filter(loc => loc.id !== action.payload)
      }
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] }
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      }
    case "DELETE_ITEM":
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      }
    default:
      return state
  }
}

export function KitchenStorageProvider({ children }) {
  const [state, dispatch] = useReducer(kitchenStorageReducer, initialState)
  const { user } = useAuth()

  useEffect(() => {
    const fetchStorageData = async () => {
      if (!user) return
      dispatch({ type: "SET_LOADING", payload: true })
      try {
        const [locationsRes, itemsRes] = await Promise.all([
          fetch("/api/storage-locations"),
          fetch("/api/storage-items")
        ])

        if (!locationsRes.ok || !itemsRes.ok) {
          throw new Error("Failed to fetch storage data")
        }

        const [locations, items] = await Promise.all([
          locationsRes.json(),
          itemsRes.json()
        ])

        dispatch({ type: "SET_LOCATIONS", payload: locations })
        dispatch({ type: "SET_ITEMS", payload: items })
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load storage data" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    fetchStorageData()
  }, [user])

  return (
    <KitchenStorageContext.Provider value={{ state, dispatch }}>
      {children}
    </KitchenStorageContext.Provider>
  )
}

export function useKitchenStorage() {
  const context = useContext(KitchenStorageContext)
  if (!context) {
    throw new Error(
      "useKitchenStorage must be used within a KitchenStorageProvider"
    )
  }
  return context
}
