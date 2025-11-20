import { useParams } from 'react-router-dom';
import { GradeInterpolationViewer } from './GradeInterpolationViewer';

/**
 * Wrapper component to extract projectId from URL and pass to GradeInterpolationViewer
 */
export const GradeInterpolationViewerWrapper = () => {
  const { projectId } = useParams<{ projectId: string }>();
  
  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Invalid project ID</div>
      </div>
    );
  }
  
  return <GradeInterpolationViewer projectId={projectId} />;
};

export default GradeInterpolationViewerWrapper;

