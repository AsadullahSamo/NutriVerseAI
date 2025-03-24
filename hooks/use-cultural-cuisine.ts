import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import type { CulturalCuisine, CulturalRecipe } from '@shared/schema';
import { useToast } from './use-toast';

export function useCuisines() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cuisines', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/cultural-cuisines');
      if (!response.ok) throw new Error('Failed to fetch cuisines');
      return response.json() as Promise<CulturalCuisine[]>;
    }
  });
}

export function useCuisine(id: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cuisine', id, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/cultural-cuisines/${id}`);
      if (!response.ok) throw new Error('Failed to fetch cuisine');
      return response.json() as Promise<CulturalCuisine>;
    },
    enabled: !!id
  });
}

export function useRecipesByCuisine(cuisineId: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recipes', cuisineId, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/cultural-recipes?cuisineId=${cuisineId}`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      return response.json() as Promise<CulturalRecipe[]>;
    },
    enabled: !!cuisineId
  });
}

export function useRecipe(id: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recipe', id, user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/cultural-recipes/${id}`);
      if (!response.ok) throw new Error('Failed to fetch recipe');
      return response.json() as Promise<CulturalRecipe>;
    },
    enabled: !!id
  });
}