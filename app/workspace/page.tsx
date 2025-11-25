import { ProcurementPage } from "./components/procurement/ProcurementPage";
import { getWorkspaceData } from "./layout";
import PriceManagePage from "./organizations/[org_name]/product_prices/page";
import ProviderPage from "./components/providers/ProviderPage";
import MarketDashboard from "./components/market/MarketDashboard";
import CustomerDashboard from "./components/customer/CustomerDashboard";

export const dynamic = 'force-dynamic'

export default async function Workspace() {
  const { user, organization, roles } = await getWorkspaceData();

  // 根据 tenantType 显示对应的 Dashboard
  if (organization?.tenantType === 'MARKET') {
    return <MarketDashboard />;
  }

  if (organization?.tenantType === 'CUSTOMER') {
    return <CustomerDashboard />;
  }

  // 如果没有明确的 tenantType，基于角色显示
  if (roles.includes('PRICER')) {
    return <PriceManagePage user={user} organization={organization} userRole={roles} />;
  } else if (roles.includes('ORDER_CREATOR')) {
    return <ProcurementPage user={user} organization={organization} userRole={roles} />;
  } else if (roles.includes('STAFF')) {
    return <ProviderPage user={user} organization={organization} userRole={roles} />;
  }

  // 默认显示 CustomerDashboard（为了兼容性）
  return <CustomerDashboard />;
} 