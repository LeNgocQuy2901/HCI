import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { UserPlus } from "lucide-react";

export default function Register() {
  return (
    <Layout>
      <PlaceholderPage
        title="Create Your Account"
        description="Join SignLanguage AI today and start your sign language learning journey. It's free and only takes a minute."
        icon={<UserPlus size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "Simple, quick registration process",
          "Social signup options",
          "Email verification",
          "Personalization preferences",
          "Free access to core features",
          "Optional profile setup",
        ]}
      />
    </Layout>
  );
}
