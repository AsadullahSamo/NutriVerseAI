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
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Size mappings
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16"
  };

  const [userData, setUserData] = useState({
    name: user?.name || user?.username,
    profilePicture: user?.profilePicture,
    preferences: user?.preferences || { accentColor: getAvatarColor(user?.username || '') }
  });

  // Update user data when it changes
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    const savedPrefs = localStorage.getItem('userPreferences');
    
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setUserData(prev => ({
        ...prev,
        name: profile.name || user?.name || user?.username,
        profilePicture: profile.profilePicture || user?.profilePicture
      }));
    }

    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setUserData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...prefs }
      }));
    }
  }, [user]);

  // Listen for profile updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProfile') {
        const profile = e.newValue ? JSON.parse(e.newValue) : null;
        if (profile) {
          setUserData(prev => ({
            ...prev,
            name: profile.name || user?.name || user?.username,
            profilePicture: profile.profilePicture || user?.profilePicture
          }));
        }
      }
      if (e.key === 'userPreferences') {
        const prefs = e.newValue ? JSON.parse(e.newValue) : null;
        if (prefs) {
          setUserData(prev => ({
            ...prev,
            preferences: { ...prev.preferences, ...prefs }
          }));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  if (!user) return null;

  const initials = getInitials(userData.name || user.username);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className={`${sizeClasses[size]} ${className} cursor-pointer transition-transform hover:scale-105`}>
          {userData.profilePicture ? (
            <AvatarImage src={userData.profilePicture} alt={userData.name || user.username} />
          ) : (
            <AvatarFallback
              style={{
                backgroundColor: userData.preferences.accentColor,
                color: '#fff',
              }}
              className="font-medium"
            >
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8">
            {userData.profilePicture ? (
              <AvatarImage src={userData.profilePicture} alt={userData.name || user.username} />
            ) : (
              <AvatarFallback
                style={{
                  backgroundColor: userData.preferences.accentColor,
                  color: '#fff',
                }}
                className="font-medium"
              >
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium leading-none">{userData.name || user.username}</p>
            {user.email && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setLocation("/profile")}
          className="cursor-pointer hover:bg-accent"
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLocation("/settings")}
          className="cursor-pointer hover:bg-accent"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => logoutMutation.mutate()}
          className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-accent hover:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}