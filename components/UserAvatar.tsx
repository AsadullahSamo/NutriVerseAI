import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Settings, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 45%)`;
};

interface UserAvatarProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ className = "", size = "md" }: UserAvatarProps) {
  const { user } = useAuth();
  const { preferences } = useUserPreferences();
  const [userData, setUserData] = useState(() => ({
    name: user?.name || user?.username,
    profilePicture: user?.profilePicture,
    preferences: {
      accentColor: preferences?.accentColor || getAvatarColor(user?.username || '')
    }
  }));

  // Update immediately when profile picture is removed
  useEffect(() => {
    const handleProfileUpdate = () => {
      const savedProfile = localStorage.getItem('userProfile');
      const savedPrefs = localStorage.getItem('userPreferences');
      
      try {
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setUserData(prev => ({
            ...prev,
            name: profile.name || user?.name || user?.username,
            profilePicture: profile.profilePicture
          }));
        }
        if (savedPrefs) {
          const prefs = JSON.parse(savedPrefs);
          setUserData(prev => ({
            ...prev,
            preferences: {
              ...prev.preferences,
              accentColor: prefs.accentColor || prev.preferences.accentColor
            }
          }));
        }
      } catch (e) {
        console.error('Error parsing storage data:', e);
      }
    };

    handleProfileUpdate();
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('localProfileUpdate', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('localProfileUpdate', handleProfileUpdate);
    };
  }, [user]);

  // Update when user or preferences change
  useEffect(() => {
    setUserData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        accentColor: preferences?.accentColor || prev.preferences.accentColor
      }
    }));
  }, [preferences?.accentColor]);

  if (!user) return null;

  const initials = getInitials(userData.name || user.username);

  return (
    <div className={cn("relative inline-block", className)}>
      {userData.profilePicture ? (
        <img
          src={userData.profilePicture}
          alt={userData.name || user.username}
          className={cn(
            "rounded-full object-cover",
            size === "sm" ? "h-8 w-8" : "h-10 w-10"
          )}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full font-semibold uppercase text-white",
            size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
          )}
          style={{ backgroundColor: userData.preferences.accentColor }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}