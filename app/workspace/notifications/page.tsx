"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Bell,
  ArrowLeft,
  Filter,
  CheckCircle2,
  XCircle,
  Check,
} from "lucide-react";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationItem {
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

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [isReadFilter, setIsReadFilter] = useState<string>(
    searchParams.get('isRead') || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get('category') || 'all'
  );
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null);

  const formatNotificationTime = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: zhCN });
    } catch {
      return dateString;
    }
  };

  const fetchNotifications = async (page: number, isRead?: string, category?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (isRead && isRead !== 'all') {
        params.append('isRead', isRead);
      }
      if (category && category !== 'all') {
        params.append('category', category);
      }
      
      const response = await fetch(`/api/notifications?${params.toString()}`);
      const result: NotificationsResponse = await response.json();

      if (result.code === 200 && result.data) {
        setNotifications(result.data.data || []);
        setTotal(result.data.total || 0);
        setCurrentPage(result.data.page || page);
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

  // 初始化：从 URL 参数读取状态
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const isRead = searchParams.get('isRead') || 'all';
    const category = searchParams.get('category') || 'all';
    
    setCurrentPage(page);
    setIsReadFilter(isRead);
    setCategoryFilter(category);
  }, []);

  // 当筛选条件或页码改变时，获取数据
  useEffect(() => {
    fetchNotifications(
      currentPage, 
      isReadFilter !== 'all' ? isReadFilter : undefined, 
      categoryFilter !== 'all' ? categoryFilter : undefined
    );
  }, [currentPage, isReadFilter, categoryFilter]);

  // 当筛选条件改变时，重置到第一页并更新 URL
  const handleFilterChange = (filterType: 'isRead' | 'category', value: string) => {
    const newIsReadFilter = filterType === 'isRead' ? value : isReadFilter;
    const newCategoryFilter = filterType === 'category' ? value : categoryFilter;
    
    if (filterType === 'isRead') {
      setIsReadFilter(value);
    } else {
      setCategoryFilter(value);
    }
    setCurrentPage(1);
    
    // 更新 URL 参数
    const params = new URLSearchParams();
    params.set('page', '1');
    if (newIsReadFilter !== 'all') {
      params.set('isRead', newIsReadFilter);
    }
    if (newCategoryFilter !== 'all') {
      params.set('category', newCategoryFilter);
    }
    router.replace(`/workspace/notifications?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchNotifications(page, isReadFilter !== 'all' ? isReadFilter : undefined, categoryFilter !== 'all' ? categoryFilter : undefined);
    
    // 更新 URL 参数
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (isReadFilter !== 'all') {
      params.set('isRead', isReadFilter);
    }
    if (categoryFilter !== 'all') {
      params.set('category', categoryFilter);
    }
    router.push(`/workspace/notifications?${params.toString()}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const markAsRead = async (notificationId: number, event?: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发点击通知的其他行为
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
        
        // 更新总数（如果当前筛选的是未读）
        if (isReadFilter === 'false') {
          setTotal(prev => Math.max(0, prev - 1));
        }

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

  const totalPages = Math.ceil(total / pageSize);

  // 获取所有唯一的类别
  const categories = ['新订单', '验收反馈', '配送异常', '退换货'];

  return (
    <div className="w-full bg-slate-50/50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                消息通知
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                共 {total} 条通知
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">筛选：</span>
              </div>
              
              <Select value={isReadFilter} onValueChange={(value) => handleFilterChange('isRead', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="已读状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="false">未读</SelectItem>
                  <SelectItem value="true">已读</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="通知类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类别</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-slate-500">加载中...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Bell className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">暂无通知</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 transition-colors hover:bg-slate-50/50 ${
                        notification.isRead
                          ? "bg-white"
                          : "bg-blue-50/30"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {notification.isRead ? (
                            <CheckCircle2 className="w-5 h-5 text-slate-400" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5 bg-white"
                                >
                                  {notification.category}
                                </Badge>
                                {!notification.isRead && (
                                  <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">
                                    未读
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-base font-semibold text-slate-900 mb-1">
                                {notification.title}
                              </h3>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {notification.content}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => markAsRead(notification.id, e)}
                                disabled={markingAsRead === notification.id}
                                className="flex-shrink-0 h-8 px-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                {markingAsRead === notification.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                                    标记中...
                                  </>
                                ) : (
                                  <>
                                    <Check className="w-3 h-3 mr-1" />
                                    标记已读
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-slate-100 p-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // 显示当前页前后各2页，以及首尾页
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => handlePageChange(page)}
                                  isActive={page === currentPage}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            page === currentPage - 3 ||
                            page === currentPage + 3
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

