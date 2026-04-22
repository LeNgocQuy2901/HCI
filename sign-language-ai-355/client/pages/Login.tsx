import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { LogIn } from "lucide-react";

export default function Login() {
  return (
    <Layout>
      <PlaceholderPage
        title="Login to SignLanguage AI"
        description="Sign in to your account to access your learning progress, saved vocabulary, and personalized recommendations."
        icon={<LogIn size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "Email/password authentication",
          "Social login (Google, Apple, Facebook)",
          "Remember me functionality",
          "Forgot password recovery",
          "Two-factor authentication",
          "Session management",
        ]}
      />
    </Layout>
  );
}
