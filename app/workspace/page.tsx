import { ProcurementPage } from "./components/procurement/ProcurementPage";
import { getWorkspaceData } from "./layout";
import PriceManagePage from "./organizations/[org_name]/product_prices/page";
import ProviderPage from "./components/providers/ProviderPage";

export const dynamic = 'force-dynamic'

export default async function Workspace() {
  const { user, organization, roles } = await getWorkspaceData();

  if (roles.includes('PRICER')) {
    return <PriceManagePage user={user} organization={organization} userRole={roles} />;
  } else if (roles.includes('ORDER_CREATOR')) {
    return <ProcurementPage user={user} organization={organization} userRole={roles} />;
  } else if (roles.includes('STAFF')) {
    return <ProviderPage user={user} organization={organization} userRole={roles} />;
  }
} 