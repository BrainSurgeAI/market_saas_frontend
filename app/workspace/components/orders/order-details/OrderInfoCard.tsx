import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, Calendar, MapPin, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { translateOrderStatus, getStatusVariant } from "@/lib/utils";
import { Order, OrderStatus } from "@/lib/types/orderStatus";

interface OrderInfoCardProps {
  orderDetail: Order;
  afterSaleTimestamp: number;
  statusChangeMessage: { title: string; description: string } | null;
  onDismissStatusMessage: () => void;
}

export function OrderInfoCard({
  orderDetail,
  statusChangeMessage,
  onDismissStatusMessage,
}: OrderInfoCardProps) {
  const [showOrderInfo, setShowOrderInfo] = useState(false);

  return (
    <>
      {statusChangeMessage && (
        <Alert variant="default" className="mb-4 border-blue-500 bg-blue-50 relative">
          <div>
            <AlertTitle>{statusChangeMessage.title}</AlertTitle>
            <AlertDescription>{statusChangeMessage.description}</AlertDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="关闭提示"
            className="absolute right-2 top-2 h-6 w-6 text-blue-500 hover:text-blue-700"
            onClick={onDismissStatusMessage}
          >
            ×
          </Button>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center p-4 md:p-6">
          <CardTitle className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base md:text-lg font-semibold">订单信息</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 md:h-5 md:w-5" onClick={() => setShowOrderInfo(!showOrderInfo)}>
                  {showOrderInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <Badge variant={getStatusVariant(orderDetail.orderStatus)} className="text-xs rounded-full">
                {translateOrderStatus(orderDetail.orderStatus)}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        {showOrderInfo && (
          <>
            {/* 移动端卡片布局 */}
            <CardContent className="block md:hidden space-y-3">
              {/* 基本信息卡片 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="space-y-3">
                  <InfoCardItem
                    label="下单时间"
                    value={formatOrderDate(orderDetail.createdAt)}
                    icon={<Calendar className="h-4 w-4 text-blue-600" />}
                  />
                  <InfoCardItem
                    label="下单客户"
                    value={orderDetail.customerName || "-"}
                    icon={<User className="h-4 w-4 text-blue-600" />}
                  />
                  <InfoCardItem
                    label="配送日期"
                    value={formatOrderDate(orderDetail.deliveryDate, "yyyy年MM月dd日")}
                    icon={<Calendar className="h-4 w-4 text-blue-600" />}
                  />
                </div>
              </div>

              {/* 收货信息卡片 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                <div className="space-y-3">
                  <InfoCardItem
                    label="收货人"
                    value={
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{orderDetail.contactName}</p>
                        <p className="text-sm font-mono text-gray-600 mt-1">{orderDetail.contactPhone}</p>
                      </div>
                    }
                    icon={<User className="h-4 w-4 text-green-600" />}
                  />
                  <InfoCardItem
                    label="配送地址"
                    value={<p className="text-sm font-medium text-gray-900">{orderDetail.deliveryAddress}</p>}
                    icon={<MapPin className="h-4 w-4 text-green-600" />}
                  />
                </div>
              </div>

              {/* 订单金额卡片 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                <p className="text-sm font-semibold text-gray-700 mb-3">订单金额</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-white rounded-md p-2">
                    <span className="text-xs text-gray-600">原价</span>
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      ¥{parseFloat(orderDetail.orderedAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white rounded-md p-2">
                    <span className="text-xs text-gray-600">折扣</span>
                    <span className="text-sm font-mono font-semibold text-red-600">
                      -¥{parseFloat(orderDetail.discountAmount || "0").toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-md p-3 mt-2">
                    <span className="text-sm font-semibold text-white">实付金额</span>
                    <span className="text-lg font-mono font-bold text-white">
                      ¥{(parseFloat(orderDetail.orderedAmount) - parseFloat(orderDetail.discountAmount || "0")).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 配送信息卡片 */}
              {(orderDetail.providerName || orderDetail.deliveryStaffName) && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
                  <div className="space-y-3">
                    {orderDetail.providerName && (
                      <InfoCardItem
                        label="配送公司"
                        value={orderDetail.providerName}
                        icon={<User className="h-4 w-4 text-orange-600" />}
                      />
                    )}
                    {orderDetail.deliveryStaffName && (
                      <InfoCardItem
                        label="配送人"
                        value={
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{orderDetail.deliveryStaffName}</p>
                            {orderDetail.deliveryStaffPhone && (
                              <p className="text-sm font-mono text-gray-600 mt-1">{orderDetail.deliveryStaffPhone}</p>
                            )}
                          </div>
                        }
                        icon={<User className="h-4 w-4 text-orange-600" />}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 订单备注卡片 */}
              {orderDetail.remark && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">订单备注</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{orderDetail.remark}</p>
                </div>
              )}
            </CardContent>

            {/* 桌面端原有布局 */}
            <CardContent className="hidden md:block space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <InfoItem label="下单时间" value={formatOrderDate(orderDetail.createdAt)} />
                <InfoItem label="下单客户" value={orderDetail.customerName || "-"} />
                <InfoItem
                  label="配送日期"
                  icon={<Calendar className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />}
                  value={formatOrderDate(orderDetail.deliveryDate, "yyyy年MM月dd日")}
                />
                <InfoItem
                  label="收货人"
                  icon={<User className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />}
                  value={
                    <>
                      <p className="text-xs font-medium">{orderDetail.contactName}</p>
                      <p className="text-sm font-mono mt-1">{orderDetail.contactPhone}</p>
                    </>
                  }
                />
              </div>

              <InfoItem
                label="配送地址"
                icon={<MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />}
                value={<p className="text-xs font-medium">{orderDetail.deliveryAddress}</p>}
              />

              <Separator />

              <div className="space-y-2">
                <p className="text-sm text-gray-500">订单金额</p>
                <div className="grid grid-cols-3 gap-4">
                  <AmountItem label="原价（以下单日产品中间价计算）" value={orderDetail.orderedAmount} />
                  <AmountItem label="折扣" value={orderDetail.discountAmount || "0"} negative />
                  <AmountItem
                    label="实付金额"
                    value={orderDetail.netAmount}
                    highlight
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  label="配送公司"
                  icon={<User className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />}
                  value={orderDetail.providerName || "-"}
                />
                <InfoItem
                  label="配送人"
                  icon={<User className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />}
                  value={
                    <>
                      <p className="text-xs font-medium">{orderDetail.deliveryStaffName || "-"}</p>
                      <p className="text-sm font-mono mt-1">{orderDetail.deliveryStaffPhone || "-"}</p>
                    </>
                  }
                />
              </div>

              {orderDetail.remark && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">订单备注</p>
                    <p className="text-sm mt-1 p-2 bg-gray-50 rounded-md">{orderDetail.remark}</p>
                  </div>
                </>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </>
  );
}

function formatOrderDate(date?: string, formatStr: string = "yyyy年MM月dd日 HH:mm") {
  if (!date) return "-";
  return format(new Date(date), formatStr);
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon}
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <div className="text-xs font-medium">{value}</div>
      </div>
    </div>
  );
}

function InfoCardItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      {icon && <div className="mt-0.5">{icon}</div>}
      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}

function AmountItem({
  label,
  value,
  negative,
  highlight,
}: {
  label: string;
  value: string;
  negative?: boolean;
  highlight?: boolean;
}) {
  const classes = highlight ? "text-primary" : negative ? "text-red-500" : undefined;
  const prefix = negative ? "-¥" : "¥";
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-sm font-mono ${classes}`}>{prefix + parseFloat(value).toFixed(2)}</p>
    </div>
  );
}

function ReturnCountdown({
  afterSaleAt,
  orderStatus,
  forceUpdate,
}: {
  afterSaleAt: string | null;
  orderStatus: string;
  forceUpdate?: number;
}) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00");
  const { toast } = useToast();
  const [isTimerEnded, setIsTimerEnded] = useState(false);

  const startTimeStr = useMemo(() => {
    if (orderStatus === OrderStatus.RETURN_REQUESTED && afterSaleAt) {
      return afterSaleAt;
    }
    return null;
  }, [orderStatus, afterSaleAt]);

  useEffect(() => {
    setIsTimerEnded(false);
  }, [forceUpdate, startTimeStr]);

  useEffect(() => {
    if (!startTimeStr) return;

    const startTimeMs = new Date(startTimeStr).getTime();
    const timeLimit = 120 * 60 * 1000;
    const endTime = startTimeMs + timeLimit;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft("00:00:00");

        if (!isTimerEnded) {
          setIsTimerEnded(true);
          toast({
            title: "售后时间已结束",
            description: "正在刷新页面获取最新状态...",
            variant: "default",
            duration: 3000,
          });

          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [startTimeStr, isTimerEnded, toast]);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20">
      <div className="bg-black text-white px-6 py-3 rounded-lg shadow-lg text-center">
        <p className="text-xs mb-1">离售后结束还有</p>
        <p className="text-2xl font-mono">{timeLeft}</p>
      </div>
    </div>
  );
}

