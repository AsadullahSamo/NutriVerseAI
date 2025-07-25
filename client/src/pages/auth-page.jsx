import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { insertUserSchema, forgotPasswordSchema } from "@/lib/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Loader2, Copy, Check } from "lucide-react"
import { Redirect } from "wouter"
import { useToast } from "@/hooks/use-toast"


export default function AuthPage() {
  const {
    user,
    loginMutation,
    registerMutation,
    forgotPasswordMutation
  } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCopySecretKey = async () => {
    if (showSecretKey) {
      await navigator.clipboard.writeText(showSecretKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Secret key copied",
        description: "Make sure to store it in a secure place"
      })
    }
  }

  const handleSecretKeySaved = () => {
    setShowSecretKey(null)
    // Proceed with redirect
    window.location.replace("/")
  }

  const loginForm = useForm({
    resolver: zodResolver(
      insertUserSchema.pick({ username: true, password: true })
    ),
    defaultValues: { username: "", password: "" }
  })

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "", preferences: {} }
  })

  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      username: "",
      secretKey: "",
      newPassword: ""
    }
  })

  const handleLogin = async data => {
    try {
      console.log("Auth page - starting login with data:", data)
      const result = await loginMutation.mutateAsync(data)
      console.log("Auth page - login successful, result:", result)
    } catch (error) {
      // Error is handled by mutation
      console.error("Auth page - login error:", error)
    }
  }

  const handleRegister = async data => {
    try {
      console.log("Auth page - starting registration with data:", { username: data.username })
      const result = await registerMutation.mutateAsync(data)
      console.log("Auth page - registration successful, result:", {
        hasUser: !!result.user,
        hasSecretKey: !!result.secretKey,
        hasToken: !!result.token,
        message: result.message
      })

      if (result && result.secretKey) {
        toast({
          title: "Registration successful",
          description: "Your secret key will be shown next."
        })

        // Show secret key immediately as backup
        setShowSecretKey(result.secretKey)

        // Wait for authentication state to be updated before redirecting
        // This prevents the flash back to login page
        let attempts = 0
        const maxAttempts = 10 // Maximum 5 seconds of waiting

        const checkAuthAndRedirect = () => {
          attempts++
          // Check if user is now authenticated by looking at the query cache
          const userData = queryClient.getQueryData(["/api/user"])
          console.log("Auth page - checking auth state before redirect:", {
            hasUserData: !!userData,
            attempt: attempts,
            maxAttempts
          })

          if (userData) {
            const secretKeyUrl = `/?secretKey=${encodeURIComponent(result.secretKey)}`
            console.log("Auth page - user authenticated, redirecting to:", secretKeyUrl)
            window.location.replace(secretKeyUrl)
          } else if (attempts < maxAttempts) {
            // If not authenticated yet, wait a bit more
            console.log("Auth page - user not authenticated yet, waiting...")
            setTimeout(checkAuthAndRedirect, 500)
          } else {
            // Fallback: redirect anyway after timeout
            console.log("Auth page - timeout reached, redirecting anyway")
            const secretKeyUrl = `/?secretKey=${encodeURIComponent(result.secretKey)}`
            window.location.replace(secretKeyUrl)
          }
        }

        // Start checking after a short delay
        setTimeout(checkAuthAndRedirect, 500)
      } else {
        console.error("Registration succeeded but missing secret key in response:", result)
        toast({
          title: "Registration issue",
          description: "Registration completed but secret key not received. Please contact support.",
          variant: "destructive"
        })
      }
    } catch (error) {
      // Error is handled by mutation, but log for debugging
      console.error("Auth page - registration error:", error)
    }
  }

  const handleForgotPassword = async data => {
    try {
      await forgotPasswordMutation.mutateAsync(data)
      setForgotPasswordOpen(false)
      toast({
        title: "Success",
        description:
          "Password has been reset successfully. You can now login with your new password."
      })
      forgotPasswordForm.reset()
    } catch (error) {
      // Error is handled by mutation
      console.error("Forgot password error:", error)
    }
  }

  if (user) {
    return <Redirect to="/" />
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center sm:text-left">
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Welcome to NutriVerse AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    className="space-y-4"
                  >
                    {loginMutation.error && (
                      <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {loginMutation.error.message}
                      </div>
                    )}
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Login
                      </Button>
                      <Dialog
                        open={forgotPasswordOpen}
                        onOpenChange={setForgotPasswordOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="link"
                            type="button"
                            className="text-sm"
                          >
                            Forgot Password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                          </DialogHeader>
                          <Form {...forgotPasswordForm}>
                            <form
                              onSubmit={forgotPasswordForm.handleSubmit(
                                handleForgotPassword
                              )}
                              className="space-y-4"
                            >
                              {forgotPasswordMutation.error && (
                                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                  {forgotPasswordMutation.error.message}
                                </div>
                              )}
                              <FormField
                                control={forgotPasswordForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={forgotPasswordForm.control}
                                name="secretKey"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Secret Key</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    <FormDescription>
                                      Enter the secret key that was provided
                                      during registration
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={forgotPasswordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button
                                type="submit"
                                className="w-full"
                                disabled={forgotPasswordMutation.isPending}
                              >
                                {forgotPasswordMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Reset Password
                              </Button>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(handleRegister)}
                    className="space-y-4"
                  >
                    {registerMutation.error && (
                      <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {registerMutation.error.message}
                      </div>
                    )}
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Register
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden hidden lg:flex flex-1 bg-primary/90 dark:bg-primary/70">
        <div className="max-w-2xl mx-auto px-8 pt-7 pb-12 flex flex-col justify-center text-primary-foreground">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Your Smart Nutrition Assistant
          </h1>
          <p className="text-base sm:text-lg opacity-90 space-y-4">
            Experience the power of AI in your kitchen. Get personalized meal
            plans, smart recipe recommendations, and real-time nutrition
            analysis. Our AI helps track your cooking mood, generates cultural
            cuisine insights, provides kitchen equipment analysis, and even
            makes smart shopping suggestions.
          </p>
          <ul className="mt-6 space-y-2 list-none">
            <li className="flex items-center gap-2">
              🤖 Advanced AI-powered nutrition analysis, tracking & insights
            </li>
            <li className="flex items-center gap-2">
              📊 Smart meal planning & recipe recommendations
            </li>
            <li className="flex items-center gap-2">
              🏠 Smart pantry management, analysis & expiry tracking
            </li>
            <li className="flex items-center gap-2">
              🌎 AI-generated cultural cuisine details
            </li>
            <li className="flex items-center gap-2">
              🔍 Intelligent kitchen equipment analysis, recommendations &
              recipe suggestions
            </li>
            <li className="flex items-center gap-2">
              👥 Community features for recipe sharing, cooking tips & food
              rescue
            </li>
            <li className="flex items-center gap-2">
              😊 AI mood tracking for cooking experiences
            </li>
          </ul>
          <p className="mt-6 text-sm italic font-semibold">
            And many more exciting features waiting for you to explore! Join now
            to discover all the way NutriVerse AI can transform your cooking
            journey.
          </p>
        </div>
      </div>

      {/* Secret Key Dialog - Backup display */}
      <Dialog open={!!showSecretKey} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Important: Save Your Secret Key
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Please save this secret key in a secure place. You will need it to
              reset your password if you forget it:
            </p>
            <div className="relative">
              <div className="p-3 bg-muted rounded-md font-mono text-sm break-all pr-12">
                {showSecretKey}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={handleCopySecretKey}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-md">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ Warning: This key will not be shown again. Store it somewhere
                secure.
              </p>
            </div>
            <Button onClick={handleSecretKeySaved} className="w-full">
              I Have Saved My Secret Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
