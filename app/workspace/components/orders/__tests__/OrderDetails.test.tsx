import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderDetail from '../OrderDetails';
import { WorkspaceProvider } from '@/lib/WorkspaceContext';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    back: vi.fn(),
  }),
  useParams: () => ({
    order_code: 'TEST001',
    provider_id: 'PROVIDER001'
  }),
}));

// Mock fetch API
global.fetch = vi.fn();

// 模拟WorkspaceContext数据
const mockUser = {
  id: 'USER001',
  name: '测试用户',
  username: 'testuser',
  email: 'test@example.com',
  phone: '13800000000',
  tenant_id: 1,
  tenant_name: '测试组织',
  created_at: Date.now(),
  updated_at: Date.now(),
  deleted_at: null
};

const mockOrg = {
  id: 1,
  name: '测试组织',
  address: '测试地址',
  phone: '13800000000',
  name_hash: 'test-hash',
  license_image: 'test-image.jpg',
  tenant_type: 'customer',
  status: 'ACTIVE' as const,
  created_at: Date.now(),
  updated_at: Date.now(),
  business_scope: '测试业务范围',
  verified_at: Date.now(),
  deleted_at: 0
};

// 模拟测试数据
const mockOrderData = {
  order: {
    id: 1,
    orderCode: 'TEST001',
    customerName: '测试客户',
    orderStatus: 'STOCKED',
    totalAmount: '1000.00',
    discountAmount: '100.00',
    actualAmount: '900.00',
    deliveryDate: '2024-03-20',
    deliveryAddress: '测试地址',
    contactName: '测试联系人',
    contactPhone: '13800138000',
    remark: '测试备注',
    createdBy: 'tester',
    createdAt: '2024-03-19T10:00:00Z',
  },
  items: [
    {
      productId: 'P001',
      name: '测试商品1',
      categoryId: 1,
      category: '测试分类',
      unit: '个',
      quantity: '10.00',
      price: '100.00',
      discountRate: '0.9',
      actualPrice: '90.00',
      total: '900.00',
      actualQuantity: '10.00',
      actualAmount: '900.00',
      processingRequirements: null,
      remark: null,
    }
  ],
  receipts: []
};

