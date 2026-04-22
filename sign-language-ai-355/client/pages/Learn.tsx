import Layout from "@/components/Layout";
import PlaceholderPage from "./PlaceholderPage";
import { BookOpen } from "lucide-react";

export default function Learn() {
  return (
    <Layout>
      <PlaceholderPage
        title="Learn Sign Language Vocabulary"
        description="Master sign language with our interactive vocabulary lessons. Learn at your own pace with video demonstrations and interactive quizzes."
        icon={<BookOpen size={64} className="text-primary" />}
        ctaText="Back to Home"
        features={[
          "Interactive vocabulary cards with video demonstrations",
          "Organized vocabulary by category and difficulty level",
          "Progress tracking and achievement badges",
          "Spaced repetition learning system",
          "Quizzes to test your knowledge",
          "Offline learning mode",
        ]}
      />
    </Layout>
  );
}
