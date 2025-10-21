"use client"

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import dayjs from 'dayjs';
import { useWorkspace } from "@/lib/WorkspaceContext";

export default function ProfileCard() {
  const { user } = useWorkspace();
  const [isEditing, setIsEditing] = useState(false);
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleSave = async () => {
   
    setIsEditing(false);
  };
  
  return (
    <Card className="w-full rounded-xl bg-muted/50">
      <div className="p-6">
  <div className="flex items-center justify-between">
    <h3 className="font-bold">账号信息</h3>
  </div>
</div>
<CardContent className="space-y-4">
  <div className="space-y-3">
    {/* 所属组织 */}
    <div className="flex">
      <div className="w-48 flex-shrink-0">
        <p className="text-sm text-gray-500">姓名</p>
      </div>
      <div className="flex-grow">
        <p className="text-sm">{user.name}</p>
      </div>
    </div>
    <div className="flex">
      <div className="w-48 flex-shrink-0">
        <p className="text-sm text-gray-500">用户名</p>
      </div>
      <div className="flex-grow">
        <p className="text-sm">{user.username}</p>
      </div>
    </div>
    <div className="flex">
      <div className="w-48 flex-shrink-0">
        <p className="text-sm text-gray-500">密码</p>
      </div>
      <div className="flex-grow">
        <p className="text-sm">********</p>
      </div>
    </div>
    <div className="flex">
      <div className="w-48 flex-shrink-0">
        <p className="text-sm text-gray-500">所属组织</p>
      </div>
      <div className="flex-grow">
        <p className="text-sm">{user.tenantName}</p>
      </div>
    </div>
    {/* 邮箱 */}
    <div className="flex">
      <div className="w-48 flex-shrink-0">
        <p className="text-sm text-gray-500">邮箱</p>
      </div>
      <div className="flex-grow">
        {isEditing ? (
          <input
            type="text"
            value={user.email || ''}
            onChange={() => {}}
            className="text-sm bg-white border rounded-md p-2 w-full text-black"
          />
        ) : (
          <p className="text-sm">{user.email || '未绑定'}</p>
        )}
      </div>
    </div>
    
    {/* 手机号 */}
    <div className="flex">
      <div className="w-48 flex-shrink-0">
        <p className="text-sm text-gray-500">手机号</p>
      </div>
      <div className="flex-grow">
        {isEditing ? (
          <input
            type="text"
            value={user.phone || ''}
            onChange={() => {}}
            className="text-sm bg-white border rounded-md p-2 w-full text-black"
          />
        ) : (
          <p className="text-sm">{user.phone || '未绑定'}</p>
        )}
      </div>
    </div>
  </div>
</CardContent>
      
    </Card>
  );
}