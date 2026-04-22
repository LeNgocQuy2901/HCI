import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { MessageSquare } from "lucide-react";

export default function Feedback() {
  return (
    <Layout>
      <PlaceholderPage
        title="Share Your Feedback"
        description="Help us improve SignLanguage AI. Tell us what you love and what we can do better."
        icon={<MessageSquare size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "Rate your experience with stars",
          "Written feedback form",
          "Feature request submission",
          "Bug report functionality",
          "Email notifications for responses",
          "Community feedback voting",
        ]}
      />
    </Layout>
  );
}
