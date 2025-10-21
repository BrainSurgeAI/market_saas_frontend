"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Trash2Icon, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User } from "@/app/models";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  tenantId: string;
  marketId: string;
  onUserDeleted: () => void;
}

export function DeleteUserDialog({
  isOpen,
  onClose,
  user,
  tenantId,
  marketId,
  onUserDeleted
}: DeleteUserDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // 判断是否为已删除用户（要恢复的用户）
  const isDeletedUser = user?.deletedAt !== null && user?.deletedAt !== undefined;
  
  // 判断是否为管理员用户
  const isAdminUser = user?.role?.includes("ADMIN");

  const handleAction = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    setDeleteStatus("idle");
    setErrorMessage("");

    try {
      // 根据当前状态执行删除或恢复操作
      const response = await fetch(`/api/markets/${marketId}/tenants/${tenantId}/users/${user.username}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restore: isDeletedUser // 如果是已删除用户，则执行恢复操作
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setDeleteStatus("success");
        setTimeout(() => {
          onClose();
          onUserDeleted();
          toast({
            title: isDeletedUser ? "恢复成功" : "禁用成功",
            description: isDeletedUser 
              ? `用户 ${user.name} 已成功恢复` 
              : `用户 ${user.name} 已成功删除`,
          });
        }, 1500);
      } else {
        setDeleteStatus("error");
        setErrorMessage(result.error || (isDeletedUser ? "恢复用户失败" : "禁用用户失败"));
      }
    } catch (error) {
      setDeleteStatus("error");
      setErrorMessage("发生网络错误，请稍后再试");
      console.error(isDeletedUser ? "恢复用户出错:" : "禁用用户出错:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isDeletedUser ? "恢复用户" : "禁用用户"}</DialogTitle>
          <DialogDescription>
            {isDeletedUser ? (
              "您确定要恢复这个已禁用的用户吗？恢复后用户将可以再次登录系统。"
            ) : isAdminUser ? (
              "您确定要删除这个管理员用户吗？删除后可能影响租户的管理功能。"
            ) : (
              "您确定要删除这个用户吗？此操作无法撤销。"
            )}
          </DialogDescription>
        </DialogHeader>

        {deleteStatus === "success" ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-center">
              {isDeletedUser ? "用户已成功恢复！" : "用户已成功禁用！"}
            </h3>
            <p className="text-sm text-gray-500 text-center">
              {isDeletedUser 
                ? "用户已恢复，现在可以正常登录系统。" 
                : "用户已禁用，现在无法登录系统。"
              }
            </p>
          </div>
        ) : (
          <>
            {deleteStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{isDeletedUser ? "恢复失败" : "禁用失败"}</AlertTitle>
                <AlertDescription>
                  {errorMessage || (isDeletedUser 
                    ? "恢复用户时发生错误，请稍后重试。" 
                    : "禁用用户时发生错误，请稍后重试。"
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="py-4">
              {user && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 border rounded-md bg-gray-50">
                    <div className={isDeletedUser ? "bg-blue-100 rounded-full p-2" : "bg-red-100 rounded-full p-2"}>
                      {isDeletedUser 
                        ? <RefreshCw className="h-5 w-5 text-blue-600" />
                        : <Trash2Icon className="h-5 w-5 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-gray-500 text-xs">{user.username}</p>
                      {isDeletedUser && <p className="text-xs text-blue-600 mt-1">当前状态: 已禁用</p>}
                    </div>
                  </div>
                  
                  {!isDeletedUser && isAdminUser && (
                    <Alert variant="destructive" className="bg-red-50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>警告</AlertTitle>
                      <AlertDescription>
                        禁用管理员用户将移除租户的主要管理账号，请确保有其他管理员可用。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onClose}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button 
                type="button" 
                size="sm"
                variant={isDeletedUser ? "default" : "destructive"}
                onClick={handleAction}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isDeletedUser ? "恢复中..." : "禁用中..."}
                  </>
                ) : (
                  isDeletedUser ? "确认" : "确认"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 