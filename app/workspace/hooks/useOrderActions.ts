import { useState } from 'react';
import { OrderDetail, OrderItem, OrderStatus, TenantType, DeliveryPerson } from '@/lib/types/orderStatus';
import { useToast } from '@/hooks/use-toast';

export function useOrderActions(
  orderCode: string,
  orgId: string,
  tenantType: string,
  user: any,
  params: any,
  orderDetail: OrderDetail | null,
  setOrderDetail: (detail: OrderDetail) => void,
  returnExchangeRecords: any[],
  orderItems: OrderItem[]
) {
  const { toast } = useToast();

  const [processing, setProcessing] = useState(false);
  const [showDeliveryStaffDialog, setShowDeliveryStaffDialog] = useState(false);
  const [deliveryStaffs, setDeliveryStaffs] = useState<DeliveryPerson[]>([]);
  const [selectedDeliveryStaff, setSelectedDeliveryStaff] = useState<DeliveryPerson | null>(null);
  const [beginInspecting, setBeginInspecting] = useState(false);
  const [deliveringToCustomer, setDeliveringToCustomer] = useState(false);
  const [afterSaleTimestamp, setAfterSaleTimestamp] = useState<number>(0);
  const [showRejectConfirmDialog, setShowRejectConfirmDialog] = useState(false);
  const [statusChangeMessage, setStatusChangeMessage] = useState<{ title: string; description: string } | null>(null);

  // 处理开始备货
  const handleStartProcessing = async () => {
    if (!orderDetail || processing || tenantType.toLowerCase() !== TenantType.PROVIDER) return;

    try {
      setProcessing(true);

      const staffResponse = await fetch(`/api/providers/${params?.provider_id}/delivery-staffs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!staffResponse.ok) {
        throw new Error(`获取配送人员列表失败: ${staffResponse.status}`);
      }

      const staffData = await staffResponse.json();
      const deliveryStaffsData = staffData.data || [];

      const activeStaffs = deliveryStaffsData.filter((staff: DeliveryPerson) => staff.status === 1);

      if (activeStaffs.length === 0) {
        toast({
          title: '无可用配送人员',
          description: '请先添加并启用至少一名配送人员',
          variant: 'destructive',
          duration: 3000,
        });
        setProcessing(false);
        return;
      }

      setDeliveryStaffs(activeStaffs);
      setShowDeliveryStaffDialog(true);
      setProcessing(false);
      return;
    } catch (err) {
      toast({
        title: '操作失败',
        description: err instanceof Error ? err.message : '开始备货时出错',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  // 提交开始备货请求
  const submitStartProcessing = async () => {
    try {
      setProcessing(true);

      // 调用后端 API /api/v1/orders/{order_code}/preparing
      const response = await fetch(`/api/orders/${orderCode}/preparing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idCard: selectedDeliveryStaff?.idCard || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`开始备货失败: ${response.status}`);
      }

      const responseData = await response.json();
      const newStatus = responseData.data;

      setOrderDetail({
        ...orderDetail!,
        orderStatus: newStatus
      });
      setShowDeliveryStaffDialog(false);

      toast({
        title: '操作成功',
        description: `订单已开始备货处理${selectedDeliveryStaff ? `，配送人员：${selectedDeliveryStaff.name}` : ''}`,
        variant: 'default',
        duration: 3000,
      });
    } catch (err) {
      toast({
        title: '操作失败',
        description: err instanceof Error ? err.message : '开始备货时出错',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  // 处理配送人员选择
  const handleDeliveryStaffChange = (idCard: string) => {
    const staff = deliveryStaffs.find(s => s.idCard === idCard);
    if (staff) {
      setSelectedDeliveryStaff(staff);
    }
  };

  // 完成验收
  const completeAcceptance = async () => {
    try {
      let hasExchangeStatus = false;

      for (const item of orderItems) {
        const records = returnExchangeRecords.filter((record: any) => record.id === item.id);

        if (records.some((record: any) => record.operationType === 'EXCHANGE')) {
          hasExchangeStatus = true;
          break;
        }
      }

      const status = hasExchangeStatus ? OrderStatus.EXCHANGE_REQUESTED : tenantType.toLowerCase() === TenantType.MARKET ? OrderStatus.MARKET_ACCEPTED : OrderStatus.COMPLETED;

      let apiUrl;
      if (status === OrderStatus.MARKET_ACCEPTED || status === OrderStatus.COMPLETED) {
        apiUrl = `/api/orders/${orderCode}/accept`;
      } else {
        apiUrl = `/api/orders/${orderCode}/exchange-request`;
      }

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateBy: user?.name || '',
          status: status,
        }),
      });

      if (!response.ok) {
        throw new Error(`提交操作记录失败: ${response.status}`);
      }

      if (orderDetail) {
        const currentTime = hasExchangeStatus ? new Date().toISOString() : null;

        setOrderDetail({
          ...orderDetail,
          orderStatus: status,
          afterSaleAt: currentTime
        });

        if (hasExchangeStatus) {
          setAfterSaleTimestamp(Date.now());
        }
      }

      toast({
        title: '提交成功',
        description: `订单${orderCode}已${hasExchangeStatus ? '进入售后处理' : '完成验收'}`,
        variant: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('提交操作记录到服务器时出错:', error);
      toast({
        title: '同步失败',
        description: '操作记录未能同步到服务器',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  // 完成订单
  const completeOrder = async () => {
    try {
      const apiUrl = `/api/orders/${orderCode}/accept`;
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateBy: user?.name || '',
          status: OrderStatus.COMPLETED,
        }),
      });

      if (!response.ok) {
        throw new Error(`提交操作记录失败: ${response.status}`);
      }

      if (orderDetail) {
        setOrderDetail({
          ...orderDetail,
          orderStatus: OrderStatus.COMPLETED
        });
      }

      toast({
        title: '提交成功',
        description: `订单${orderCode}已确认完成`,
        variant: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('提交操作记录到服务器时出错:', error);
      toast({
        title: '同步失败',
        description: '操作记录未能同步到服务器',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const deliverToCustomer = async () => {
    if (!orderDetail || tenantType.toLowerCase() !== TenantType.MARKET) {
      return;
    }

    try {
      setDeliveringToCustomer(true);

      const apiUrl = `/api/orders/${orderCode}/deliver-to-customer`;
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateBy: user?.name || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`提交配送请求失败: ${response.status}`);
      }

      const responseData = await response.json();
      const newStatus = responseData?.data ?? OrderStatus.MARKET_DELIVERING;

      setOrderDetail({
        ...orderDetail,
        orderStatus: newStatus,
      });

      toast({
        title: '操作成功',
        description: `订单${orderCode}已开始配送至客户`,
        variant: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('配送至客户时出错:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '配送至客户时出错',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setDeliveringToCustomer(false);
    }
  };

  // 开始检验
  const handleBeginInspect = async () => {
    if (!orderDetail) return;

    const tenantLower = tenantType.toLowerCase();
    const allowableStatuses: OrderStatus[] = tenantLower === TenantType.MARKET
      ? [OrderStatus.SUPPLIER_DELIVERING, OrderStatus.EXCHANGE_DELIVERING, OrderStatus.EXCHANGE_NEW_DELIVERING]
      : [OrderStatus.MARKET_DELIVERING];

    if (!allowableStatuses.includes(orderDetail.orderStatus as OrderStatus)) {
      toast({
        title: '操作失败',
        description: '订单状态不正确，无法开始验收',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    try {
      setBeginInspecting(true);

      console.log('orderDetail.orderStatus', orderDetail.orderStatus);
      
      // 根据订单状态选择对应的 API
      let apiPath = `/api/orders/${orderCode}/begin-inspect-order`;
      if (orderDetail.orderStatus === OrderStatus.EXCHANGE_NEW_DELIVERING || orderDetail.orderStatus === OrderStatus.EXCHANGE_DELIVERING) {
        apiPath = `/api/orders/${orderCode}/begin-inspect-order`;
      }
      if (tenantLower === TenantType.CUSTOMER) {
        apiPath = `/api/orders/${orderCode}/inspect`;
      }

      const payload = {
        operateBy: user?.name || '',
      };

      // 调用后端 API /api/v1/orders/{order_code}/begin-inspect-order 或 begin-exchange-inspect-order
      const response = await fetch(apiPath, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`开始验收失败: ${response.status}`);
      }

      const responseData = await response.json();
      const newStatus = responseData.data;

      if (orderDetail) {
        setOrderDetail({
          ...orderDetail,
          orderStatus: newStatus
        });
      }

      toast({
        title: '操作成功',
        description: tenantLower === TenantType.CUSTOMER ? `订单${orderCode}已进入客户验收` : `订单${orderCode}已开始验收`,
        variant: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('开始验收时出错:', error);
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '开始验收时出错',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setBeginInspecting(false);
    }
  };

  // 拒绝或完成
  const handleRejectOrComplete = async () => {
    if (!orderDetail) return;
    const status = orderDetail.orderStatus === OrderStatus.RETURN_REQUESTED ? OrderStatus.RETURNED : OrderStatus.COMPLETED;

    try {
      const apiUrl = `/api/customers/${orgId}/orders/${orderCode}/operations`;
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operateBy: user?.name || '',
          status: status,
        }),
      });

      if (!response.ok) {
        throw new Error(`提交操作记录失败: ${response.status}`);
      }

      const currentTime = new Date().toISOString();

      if (orderDetail) {
        setOrderDetail({
          ...orderDetail,
          orderStatus: status,
          ...(status === OrderStatus.RETURNED ? { rejectedAt: currentTime } : {})
        });
      }

      if (status === OrderStatus.RETURNED) {
        setAfterSaleTimestamp(Date.now());
        setStatusChangeMessage({
          title: '售后处理已开始',
          description: '服务中心已开始处理您的售后申请，请耐心等待'
        });
      }

      toast({
        title: '提交成功',
        description: `订单${orderCode}已${status === OrderStatus.RETURNED ? '拒绝售后' : '完成验收'}`,
        variant: 'success',
        duration: 3000,
      });

      setShowRejectConfirmDialog(false);

    } catch (error) {
      console.error('提交操作记录到服务器时出错:', error);
      toast({
        title: '同步失败',
        description: '操作记录未能同步到服务器',
        variant: 'destructive',
        duration: 3000,
      });
      setShowRejectConfirmDialog(false);
    }
  };

  return {
    processing,
    setProcessing,
    showDeliveryStaffDialog,
    setShowDeliveryStaffDialog,
    deliveryStaffs,
    setDeliveryStaffs,
    selectedDeliveryStaff,
    setSelectedDeliveryStaff,
    beginInspecting,
    setBeginInspecting,
    deliveringToCustomer,
    afterSaleTimestamp,
    setAfterSaleTimestamp,
    showRejectConfirmDialog,
    setShowRejectConfirmDialog,
    statusChangeMessage,
    setStatusChangeMessage,
    handleStartProcessing,
    submitStartProcessing,
    handleDeliveryStaffChange,
    completeAcceptance,
    completeOrder,
    deliverToCustomer,
    handleBeginInspect,
    handleRejectOrComplete,
  };
}
