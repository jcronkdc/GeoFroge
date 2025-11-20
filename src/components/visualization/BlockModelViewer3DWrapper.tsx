import { useParams } from 'react-router-dom';
import { BlockModelViewer3D } from './BlockModelViewer3D';

export const BlockModelViewer3DWrapper = () => {
  const { blockModelId } = useParams<{ blockModelId: string }>();
  
  if (!blockModelId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-xl">Invalid block model ID</div>
      </div>
    );
  }
  
  return <BlockModelViewer3D blockModelId={blockModelId} />;
};

export default BlockModelViewer3DWrapper;

