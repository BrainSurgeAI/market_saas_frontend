import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InvoiceSettlementsPage from '../page';
import { getReconciliationStatements } from '@/lib/reconciliation-service';
import { ReconciliationStatement } from '@/app/types/reconciliationTypes';

// Mock the service function
vi.mock('@/lib/reconciliation-service', () => ({
  getReconciliationStatements: vi.fn()
}));

const mockGetReconciliationStatements = vi.mocked(getReconciliationStatements);

// Mock data
const mockStatements: ReconciliationStatement[] = [
  {
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
  },
  {
    id: 2,
    statementCode: "RS-20250523043559712-PEPY-2-1-15",
    customerId: 2,
    marketId: 1,
    providerId: 15,
    startDate: "2025-04-01",
    endDate: "2025-04-30",
    totalAmount: "200.50",
    discountAmount: "30.08",
    actualAmount: "170.42",
    status: "COMPLETED",
    remark: null,
    createdBy: "system",
    confirmedBy: "admin",
    confirmedAt: "2025-04-25T10:00:00Z",
    completedBy: "admin",
    completedAt: "2025-04-25T11:00:00Z",
    createdAt: "2025-04-23T04:35:59Z",
    updatedAt: "2025-04-25T11:00:00Z",
    deletedAt: null
  }
];

describe('InvoiceSettlementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染页面标题和面包屑', async () => {
    mockGetReconciliationStatements.mockResolvedValue(mockStatements);
    
    const params = Promise.resolve({ customer_id: '2' });
    render(<InvoiceSettlementsPage params={params} />);

    // 检查面包屑
    expect(screen.getByText('工作台')).toBeInTheDocument();
    expect(screen.getByText('客户管理')).toBeInTheDocument();
    expect(screen.getByText('对账单总览')).toBeInTheDocument();

    // 检查页面标题
    expect(screen.getByText('对账单总览')).toBeInTheDocument();
    expect(screen.getByText(/查看客户ID: 2/)).toBeInTheDocument();
  });

  it('应该显示加载骨架屏', () => {
    mockGetReconciliationStatements.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockStatements), 1000))
    );
    
    const params = Promise.resolve({ customer_id: '2' });
    render(<InvoiceSettlementsPage params={params} />);

    // 检查骨架屏是否存在 (通过样式类名检查)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('应该使用正确的客户ID调用API', async () => {
    mockGetReconciliationStatements.mockResolvedValue(mockStatements);
    
    const params = Promise.resolve({ customer_id: '123' });
    render(<InvoiceSettlementsPage params={params} />);

    await waitFor(() => {
      expect(mockGetReconciliationStatements).toHaveBeenCalledWith('123');
    });
  });

  it('应该处理空数据情况', async () => {
    mockGetReconciliationStatements.mockResolvedValue([]);
    
    const params = Promise.resolve({ customer_id: '2' });
    render(<InvoiceSettlementsPage params={params} />);

    await waitFor(() => {
      expect(screen.getByText('暂无对账单数据')).toBeInTheDocument();
      expect(screen.getByText('该客户暂时没有对账单记录，请联系相关业务人员确认。')).toBeInTheDocument();
    });
  });

  it('应该正确显示对账单数据', async () => {
    mockGetReconciliationStatements.mockResolvedValue(mockStatements);
    
    const params = Promise.resolve({ customer_id: '2' });
    render(<InvoiceSettlementsPage params={params} />);

    await waitFor(() => {
      // 检查统计数据
      expect(screen.getByText('对账单总数')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 总数

      // 检查表格数据
      expect(screen.getByText('RS-20250523043559711-PEPY-2-1-15')).toBeInTheDocument();
      expect(screen.getByText('RS-20250523043559712-PEPY-2-1-15')).toBeInTheDocument();
      
      // 检查状态徽章
      expect(screen.getByText('待确认')).toBeInTheDocument();
      expect(screen.getByText('已完成')).toBeInTheDocument();
    });
  });

  it('应该正确格式化金额显示', async () => {
    mockGetReconciliationStatements.mockResolvedValue(mockStatements);
    
    const params = Promise.resolve({ customer_id: '2' });
    render(<InvoiceSettlementsPage params={params} />);

    await waitFor(() => {
      // 检查金额格式
      expect(screen.getByText('¥100.23')).toBeInTheDocument();
      expect(screen.getByText('¥17.04')).toBeInTheDocument();
      expect(screen.getByText('¥83.19')).toBeInTheDocument();
    });
  });

  it('应该正确显示月份信息', async () => {
    mockGetReconciliationStatements.mockResolvedValue(mockStatements);
    
    const params = Promise.resolve({ customer_id: '2' });
    render(<InvoiceSettlementsPage params={params} />);

    await waitFor(() => {
      // 检查月份显示
      expect(screen.getByText('2025年05月')).toBeInTheDocument();
      expect(screen.getByText('2025年04月')).toBeInTheDocument();
    });
  });
}); 