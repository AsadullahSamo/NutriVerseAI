import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface UserProfile {
  bio?: string;
  profilePicture?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
  cookingPreferences?: {
    cuisineTypes?: string[];
    spiceLevel?: 'mild' | 'medium' | 'hot';
    dietaryRestrictions?: string[];
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (!user) return {};
    const saved = localStorage.getItem(`userProfile:${user.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`userProfile:${user.id}`, JSON.stringify(profile));
  }, [profile, user]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const clearProfile = () => {
    if (!user) return;
    localStorage.removeItem(`userProfile:${user.id}`);
    setProfile({});
  };

  return {
    profile,
    updateProfile,
    clearProfile,
    isLoaded: !!user,
  };
}