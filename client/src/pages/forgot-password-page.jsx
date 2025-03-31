import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
export default function ForgotPasswordPage() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast({
                title: "Error",
                description: "Please enter your email address.",
                variant: "destructive"
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/account/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to request password reset");
            }
            setIsSubmitted(true);
            toast({
                title: "Password Reset Requested",
                description: "If an account with this email exists, you will receive a password reset link."
            });
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="container flex items-center justify-center min-h-screen py-8">
      <Card className="mx-auto max-w-md w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isSubmitted ? (<form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4"/>
                  <Input id="email" type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" autoComplete="email" disabled={isSubmitting}/>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting || !email}>
                {isSubmitting ? (<Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : null}
                Send Reset Link
              </Button>
            </form>) : (<div className="space-y-4 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 w-12 h-12 mx-auto flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-300"/>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a password reset link to <span className="font-medium">{email}</span>.
                </p>
                <p className="text-sm text-muted-foreground">
                  If you don't see it in your inbox, please check your spam folder.
                </p>
              </div>
              
              <Button variant="outline" className="mt-4" onClick={() => setIsSubmitted(false)}>
                Try another email
              </Button>
            </div>)}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Link href="/auth" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3 w-3"/>
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>);
}
