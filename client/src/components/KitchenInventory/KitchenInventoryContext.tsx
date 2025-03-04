import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { KitchenEquipment, EquipmentAnalysis } from '@/ai-services/kitchen-inventory-ai';
import { useAuth } from '@/hooks/use-auth';

interface KitchenInventoryState {
  equipment: KitchenEquipment[];
  analysis: EquipmentAnalysis | null;
  loading: boolean;
  error: string | null;
}

type KitchenInventoryAction =
  | { type: 'SET_EQUIPMENT'; payload: KitchenEquipment[] }
  | { type: 'SET_ANALYSIS'; payload: EquipmentAnalysis }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_EQUIPMENT'; payload: KitchenEquipment }
  | { type: 'UPDATE_EQUIPMENT'; payload: KitchenEquipment }
  | { type: 'DELETE_EQUIPMENT'; payload: number };

const initialState: KitchenInventoryState = {
  equipment: [],
  analysis: null,
  loading: false,
  error: null,
};

const KitchenInventoryContext = createContext<{
  state: KitchenInventoryState;
  dispatch: React.Dispatch<KitchenInventoryAction>;
} | null>(null);

function kitchenInventoryReducer(
  state: KitchenInventoryState,
  action: KitchenInventoryAction
): KitchenInventoryState {
  switch (action.type) {
    case 'SET_EQUIPMENT':
      return { ...state, equipment: action.payload };
    case 'SET_ANALYSIS':
      return { ...state, analysis: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'ADD_EQUIPMENT':
      return { ...state, equipment: [...state.equipment, action.payload] };
    case 'UPDATE_EQUIPMENT':
      return {
        ...state,
        equipment: state.equipment.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case 'DELETE_EQUIPMENT':
      return {
        ...state,
        equipment: state.equipment.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
}

export function KitchenInventoryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(kitchenInventoryReducer, initialState);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!user) return;
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await fetch(`/api/kitchen-equipment/${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch equipment');
        const data = await response.json();
        dispatch({ type: 'SET_EQUIPMENT', payload: data });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load kitchen equipment' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchEquipment();
  }, [user]);

  return (
    <KitchenInventoryContext.Provider value={{ state, dispatch }}>
      {children}
    </KitchenInventoryContext.Provider>
  );
}

export function useKitchenInventory() {
  const context = useContext(KitchenInventoryContext);
  if (!context) {
    throw new Error('useKitchenInventory must be used within a KitchenInventoryProvider');
  }
  return context;
}