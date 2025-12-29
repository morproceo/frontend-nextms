/**
 * Document Types
 */

export const DocumentType = Object.freeze({
  BOL: 'bol',
  POD: 'pod',
  RATE_CON: 'rate_con',
  INVOICE: 'invoice',
  LUMPER: 'lumper',
  SCALE_TICKET: 'scale_ticket',
  RECEIPT: 'receipt',
  OTHER: 'other'
});

export const DocumentTypeLabels = Object.freeze({
  [DocumentType.BOL]: 'Bill of Lading',
  [DocumentType.POD]: 'Proof of Delivery',
  [DocumentType.RATE_CON]: 'Rate Confirmation',
  [DocumentType.INVOICE]: 'Invoice',
  [DocumentType.LUMPER]: 'Lumper Receipt',
  [DocumentType.SCALE_TICKET]: 'Scale Ticket',
  [DocumentType.RECEIPT]: 'Receipt',
  [DocumentType.OTHER]: 'Other'
});

export const DocumentTypeShort = Object.freeze({
  [DocumentType.BOL]: 'BOL',
  [DocumentType.POD]: 'POD',
  [DocumentType.RATE_CON]: 'Rate Con',
  [DocumentType.INVOICE]: 'Invoice',
  [DocumentType.LUMPER]: 'Lumper',
  [DocumentType.SCALE_TICKET]: 'Scale',
  [DocumentType.RECEIPT]: 'Receipt',
  [DocumentType.OTHER]: 'Other'
});

export const RequiredForInvoice = Object.freeze([
  DocumentType.BOL,
  DocumentType.POD,
  DocumentType.RATE_CON
]);

export const DocumentApprovalStatus = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
});
