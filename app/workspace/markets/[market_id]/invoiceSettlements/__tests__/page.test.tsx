import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarketInvoiceSettlementsPage from '../page';
import { getEntityReconciliationStatements } from '@/lib/reconciliation-service';
import { ReconciliationStatement } from '@/app/types/reconciliationTypes';

// Mock the service function
vi.mock('@/lib/reconciliation-service', () => ({
  getEntityReconciliationStatements: vi.fn()
}));

const mockGetEntityReconciliationStatements = vi.mocked(getEntityReconciliationStatements);

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
  }
];

describe('MarketInvoiceSettlementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染市场对账单页面标题', async () => {
    mockGetEntityReconciliationStatements.mockResolvedValue(mockStatements);
    
    const params = Promise.resolve({ market_id: '1' });
    render(<MarketInvoiceSettlementsPage params={params} />);

    // 检查页面标题
    expect(screen.getByText('对账单总览')).toBeInTheDocument();
    expect(screen.getByText(/查看市场ID: 1/)).toBeInTheDocument();
  });

  it('应该使用正确的实体类型和ID调用API', async () => {
    mockGetEntityReconciliationStatements.mockResolvedValue(mockStatements);
    
    const params = Promise.resolve({ market_id: '456' });
    render(<MarketInvoiceSettlementsPage params={params} />);

    await waitFor(() => {
      expect(mockGetEntityReconciliationStatements).toHaveBeenCalledWith({
        entityType: 'market',
        entityId: '456'
      });
    });
  });

  it('应该显示市场管理面包屑', async () => {
    mockGetEntityReconciliationStatements.mockResolvedValue(mockStatements);
    
    const params = Promise.resolve({ market_id: '1' });
    render(<MarketInvoiceSettlementsPage params={params} />);

    // 检查面包屑
    expect(screen.getByText('工作台')).toBeInTheDocument();
    expect(screen.getByText('市场管理')).toBeInTheDocument();
    expect(screen.getByText('对账单总览')).toBeInTheDocument();
  });
}); 