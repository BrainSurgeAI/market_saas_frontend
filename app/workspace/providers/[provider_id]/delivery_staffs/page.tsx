"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { DeliveryPerson } from "@/app/models";

export default function DeliveryPersonsPage() {
  const { provider_id } = useParams();
  const { user } = useWorkspace();

  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    idCard: "",
    phone: "",
    status: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // 加载配送人员数据
  useEffect(() => {
    fetchDeliveryPersons();
  }, [provider_id]);

  const fetchDeliveryPersons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/providers/${provider_id}/delivery-staffs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      setTimeout(() => {
        setDeliveryPersons(data.data);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("获取配送人员列表失败", error);
      toast({
        title: "获取数据失败",
        description: "无法加载配送人员数据，请重试",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 表单验证
    if (!formData.name || !formData.idCard || !formData.phone) {
      toast({
        title: "表单不完整",
        description: "请填写所有必填字段",
        variant: "destructive",
      });
      return;
    }

    if (!/^[1-9]\d{5}(18|19|20|21)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(formData.idCard)) {
      toast({
        title: "身份证号格式错误",
        description: "请输入正确的18位身份证号码",
        variant: "destructive",
      });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      toast({
        title: "手机号格式错误",
        description: "请输入正确的11位手机号码",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const body = {
        name: formData.name,
        idCard: formData.idCard,
        phone: formData.phone,
        status: 1,
        createdBy: user?.username || "unknown",
      }
      const response = await fetch(`/api/providers/${provider_id}/delivery-staffs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        toast({
          title: "添加失败",
          description: data.error,
          variant: "destructive",
        });
        return;
      }


      const newPerson = data.data;

      setDeliveryPersons((prev) => [...prev, newPerson]);

      setIsSubmitting(false);
      setIsDialogOpen(false);
      setFormData({ name: "", idCard: "", phone: "", status: 1 });

      toast({
        title: "添加成功",
        description: "配送人员信息已成功添加",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "添加失败",
        description: "无法添加配送人员信息，请重试",
        variant: "destructive",
      });
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }
  };

  const handleStatusChange = async (idCard: string, newStatus: 1 | 0) => {
    try {
      // 模拟API调用
      // 实际开发中替换为真实API
      const response = await fetch(`/api/providers/${provider_id}/delivery-staffs/${idCard}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        toast({
          title: "操作失败",
          description: "无法更新配送人员状态，请重试",
          variant: "destructive",
        });
      }

      setDeliveryPersons((prev) =>
        prev.map((person) =>
          person.idCard === idCard ? { ...person, status: newStatus } : person
        )
      );

      toast({
        title: newStatus === 1 ? "已启用" : "已禁用",
        description: `配送人员 ${deliveryPersons.find(p => p.idCard === idCard)?.name} 状态已更新`,
        variant: "success",
      });
    } catch (error) {
      console.error("更新配送人员状态失败", error);
      toast({
        title: "操作失败",
        description: "无法更新配送人员状态，请重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">配送人员管理</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDeliveryPersons}
              disabled={loading}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              刷新
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs">

                  新增
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>添加配送人员</DialogTitle>
                  <DialogDescription>
                    填写配送人员的基本信息，所有字段均为必填
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4 text-xs">
                    <div className="grid grid-cols-4 items-center gap-4 text-xs">
                      <Label htmlFor="name" className="text-right">
                        姓名
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="col-span-3"
                        placeholder="请输入真实姓名"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="idCard" className="text-right">
                        身份证号
                      </Label>
                      <Input
                        id="idCard"
                        name="idCard"
                        value={formData.idCard}
                        onChange={handleInputChange}
                        className="col-span-3"
                        placeholder="请输入18位身份证号码"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">
                        联系电话
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="col-span-3"
                        placeholder="请输入11位手机号码"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} className="text-xs" size="sm">
                      {isSubmitting ? "提交中..." : "确认添加"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-sm text-gray-500">正在加载配送人员数据...</p>
            </div>
          ) : deliveryPersons.length === 0 ? (
            <div className="flex justify-center py-8">
              <p className="text-sm text-gray-500">暂无配送人员数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>身份证号码</TableHead>
                  <TableHead>联系电话</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryPersons.map((person) => (
                  <TableRow key={person.idCard}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.idCard}</TableCell>
                    <TableCell>{person.phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={person.status === 1 ? "success" : "destructive"}
                      >
                        {person.status === 1 ? "已启用" : "已禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {person.status === 1 ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStatusChange(person.idCard, 0)}
                        >
                          禁用
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStatusChange(person.idCard, 1)}
                        >
                          启用
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
