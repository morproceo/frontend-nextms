import { useParams, useLocation } from 'react-router-dom';
import { LoadWizard } from '../../components/features/loads/LoadWizard';

/**
 * Load Form Page
 * Uses the guided LoadWizard for creating new loads
 * Falls back to wizard for editing as well
 * Accepts navigation state.prefill to pre-populate from LogIQ
 */
export function LoadFormPage() {
  const { loadId } = useParams();
  const location = useLocation();
  const prefill = location.state?.prefill || null;

  return <LoadWizard loadId={loadId} prefill={prefill} />;
}

export default LoadFormPage;
