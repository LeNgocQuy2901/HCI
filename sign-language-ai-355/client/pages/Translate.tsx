import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { Zap } from "lucide-react";

export default function Translate() {
  return (
    <Layout>
      <PlaceholderPage
        title="Text ↔ Sign Language Translation"
        description="Instantly translate between text and sign language. Perfect for communication, learning, and accessibility."
        icon={<Zap size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "Real-time text to sign language translation",
          "Sign language to text translation",
          "Video output showing sign language animations",
          "Support for multiple sign language variants",
          "History of recent translations",
          "Download or share translations",
        ]}
      />
    </Layout>
  );
}
