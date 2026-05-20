import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { MessageSquare } from "lucide-react";

export default function Feedback() {
  return (
    <Layout>
      <PlaceholderPage
        title="Send Feedback"
        description="Help us improve SignLanguage AI. Tell us what works well and where we can do better."
        icon={<MessageSquare size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "Rate your experience",
          "Written feedback form",
          "Submit feature requests",
          "Report bugs",
          "Email notifications for replies",
          "Community feedback voting",
        ]}
      />
    </Layout>
  );
}
