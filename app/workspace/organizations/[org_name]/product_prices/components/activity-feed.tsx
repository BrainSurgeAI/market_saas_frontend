"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, ClipboardList, RefreshCw, Clock } from "lucide-react";
import { formatTime, getActivityIconColor } from "../helpers";

interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  time: Date;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'update': return <CheckCircle className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'task': return <ClipboardList className="h-4 w-4" />;
      case 'system': return <RefreshCw className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>最近活动</CardTitle>
        <CardDescription>系统通知和最近操作</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
              <div className={`rounded-full p-2 ${getActivityIconColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div>
                <p className="font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatTime(activity.time)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}