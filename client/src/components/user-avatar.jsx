import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Settings, LogOut, User } from "lucide-react";
const getInitials = (name) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};
const getAvatarColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 65%, 45%)`;
};
export function UserAvatar() {
    var _a;
    const { user, logoutMutation } = useAuth();
    const [, setLocation] = useLocation();
    if (!user)
        return null;
    const displayName = user.name || user.username;
    const initials = getInitials(displayName);
    const backgroundColor = ((_a = user.preferences) === null || _a === void 0 ? void 0 : _a.accentColor) || getAvatarColor(displayName);
    // Get profile picture from localStorage first, then fall back to user data
    const savedProfile = localStorage.getItem('userProfile');
    const profilePicture = savedProfile
        ? JSON.parse(savedProfile).profilePicture
        : user.profilePicture;
    return (<DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar className="h-8 w-8 cursor-pointer transition-transform hover:scale-105">
          {profilePicture ? (<AvatarImage src={profilePicture} alt={displayName}/>) : (<AvatarFallback style={{
                backgroundColor,
                color: '#fff',
            }} className="font-medium">
              {initials}
            </AvatarFallback>)}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8">
            {profilePicture ? (<AvatarImage src={profilePicture} alt={displayName}/>) : (<AvatarFallback style={{
                backgroundColor,
                color: '#fff',
            }} className="font-medium">
                {initials}
              </AvatarFallback>)}
          </Avatar>
          <div className="flex flex-col">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            {user.email && (<p className="text-xs text-muted-foreground">{user.email}</p>)}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setLocation("/profile")} className="cursor-pointer">
          <User className="mr-2 h-4 w-4"/>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4"/>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4"/>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);
}
