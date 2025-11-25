import { ProcurementPage } from "../components/procurement/ProcurementPage";
import { getWorkspaceData } from "../layout";

export default async function Procurement() {
  const { user, organization, roles } = await getWorkspaceData();

  return (
    <ProcurementPage
      user={user}
      organization={organization}
      userRole={roles}
    />
  );
}
