import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "./UserAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { LogOut, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useUserPreferences } from "@/contexts/UserPreferencesContext";
export function UserButton() {
    const { user, logoutMutation } = useAuth();
    const { preferences } = useUserPreferences();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [userData, setUserData] = useState(() => {
        const savedProfile = localStorage.getItem('userProfile');
        const profile = savedProfile ? JSON.parse(savedProfile) : {};
        return {
            name: profile.name || (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.username),
            profilePicture: profile.profilePicture || (user === null || user === void 0 ? void 0 : user.profilePicture),
        };
    });
    // Force re-render when preferences change
    const [, setForceUpdate] = useState(0);
    const preferenceVersion = useRef(0);
    // Listen for profile updates and preference changes
    useEffect(() => {
        const handleProfileUpdate = () => {
            const savedProfile = localStorage.getItem('userProfile');
            if (savedProfile) {
                const profile = JSON.parse(savedProfile);
                setUserData(prev => (Object.assign(Object.assign({}, prev), { name: profile.name || (user === null || user === void 0 ? void 0 : user.name) || (user === null || user === void 0 ? void 0 : user.username), profilePicture: profile.profilePicture || (user === null || user === void 0 ? void 0 : user.profilePicture) })));
            }
        };
        const handlePreferencesUpdate = () => {
            // Force re-render by incrementing counter
            preferenceVersion.current += 1;
            setForceUpdate(preferenceVersion.current);
        };
        // Initial load
        handleProfileUpdate();
        // Listen for updates
        window.addEventListener('storage', handleProfileUpdate);
        window.addEventListener('localProfileUpdate', handleProfileUpdate);
        window.addEventListener('preferencesUpdate', handlePreferencesUpdate);
        return () => {
            window.removeEventListener('storage', handleProfileUpdate);
            window.removeEventListener('localProfileUpdate', handleProfileUpdate);
            window.removeEventListener('preferencesUpdate', handlePreferencesUpdate);
        };
    }, [user]);
    const handleLogout = async () => {
        try {
            // Store the profile data before logout
            const currentProfile = localStorage.getItem('userProfile');
            const currentPrefs = localStorage.getItem('userPreferences');
            await logoutMutation.mutateAsync();
            if (currentProfile && currentPrefs) {
                // Restore profile data right after logout
                localStorage.setItem('userProfile', currentProfile);
                localStorage.setItem('userPreferences', currentPrefs);
            }
            toast({
                description: "Logged out successfully",
            });
        }
        catch (error) {
            toast({
                variant: "destructive",
                description: "Failed to logout",
            });
        }
    };
    if (!user)
        return null;
    return (<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <UserAvatar size="md" key={`md-${preferences.accentColor}-${preferenceVersion.current}`}/>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2">
            <UserAvatar size="sm" key={`sm-${preferences.accentColor}-${preferenceVersion.current}`}/>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userData.name}</p>
              {user.email && (<p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>)}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer hover:bg-accent">
          <User className="mr-2 h-4 w-4"/>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-accent hover:text-red-600" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4"/>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);
}
