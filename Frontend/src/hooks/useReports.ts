import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { reportService } from '@/services/reportService';
import {
  AnyReportResponse,
  ReportMetadataDto,
  ReportRequestDto,
  ReportResponseDto,
  ReportTemplateDto,
  ReportType,
  ScheduledReportDto,
} from '@/types/reportTypes';

interface UseReportsOptions {
  /** Should templates load automatically on mount (default true) */
  autoFetchTemplates?: boolean;
  /** Should scheduled jobs load automatically on mount (default true) */
  autoFetchScheduled?: boolean;
}

interface UseReportsResult {
  templates: ReportTemplateDto[];
  metadata: Partial<Record<ReportType, ReportMetadataDto>>;
  scheduledReports: ScheduledReportDto[];
  lastReport: AnyReportResponse | null;
  loading: boolean;
  exporting: boolean;
  scheduling: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  fetchMetadata: (reportType: ReportType) => Promise<ReportMetadataDto | undefined>;
  refreshScheduledReports: () => Promise<void>;
  generateReport: (payload: ReportRequestDto) => Promise<AnyReportResponse>;
  exportReport: (payload: ReportRequestDto) => Promise<Blob>;
  scheduleReport: (payload: ScheduledReportDto) => Promise<void>;
}

type SpecificPayload = Omit<ReportRequestDto, 'reportType'>;

type GeneratorMap = {
  [ReportType.ProjectSummary]: (payload: SpecificPayload) => Promise<ReportResponseDto<any>>;
  [ReportType.TaskProgress]: (payload: SpecificPayload) => Promise<ReportResponseDto<any>>;
  [ReportType.TeamPerformance]: (payload: SpecificPayload) => Promise<ReportResponseDto<any>>;
  [ReportType.IssueSummary]: (payload: SpecificPayload) => Promise<ReportResponseDto<any>>;
};

const generatorMap: GeneratorMap = {
  [ReportType.ProjectSummary]: reportService.generateProjectSummary,
  [ReportType.TaskProgress]: reportService.generateTaskProgress,
  [ReportType.TeamPerformance]: reportService.generateTeamPerformance,
  [ReportType.IssueSummary]: reportService.generateIssueSummary,
};

export function useReports(options: UseReportsOptions = {}): UseReportsResult {
  const { autoFetchTemplates = true, autoFetchScheduled = true } = options;

  const [templates, setTemplates] = useState<ReportTemplateDto[]>([]);
  const [metadata, setMetadata] = useState<Partial<Record<ReportType, ReportMetadataDto>>>({});
  const [scheduledReports, setScheduledReports] = useState<ScheduledReportDto[]>([]);
  const [lastReport, setLastReport] = useState<AnyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleError = useCallback((err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : fallback;
    if (isMounted.current) {
      setError(message);
    }
    console.error(fallback, err);
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const nextTemplates = await reportService.getTemplates();
      if (isMounted.current) {
        setTemplates(nextTemplates);
      }
    } catch (err) {
      handleError(err, 'Failed to load report templates');
    }
  }, [handleError]);

  const fetchMetadata = useCallback(async (reportType: ReportType) => {
    if (metadata[reportType]) {
      return metadata[reportType];
    }

    try {
      const result = await reportService.getMetadata(reportType);
      if (!isMounted.current) return undefined;

      setMetadata(prev => ({ ...prev, [reportType]: result }));
      return result;
    } catch (err) {
      handleError(err, `Failed to load metadata for ${reportType}`);
      return undefined;
    }
  }, [metadata, handleError]);

  const refreshScheduledReports = useCallback(async () => {
    try {
      const jobs = await reportService.getScheduledReports();
      if (isMounted.current) {
        setScheduledReports(jobs);
      }
    } catch (err) {
      handleError(err, 'Failed to load scheduled reports');
    }
  }, [handleError]);

  const generateReport = useCallback(async (payload: ReportRequestDto) => {
    console.log('🟢 generateReport hook called with:', payload);
    console.log('🟢 Setting loading to true');
    setLoading(true);
    setError(null);
    try {
      const { reportType, ...rest } = payload;
      console.log('🟢 Report type:', reportType);
      console.log('🟢 Payload rest:', rest);
      
      const generator = generatorMap[reportType];
      console.log('🟢 Generator function:', generator ? 'Found' : 'NOT FOUND');
      
      if (!generator) {
        throw new Error(`No generator found for report type: ${reportType}`);
      }
      
      console.log('🟢 Calling generator...');
      const result = await generator(rest);
      console.log('🟢 Generator returned:', result);
      
      if (isMounted.current) {
        console.log('🟢 Setting last report');
        setLastReport(result as AnyReportResponse);
      }
      return result as AnyReportResponse;
    } catch (err) {
      console.error('🔴 Error in generateReport hook:', err);
      handleError(err, 'Failed to generate report');
      throw err;
    } finally {
      if (isMounted.current) {
        console.log('🟢 Setting loading to false');
        setLoading(false);
      }
    }
  }, [handleError]);

  const exportReport = useCallback(async (payload: ReportRequestDto) => {
    setExporting(true);
    setError(null);
    try {
      return await reportService.exportReport(payload);
    } catch (err) {
      handleError(err, 'Failed to export report');
      throw err;
    } finally {
      if (isMounted.current) {
        setExporting(false);
      }
    }
  }, [handleError]);

  const scheduleReport = useCallback(async (payload: ScheduledReportDto) => {
    setScheduling(true);
    setError(null);
    try {
      await reportService.scheduleReport(payload);
      await refreshScheduledReports();
    } catch (err) {
      handleError(err, 'Failed to schedule report');
      throw err;
    } finally {
      if (isMounted.current) {
        setScheduling(false);
      }
    }
  }, [handleError, refreshScheduledReports]);

  useEffect(() => {
    if (autoFetchTemplates) {
      fetchTemplates();
    }
    if (autoFetchScheduled) {
      refreshScheduledReports();
    }
  }, [autoFetchTemplates, autoFetchScheduled, fetchTemplates, refreshScheduledReports]);

  const sortedTemplates = useMemo(() => {
    return [...templates].sort((a, b) => a.name.localeCompare(b.name));
  }, [templates]);

  return {
    templates: sortedTemplates,
    metadata,
    scheduledReports,
    lastReport,
    loading,
    exporting,
    scheduling,
    error,
    fetchTemplates,
    fetchMetadata,
    refreshScheduledReports,
    generateReport,
    exportReport,
    scheduleReport,
  };
}
