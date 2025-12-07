"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface NotificationItem {
  id: number;
  userId: number;
  category: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  code: number;
  message: string;
  data: {
    data: NotificationItem[];
    total: number;
    page: number;
    page_size: number;
  };
  requestId: string;
  timestamp: string;
}

interface NotificationsCardProps {
  /** 显示的通知数量限制，默认 20 */
  limit?: number;
  /** 是否显示"查看全部通知"按钮，默认 true */
  showViewAll?: boolean;
  /** 查看全部通知的链接，默认 '/workspace/notifications' */
  viewAllLink?: string;
  /** 卡片描述文本 */
  description?: string;
  /** 自定义标题 */
  title?: string;
}

export function NotificationsCard({
  limit = 20,
  showViewAll = true,
  viewAllLink = '/workspace/notifications',
  description = '最新订单和验收通知',
  title = '消息通知',
}: NotificationsCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);

  const formatNotificationTime = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/notifications?page=1&page_size=${limit}`);
        const result: NotificationsResponse = await response.json();

        if (result.code === 200 && result.data) {
          setNotifications(result.data.data || []);
        } else {
          setError(result.message || '获取通知数据失败');
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('获取通知数据时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [limit]);

  const markAsRead = async (notificationId: number, event?: React.MouseEvent) => {
    // 阻止事件冒泡
    if (event) {
      event.stopPropagation();
    }

    // 如果已经标记为已读，直接返回
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.isRead) {
      return;
    }

    try {
      setMarkingAsRead(notificationId);
      
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      const result = await response.json();

      if (result.code === 200) {
        // 更新本地状态
        setNotifications(prevNotifications =>
          prevNotifications.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );

        toast({
          title: "已标记为已读",
          description: "通知已成功标记为已读",
        });
      } else {
        throw new Error(result.message || '标记已读失败');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast({
        title: "操作失败",
        description: err instanceof Error ? err.message : '标记已读时发生错误',
        variant: "destructive",
      });
    } finally {
      setMarkingAsRead(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          {title}
          {!loading && unreadCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm text-slate-500">加载中...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-slate-500">暂无通知</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    notification.isRead
                      ? "bg-slate-50/50 border-slate-100"
                      : "bg-blue-50/50 border-blue-100"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0.5 bg-white"
                      >
                        {notification.category}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => markAsRead(notification.id, e)}
                              disabled={markingAsRead === notification.id}
                              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                            >
                              {markingAsRead === notification.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  标为已读
                                </>
                              )}
                            </Button>
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                          </>
                        )}
                      </div>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notification.content}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatNotificationTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {showViewAll && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-blue-600 hover:bg-blue-50"
                onClick={() => router.push(viewAllLink)}
              >
                查看全部通知
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

