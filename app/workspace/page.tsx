import { ProcurementPage } from "./components/procurement/ProcurementPage";
import { getWorkspaceData } from "./layout";
import PriceManagePage from "./organizations/[org_name]/product_prices/page";

export const dynamic = 'force-dynamic'

export default async function Workspace() {
  const { user, organization, roles } = await getWorkspaceData();
  
  if (roles.includes('PRICER')) {
    return <PriceManagePage organization={organization} />;
  } else if (roles.includes('ORDER_CREATOR')) {
    return <ProcurementPage user={user} organization={organization} userRole={roles} />;
  }
} 