describe('OrderDetail Component', () => {
  beforeEach(() => {
    // 重置所有的mock
    vi.clearAllMocks();
    
    // 模拟fetch返回成功响应
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrderData)
    });

    // 清除sessionStorage
    sessionStorage.clear();
  });

  // 基础渲染测试
  it('should render loading state initially', () => {
    render(
      <WorkspaceProvider initialData={{ user: mockUser, organization: mockOrg }}>
        <OrderDetail 
          orderCode="TEST001" 
          orgId="ORG001" 
          tenantType="customer" 
        />
      </WorkspaceProvider>
    );

    expect(screen.getByText('正在加载订单详情...')).toBeInTheDocument();
  });

  // 测试数据加载成功
  it('should render order details after successful data fetch', async () => {
    render(
      <WorkspaceProvider initialData={{ user: mockUser, organization: mockOrg }}>
        <OrderDetail 
          orderCode="TEST001" 
          orgId="ORG001" 
          tenantType="customer" 
        />
      </WorkspaceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('订单号: TEST001')).toBeInTheDocument();
      expect(screen.getByText(/订单详情/)).toBeInTheDocument();
    });
  });

  // 测试退货操作
  it('should handle return operation correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <WorkspaceProvider initialData={{ user: mockUser, organization: mockOrg }}>
        <OrderDetail 
          orderCode="TEST001" 
          orgId="ORG001" 
          tenantType="customer" 
        />
      </WorkspaceProvider>
    );

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.getByText('测试商品1')).toBeInTheDocument();
    });

    // 点击操作按钮 - 使用更精确的选择器
    const buttons = screen.getAllByRole('button');
    const operateButton = buttons.find(button => 
      button.textContent === '操作' && 
      button.getAttribute('aria-haspopup') === 'menu'
    );
    
    if (!operateButton) {
      throw new Error('操作按钮未找到');
    }
    
    await user.click(operateButton);

    // 点击退货选项
    const returnOption = screen.getByText('退货');
    await user.click(returnOption);

    // 填写退货信息
    const quantityInput = screen.getByLabelText(/退货数量/);
    const reasonInput = screen.getByLabelText(/退货原因/);

    await user.type(quantityInput, '5');
    await user.type(reasonInput, '商品质量问题，申请退货');

    // 点击确定按钮
    const confirmButton = screen.getByText('确定');
    await user.click(confirmButton);

    // 重置fetch的mock历史
    vi.clearAllMocks();
    
    // 找到确认提交按钮并点击
    const submitButton = await screen.findByRole('button', { name: '确认提交' });
    await user.click(submitButton);
    
    // 等待足够的时间让fetch调用执行
    await new Promise(r => setTimeout(r, 100));

    // 验证提交到服务器的数据
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/operations'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('RETURN')
      })
    );
  });

  // 测试签收操作
  it('should handle sign operation correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <WorkspaceProvider initialData={{ user: mockUser, organization: mockOrg }}>
        <OrderDetail 
          orderCode="TEST001" 
          orgId="ORG001" 
          tenantType="customer" 
        />
      </WorkspaceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('测试商品1')).toBeInTheDocument();
    });

    // 点击操作按钮 - 使用更精确的选择器
    const buttons = screen.getAllByRole('button');
    const operateButton = buttons.find(button => 
      button.textContent === '操作' && 
      button.getAttribute('aria-haspopup') === 'menu'
    );
    
    if (!operateButton) {
      throw new Error('操作按钮未找到');
    }
    
    await user.click(operateButton);

    // 点击签收选项
    const signOption = screen.getByText('签收');
    await user.click(signOption);

    // 重置fetch的mock历史
    vi.clearAllMocks();

    // 确认签收 - 使用更精确的选择器
    const confirmButtons = screen.getAllByText(/确认签收/);
    // 找到类型为button的确认签收按钮
    const confirmButton = confirmButtons.find(el => el.tagName.toLowerCase() === 'button');
    
    if (!confirmButton) {
      throw new Error('确认签收按钮未找到');
    }
    
    await user.click(confirmButton);
    
    // 等待足够的时间让fetch调用执行
    await new Promise(r => setTimeout(r, 100));

    // 验证签收记录已保存
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/operations'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('SIGN')
      })
    );
  });

  // 测试完成验收功能
  it('should handle complete acceptance correctly', async () => {
    const user = userEvent.setup();
    
    // 模拟所有商品都已签收的状态
    const mockDataWithSignReceipts = {
      ...mockOrderData,
      receipts: [{
        orderId: 'TEST001',
        productId: 'P001',
        productName: '测试商品1',
        operationType: 'SIGN',
        quantity: 10,
        reason: '客户签收确认',
        unit: '个'
      }]
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDataWithSignReceipts)
    });

    render(
      <WorkspaceProvider initialData={{ user: mockUser, organization: mockOrg }}>
        <OrderDetail 
          orderCode="TEST001" 
          orgId="ORG001" 
          tenantType="customer" 
        />
      </WorkspaceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('完成验收')).toBeInTheDocument();
    });

    // 点击完成验收按钮
    const completeButton = screen.getByText('完成验收');
    await user.click(completeButton);

    // 验证完成验收请求
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/operations'),
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('COMPLETED')
      })
    );
  });

  // 测试错误处理
  it('should handle fetch error correctly', async () => {
    // 模拟请求失败
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed to fetch'));

    render(
      <WorkspaceProvider initialData={{ user: mockUser, organization: mockOrg }}>
        <OrderDetail 
          orderCode="TEST001" 
          orgId="ORG001" 
          tenantType="customer" 
        />
      </WorkspaceProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });
});