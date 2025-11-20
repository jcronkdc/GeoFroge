import { useParams } from 'react-router-dom';
import { ResourceEstimationDashboard } from './ResourceEstimationDashboard';

export const ResourceEstimationDashboardWrapper = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Invalid project ID</div>
      </div>
    );
  }
  
  return <ResourceEstimationDashboard projectId={projectId} />;
};

export default ResourceEstimationDashboardWrapper;

