import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, Calendar, BookOpen } from "lucide-react";

interface ProgressStats {
  totalWords: number;
  masteredWords: number;
  currentStreak: number;
  longestStreak: number;
  totalReviewsToday: number;
  nextReviewDate?: string;
}

interface ProgressTrackerProps {
  stats: ProgressStats;
  compact?: boolean;
}

export default function ProgressTracker({
  stats,
  compact = false,
}: ProgressTrackerProps) {
  const masteryPercentage = (stats.masteredWords / stats.totalWords) * 100 || 0;

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.masteredWords}
          </div>
          <p className="text-xs text-muted-foreground">Đã nắm vững</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">
            {stats.currentStreak}
          </div>
          <p className="text-xs text-muted-foreground">Chuỗi ngày 🔥</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">
            {stats.totalReviewsToday}
          </div>
          <p className="text-xs text-muted-foreground">Hôm nay</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-500">
            {Math.round(masteryPercentage)}%
          </div>
          <p className="text-xs text-muted-foreground">Hoàn thành</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tiến độ tổng quan
            </h3>
            <Badge variant="outline">
              {stats.masteredWords} / {stats.totalWords}
            </Badge>
          </div>
          <Progress value={masteryPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {Math.round(masteryPercentage)}% từ vựng đã nắm vững
          </p>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chuỗi hiện tại</p>
              <p className="text-3xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Dài nhất: {stats.longestStreak} ngày
              </p>
            </div>
          </div>
        </Card>

        {/* Today's Reviews */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ôn tập hôm nay</p>
              <p className="text-3xl font-bold">{stats.totalReviewsToday}</p>
              {stats.nextReviewDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Lần ôn tiếp theo: {new Date(stats.nextReviewDate).toLocaleDateString("vi-VN")}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Mastered Words */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Từ đã nắm vững</p>
              <p className="text-3xl font-bold">{stats.masteredWords}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Cố gắng giữ nhịp tốt nhé!
              </p>
            </div>
          </div>
        </Card>

        {/* Total Words */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng số từ</p>
              <p className="text-3xl font-bold">{stats.totalWords}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Có sẵn để học
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
