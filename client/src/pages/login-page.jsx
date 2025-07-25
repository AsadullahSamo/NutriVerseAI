import React, { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Link } from "react-router-dom"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Input,
  Label
} from "@/components/ui/components"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

const LoginPage = () => {
  const { loginMutation } = useAuth()
  const { error, isPending } = loginMutation
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })

  const handleSubmit = async e => {
    e.preventDefault()
    loginMutation.mutate(formData)
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message || "An error occurred. Please try again."}</AlertDescription>
              </Alert>
            )}
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? "Logging in..." : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="text-center text-sm">
        <Link
          to="/forgot-password"
          className="text-primary hover:underline"
        >
          Forgot your password?
        </Link>
      </div>
      <div className="text-center text-sm">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}

export default LoginPage 