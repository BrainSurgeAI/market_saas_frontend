"use client"

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: number;
  linkTo?: string;
}

export function StatCard({ title, value, icon, trend = 0, linkTo }: StatCardProps) {
  // 创建卡片内容
  const cardContent = (
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {trend !== 0 && (
            <div className="flex items-center mt-1">
              {trend > 0 ? (
                <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span className={trend > 0 ? "text-xs text-red-500" : "text-xs text-green-500"}>
                {Math.abs(trend)}% 较昨日
              </span>
            </div>
          )}
        </div>
        <div className="p-3 bg-primary/10 rounded-full">
          {icon}
        </div>
      </div>
    </CardContent>
  );

  // 如果提供了链接，使用Link组件包装
  if (linkTo) {
    return (
      <Link href={linkTo} className="block">
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50">
          {cardContent}
        </Card>
      </Link>
    );
  }

  // 如果没有链接，直接返回Card
  return <Card>{cardContent}</Card>;
}