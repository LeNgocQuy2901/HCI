import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { User } from "lucide-react";

export default function Profile() {
  return (
    <Layout>
      <PlaceholderPage
        title="Your Profile"
        description="Manage your profile, track your learning progress, and view your saved vocabulary and achievements."
        icon={<User size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "User profile with avatar and bio",
          "Learning progress dashboard",
          "Achievement and badge system",
          "Saved vocabulary lists",
          "Learning statistics",
          "Settings and preferences",
        ]}
      />
    </Layout>
  );
}
