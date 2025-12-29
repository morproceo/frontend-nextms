import { useParams } from 'react-router-dom';
import { LoadWizard } from '../../components/features/loads/LoadWizard';

/**
 * Load Form Page
 * Uses the guided LoadWizard for creating new loads
 * Falls back to wizard for editing as well
 */
export function LoadFormPage() {
  const { loadId } = useParams();

  return <LoadWizard loadId={loadId} />;
}

export default LoadFormPage;
