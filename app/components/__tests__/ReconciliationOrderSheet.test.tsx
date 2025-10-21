import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ReconciliationOrderSheet from '../ReconciliationOrderSheet';
import { getReconciliationOrders } from '@/lib/reconciliation-service';
import { ReconciliationStatement, ReconciliationOrder } from '@/app/types/reconciliationTypes';

// Mock the service function
vi.mock('@/lib/reconciliation-service', () => ({
  getReconciliationOrders: vi.fn()
}));

const mockGetReconciliationOrders = vi.mocked(getReconciliationOrders);

// Mock data
const mockStatement: ReconciliationStatement = {
  id: 1,
  statementCode: "RS-20250523043559711-PEPY-2-1-15",
  customerId: 2,
  marketId: 1,
  providerId: 15,
  startDate: "2025-05-01",
  endDate: "2025-05-31",
  totalAmount: "100.23",
  discountAmount: "17.04",
  actualAmount: "83.19",
  status: "PENDING",
  remark: null,
  createdBy: "system",
  confirmedBy: null,
  confirmedAt: null,
  completedBy: null,
  completedAt: null,
  createdAt: "2025-05-23T04:35:59Z",
  updatedAt: "2025-05-23T04:35:59Z",
  deletedAt: null
};

const mockOrders: ReconciliationOrder[] = [
  {
    id: 1,
    statementId: 1,
    orderId: 1,
    orderCode: "ODR-20250522113839492-UYRA",
    orderDate: "2025-05-22",
    totalAmount: "20.93",
    actualAmount: "17.37",
    createdAt: "2025-05-23T04:35:59Z"
  },
  {
    id: 2,
    statementId: 1,
    orderId: 2,
    orderCode: "ODR-20250522113925760-EFVT",
    orderDate: "2025-05-22",
    totalAmount: "44.25",
    actualAmount: "36.72",
    createdAt: "2025-05-23T04:35:59Z"
  }
];

describe('ReconciliationOrderSheet', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该在打开时显示对账单信息', async () => {
    mockGetReconciliationOrders.mockResolvedValue(mockOrders);
    
    render(
      <ReconciliationOrderSheet
        statement={mockStatement}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    // 检查对账单信息显示
    expect(screen.getByText('2025年05月 对账单详情')).toBeInTheDocument();
    expect(screen.getByText('RS-20250523043559711-PEPY-2-1-15')).toBeInTheDocument();
    expect(screen.getByText('¥100.23')).toBeInTheDocument();
    expect(screen.getByText('¥17.04')).toBeInTheDocument();
    expect(screen.getByText('¥83.19')).toBeInTheDocument();
  });

  it('应该在打开时加载订单数据', async () => {
    mockGetReconciliationOrders.mockResolvedValue(mockOrders);
    
    render(
      <ReconciliationOrderSheet
        statement={mockStatement}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    // 验证API调用
    await waitFor(() => {
      expect(mockGetReconciliationOrders).toHaveBeenCalledWith(1);
    });
  });

  it('应该显示订单列表', async () => {
    mockGetReconciliationOrders.mockResolvedValue(mockOrders);
    
    render(
      <ReconciliationOrderSheet
        statement={mockStatement}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    // 等待订单数据加载
    await waitFor(() => {
      expect(screen.getByText('ODR-20250522113839492-UYRA')).toBeInTheDocument();
      expect(screen.getByText('ODR-20250522113925760-EFVT')).toBeInTheDocument();
    });
  });

  it('应该在关闭时不显示内容', () => {
    render(
      <ReconciliationOrderSheet
        statement={mockStatement}
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    );

    // 面板关闭时不应该显示内容
    expect(screen.queryByText('2025年05月 对账单详情')).not.toBeInTheDocument();
  });

  it('应该在statement为null时不显示内容', () => {
    render(
      <ReconciliationOrderSheet
        statement={null}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.queryByText('对账单详情')).not.toBeInTheDocument();
  });

  it('应该显示加载状态', () => {
    mockGetReconciliationOrders.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockOrders), 1000))
    );
    
    render(
      <ReconciliationOrderSheet
        statement={mockStatement}
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    // 检查加载状态
    const loadingElements = document.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });
}); 