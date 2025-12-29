/**
 * DriverDocumentsPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useDriverPortalDocuments hook
 * - Component focuses on rendering
 */

import { Link } from 'react-router-dom';
import { useDriverPortalDocuments } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import {
  FileText,
  Package,
  ArrowRight
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function DriverDocumentsPage() {
  // All data and logic from the hook
  const { loadsWithDocs, loading } = useDriverPortalDocuments();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-headline text-text-primary">Documents</h1>
        <p className="text-body text-text-secondary mt-1">
          View and manage documents for your loads
        </p>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-accent/5 border-accent/20">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <p className="text-body font-medium text-text-primary">Document Upload</p>
            <p className="text-body-sm text-text-secondary">
              To upload documents, go to the specific load details page and use the upload feature there.
            </p>
          </div>
        </div>
      </Card>

      {/* Documents by Load */}
      {loadsWithDocs.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-title text-text-primary mb-2">No Documents Yet</h3>
          <p className="text-body text-text-secondary">
            Documents will appear here once you upload them for your loads.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {loadsWithDocs.map((load) => (
            <Card key={load.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-text-tertiary" />
                  <div>
                    <Link
                      to={`/driver/loads/${load.id}`}
                      className="text-body font-medium text-text-primary hover:text-accent"
                    >
                      {load.reference_number}
                    </Link>
                    <p className="text-small text-text-tertiary">
                      {load.shipper?.city}, {load.shipper?.state} → {load.consignee?.city}, {load.consignee?.state}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/driver/loads/${load.id}`}
                  className="text-accent hover:underline text-body-sm flex items-center gap-1"
                >
                  View Load
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {load.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-surface-secondary rounded-card"
                  >
                    <FileText className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-text-primary truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-small text-text-tertiary">
                        {doc.type?.replace('_', ' ')} • {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverDocumentsPage;
