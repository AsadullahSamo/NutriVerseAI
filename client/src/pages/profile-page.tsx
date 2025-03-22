import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, User, Moon, Sun, Palette } from "lucide-react";

// Helper function to get initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// User preferences interface
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  notifications: boolean;
  dietaryPreferences: string[];
  region: string;
  units: 'metric' | 'imperial';
}

interface ProfileForm {
  name: string;
  profilePicture: string;
}

export default function ProfilePage() {
  const { user, updateProfileMutation, changePasswordMutation, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  // Profile state with localStorage persistence
  const [profileForm, setProfileForm] = useState<ProfileForm>(() => {
    const savedProfile = localStorage.getItem('userProfile');
    const defaultProfile = {
      name: user?.name || "",
      profilePicture: user?.profilePicture || "",
    };
    return savedProfile ? JSON.parse(savedProfile) : defaultProfile;
  });

  // Sync profileForm with user data when it changes
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || prev.name,
        profilePicture: user.profilePicture || prev.profilePicture
      }));
    }
  }, [user]);

  // User preferences state
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const savedPrefs = localStorage.getItem('userPreferences');
    return savedPrefs ? JSON.parse(savedPrefs) : {
      theme: 'system',
      accentColor: '#0ea5e9',
      notifications: true,
      dietaryPreferences: [],
      region: '',
      units: 'metric'
    };
  });
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Delete account state
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");

  // Save profile to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profileForm));
  }, [profileForm]);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    // Apply theme
    document.documentElement.classList.remove('light', 'dark');
    if (preferences.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.add(systemTheme);
    } else {
      document.documentElement.classList.add(preferences.theme);
    }
    // Apply accent color
    document.documentElement.style.setProperty('--accent-color', preferences.accentColor);
  }, [preferences]);

  // Handle preferences change
  const handlePreferencesChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev: ProfileForm) => ({ ...prev, [name]: value }));
  };
  
  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await updateProfileMutation.mutate({
        name: profileForm.name,
        profilePicture: profileForm.profilePicture
      });

      // Update localStorage
      localStorage.setItem('userProfile', JSON.stringify(profileForm));
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully."
      });
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile information.",
        variant: "destructive"
      });
    }
  };
  
  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation password do not match.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully."
      });
      
      // Reset password form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Password change error:", error);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: deleteAccountPassword })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete account");
      }
      
      // Logout and redirect to login page
      await logoutMutation.mutateAsync();
      
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account.",
        variant: "destructive"
      });
    }
  };
  
  // If user is not loaded yet, show loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Account Management</h1>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24">
                    {profileForm.profilePicture ? (
                      <AvatarImage src={profileForm.profilePicture} alt={user.username} />
                    ) : (
                      <AvatarFallback 
                        className="text-xl bg-primary text-primary-foreground"
                        style={{ backgroundColor: preferences.accentColor }}
                      >
                        {getInitials(profileForm.name || user.username)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="flex-1 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={user.username} disabled />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={profileForm.name} 
                        onChange={handleProfileChange}
                        placeholder="Enter your name" 
                      />
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="profilePicture">Profile Picture URL</Label>
                      <Input 
                        id="profilePicture" 
                        name="profilePicture"
                        value={profileForm.profilePicture || ""} 
                        onChange={handleProfileChange}
                        placeholder="https://example.com/your-profile-picture.jpg" 
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="flex gap-2" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
              <CardDescription>
                Customize your experience
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  <Button
                    variant={preferences.theme === 'light' ? 'default' : 'outline'}
                    onClick={() => handlePreferencesChange('theme', 'light')}
                    size="sm"
                  >
                    <Sun className="h-4 w-4 mr-1" />
                    Light
                  </Button>
                  <Button
                    variant={preferences.theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => handlePreferencesChange('theme', 'dark')}
                    size="sm"
                  >
                    <Moon className="h-4 w-4 mr-1" />
                    Dark
                  </Button>
                  <Button
                    variant={preferences.theme === 'system' ? 'default' : 'outline'}
                    onClick={() => handlePreferencesChange('theme', 'system')}
                    size="sm"
                  >
                    System
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full transition-all ${
                        preferences.accentColor === color ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handlePreferencesChange('accentColor', color)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Units</Label>
                <Select
                  value={preferences.units}
                  onValueChange={(value: 'metric' | 'imperial') => handlePreferencesChange('units', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric</SelectItem>
                    <SelectItem value="imperial">Imperial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Region</Label>
                <Input
                  value={preferences.region}
                  onChange={(e) => handlePreferencesChange('region', e.target.value)}
                  placeholder="Enter your region"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates and important notifications
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(checked: boolean) => handlePreferencesChange('notifications', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      name="currentPassword"
                      type="password" 
                      value={passwordForm.currentPassword} 
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      name="newPassword"
                      type="password" 
                      value={passwordForm.newPassword} 
                      onChange={handlePasswordChange}
                      placeholder="Enter your new password" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword"
                      type="password" 
                      value={passwordForm.confirmPassword} 
                      onChange={handlePasswordChange}
                      placeholder="Confirm your new password" 
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Delete Account</CardTitle>
                <CardDescription>
                  Permanently delete your account and all your data
                </CardDescription>
              </CardHeader>
              
              <CardFooter>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="space-y-2 py-4">
                      <Label htmlFor="delete-password">Confirm your password</Label>
                      <Input 
                        id="delete-password" 
                        type="password" 
                        value={deleteAccountPassword} 
                        onChange={(e) => setDeleteAccountPassword(e.target.value)}
                        placeholder="Enter your password" 
                      />
                    </div>
                    
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}