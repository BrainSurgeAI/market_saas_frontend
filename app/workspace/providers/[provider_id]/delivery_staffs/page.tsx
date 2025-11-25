"use client";

import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  //Filter, 
  Plus, 
  MoreVertical, 
  Trash2, 
  //Edit2,
  UserCog
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/lib/WorkspaceContext";
import { DeliveryPerson } from "@/app/models";
import { format } from "date-fns";

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

      // Simulate network delay for smoother UI transition if needed, or remove
      setTimeout(() => {
        setDeliveryPersons(data.data || []);
        setLoading(false);
      }, 300);
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
        variant: "success", // Note: shadcn default toast usually uses "default" or "destructive", confirm if "success" exists in your custom configuration
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
        return;
      }

      setDeliveryPersons((prev) =>
        prev.map((person) =>
          person.idCard === idCard ? { ...person, status: newStatus } : person
        )
      );

      toast({
        title: newStatus === 1 ? "已启用" : "已禁用",
        description: `配送人员状态已更新`,
        variant: "default",
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

  // Pagination Logic
  const totalPages = Math.ceil(deliveryPersons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = deliveryPersons.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 w-full mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900">配送人员管理</h1>
        <p className="text-sm text-gray-500">管理您的配送人员及其账号。</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className=" font-medium text-gray-900">
            全部配送员 <span className="text-gray-400 font-normal ml-1">{deliveryPersons.length}</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search" 
              className="pl-9 bg-white" 
            />
          </div>
          {/* <Button variant="outline" className="gap-2 bg-white text-gray-700 border-gray-300 hover:bg-gray-50" size="sm">
            <Filter className="h-4 w-4" />
            Filters
          </Button> */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-black text-white hover:bg-gray-800" size="sm">
                <Plus className="h-4 w-4" />
                添加配送员
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
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "提交中..." : "确认添加"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[50px] pl-6">
                <Checkbox />
              </TableHead>
              <TableHead className="text-sm font-medium text-gray-500">姓名</TableHead>
              <TableHead className="text-sm font-medium text-gray-500">电话</TableHead>
              <TableHead className="text-sm font-medium text-gray-500">状态</TableHead>
              <TableHead className="text-sm font-medium text-gray-500">创建时间</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  正在加载数据...
                </TableCell>
              </TableRow>
            ) : currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((person) => (
                <TableRow key={person.idCard} className="hover:bg-gray-50/50">
                  <TableCell className="pl-6">
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-gray-200">
                        <AvatarImage src="" alt={person.name} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 font-medium">
                          {person.name.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 text-sm">{person.name}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm font-mono">{person.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`
                        rounded-full font-normal text-xs px-2.5 py-0.5 border-0
                        ${person.status === 1 
                          ? "bg-green-50 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                        }
                      `}
                    >
                      {person.status === 1 ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {/* Mock Last Active date as it's not in API */}
                    {format(new Date(), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {person.createdAt 
                      ? format(new Date(person.createdAt), "MMM d, yyyy")
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(person.idCard, person.status === 1 ? 0 : 1)}>
                          <UserCog className="mr-2 h-4 w-4" />
                          {person.status === 1 ? "禁用账号" : "启用账号"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除账号
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center border-t pt-4">
        <Button 
          variant="outline" 
          size="sm"
          className="text-gray-700"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              // Simplified pagination logic for demo
              const pageNum = i + 1;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink 
                    isActive={currentPage === pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? "bg-gray-50" : ""}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            {totalPages > 5 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
          </PaginationContent>
        </Pagination>

        <Button 
          variant="outline" 
          size="sm"
          className="text-gray-700"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
