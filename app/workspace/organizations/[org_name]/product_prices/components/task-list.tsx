"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit } from "lucide-react";
import { formatDeadline, isUrgent } from "../helpers";

interface Task {
  id: number;
  category: string;
  productCount: number;
  market: string;
  deadline: Date;
  status: string;
}

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>待处理报价任务</CardTitle>
            <CardDescription className="text-xs mt-1">按截止时间排序的待完成报价任务</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            查看全部
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>产品类别</TableHead>
              <TableHead>产品数量</TableHead>
              <TableHead>市场/区域</TableHead>
              <TableHead>截止时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id} className="text-xs">
                <TableCell className="font-medium">{task.category}</TableCell>
                <TableCell>{task.productCount}</TableCell>
                <TableCell>{task.market}</TableCell>
                <TableCell>
                  <Badge variant={isUrgent(task.deadline) ? "destructive" : "outline"}>
                    {formatDeadline(task.deadline)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    task.status === "已逾期" ? "destructive" : 
                    task.status === "进行中" ? "secondary" : 
                    "outline"
                  }>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}