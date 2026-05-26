import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/hooks/use-auth";
import { categoryLabels } from "@shared/vocabulary";
import { BarChart3, FileWarning, Target } from "lucide-react";

type AdminAnalyticsOverview = {
  mostDifficultSigns: Array<{
    signId: string;
    word: string;
    category: string;
    attempts: number;
    correct: number;
  }>;
  lessonCompletionRate: Array<{
    lessonId: string;
    title: string;
    started: number;
    completed: number;
    completionRate: number;
  }>;
  quizFailRate: Array<{
    lessonId: string;
    attempts: number;
    passed: number;
    failRate: number;
  }>;
  recognitionFailRate: Array<{
    signId: string;
    expectedWord: string;
    attempts: number;
    correct: number;
    failRate: number;
    averageConfidence: number;
  }>;
  contentNeedingImprovement: Array<{
    signId: string;
    word: string;
    category: string;
    status: string;
    hasVideo: number;
    hasMetadata: number;
    activeQuizQuestions: number;
  }>;
};

export default function AdminAnalytics() {
  const { token, user, isAuthenticated } = useAuthStore();
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);

  useEffect(() => {
    if (!token || user?.role !== "admin") return;

    async function loadOverview() {
      const response = await fetch("/api/admin/analytics/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      setOverview(await response.json());
    }

    void loadOverview();
  }, [token, user?.role]);

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <Layout>
        <div className="container max-w-7xl mx-auto py-10 px-4">
          <Card className="p-6 space-y-2">
            <h1 className="text-2xl font-bold">Admin access required</h1>
            <p className="text-muted-foreground">
              Analytics overview is restricted to administrator accounts.
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto py-10 px-4 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7" />
            <h1 className="text-3xl font-bold">Admin Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Find hard signs, lesson drop-off, quiz failures, recognition issues,
            and content that needs improvement.
          </p>
        </div>

        {!overview ? (
          <Card className="p-6 text-muted-foreground">Loading analytics...</Card>
        ) : (
          <>
            <div className="grid lg:grid-cols-2 gap-6">
              <AnalyticsCard title="Most Difficult Signs" icon={<Target className="h-5 w-5" />}>
                {overview.mostDifficultSigns.length > 0 ? (
                  overview.mostDifficultSigns.map((item) => {
                    const accuracy =
                      item.attempts > 0
                        ? Math.round((Number(item.correct || 0) / item.attempts) * 100)
                        : 0;
                    return (
                      <Row key={item.signId} title={item.word || item.signId} detail={categoryLabels[item.category] || item.category}>
                        <Badge variant="outline">{accuracy}%</Badge>
                      </Row>
                    );
                  })
                ) : (
                  <Empty />
                )}
              </AnalyticsCard>

              <AnalyticsCard title="Lesson Completion Rate" icon={<BarChart3 className="h-5 w-5" />}>
                {overview.lessonCompletionRate.map((item) => (
                  <div key={item.lessonId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground">
                        {item.completed}/{item.started}
                      </span>
                    </div>
                    <Progress value={Number(item.completionRate || 0)} className="h-2" />
                  </div>
                ))}
              </AnalyticsCard>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <AnalyticsCard title="Quiz Fail Rate">
                {overview.quizFailRate.length > 0 ? (
                  overview.quizFailRate.map((item) => (
                    <Row key={item.lessonId} title={item.lessonId} detail={`${item.attempts} attempts`}>
                      <Badge variant="outline">{item.failRate || 0}% fail</Badge>
                    </Row>
                  ))
                ) : (
                  <Empty />
                )}
              </AnalyticsCard>

              <AnalyticsCard title="Recognition Fail Rate">
                {overview.recognitionFailRate.length > 0 ? (
                  overview.recognitionFailRate.map((item) => (
                    <Row key={item.signId} title={item.expectedWord} detail={`${item.attempts} attempts`}>
                      <Badge variant="outline">{item.failRate || 0}% fail</Badge>
                    </Row>
                  ))
                ) : (
                  <Empty />
                )}
              </AnalyticsCard>

              <AnalyticsCard title="Content Needing Improvement" icon={<FileWarning className="h-5 w-5" />}>
                {overview.contentNeedingImprovement.map((item) => (
                  <Row key={item.signId} title={item.word} detail={categoryLabels[item.category] || item.category}>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {!item.hasVideo && <Badge variant="outline">video</Badge>}
                      {!item.hasMetadata && <Badge variant="outline">metadata</Badge>}
                      {item.activeQuizQuestions < 2 && <Badge variant="outline">quiz</Badge>}
                    </div>
                  </Row>
                ))}
              </AnalyticsCard>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function AnalyticsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function Row({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div>
        <p className="font-medium">{title}</p>
        {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm text-muted-foreground">
      Analytics will appear after learners generate events.
    </p>
  );
}
