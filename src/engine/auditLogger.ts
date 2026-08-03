export interface LoggedQueryItem {
  id: string;
  sourceId: string;
  sourceName: string;
  agency: string;
  officialUrl: string;
  licenseTerms: string;
  refreshCadence: string;
  isRealTime: boolean;
  retrievedAt: string;
  queryParameters: Record<string, any>;
  responseStatus: '200_OK' | 'NO_RECORD_FOUND' | 'CACHED_BATCH';
  recordFound: boolean;
  itemCount: number;
  dataSummary: string;
}

export interface ReportGenerationAuditRecord {
  reportId: string;
  propertyAddress: string;
  parcelId?: string;
  zipCode: string;
  generatedAt: string;
  validationGateStatus: string;
  propertyClassification: string;
  templateTypeAssigned: string;
  loggedQueries: LoggedQueryItem[];
  disclaimerVersion: string;
  systemVersion: string;
}

// In-memory audit log store for compliance inspection
const AUDIT_LOG_STORE: Record<string, ReportGenerationAuditRecord> = {};

export function createAuditLogRecord(
  reportId: string,
  propertyAddress: string,
  zipCode: string,
  propertyClassification: string,
  templateTypeAssigned: string,
  loggedQueries: LoggedQueryItem[]
): ReportGenerationAuditRecord {
  const record: ReportGenerationAuditRecord = {
    reportId,
    propertyAddress,
    zipCode,
    generatedAt: new Date().toISOString(),
    validationGateStatus: 'PASSED_ALL_LAYERS',
    propertyClassification,
    templateTypeAssigned,
    loggedQueries,
    disclaimerVersion: '2026-v4.2-NON-DIAGNOSTIC-PUBLIC-RECORD',
    systemVersion: 'v1.0.4-GOV-ONLY'
  };

  AUDIT_LOG_STORE[reportId] = record;
  return record;
}

export function getAuditRecord(reportId: string): ReportGenerationAuditRecord | null {
  return AUDIT_LOG_STORE[reportId] || null;
}

export function getAllAuditRecords(): ReportGenerationAuditRecord[] {
  return Object.values(AUDIT_LOG_STORE);
}
