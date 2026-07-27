import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  X,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  ShieldAlert,
  Search,
  RotateCcw,
  RefreshCw,
  Layers,
  Database,
  Sparkles
} from 'lucide-react';
import { MasterEngineWorkbook, WorkbookValidationReport } from '../types/residentEngineTypes';
import { downloadMasterEngineWorkbookFile } from '../engine/excelTemplateGenerator';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  workbook: MasterEngineWorkbook;
  validationReport: WorkbookValidationReport;
  onUploadNewWorkbook: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetToDefault: () => void;
  onRefreshWorkbook?: () => void;
}

export const WorkbookDiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  workbook,
  validationReport,
  onUploadNewWorkbook,
  onResetToDefault,
  onRefreshWorkbook
}) => {
  const [activeTab, setActiveTab] = useState<'validation' | 'inspector'>('validation');
  const [selectedInspectSheet, setSelectedInspectSheet] = useState<keyof MasterEngineWorkbook>('topics');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const filteredErrors = validationReport.errorList.filter(e => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return (
      e.sheetName.toLowerCase().includes(term) ||
      e.message.toLowerCase().includes(term) ||
      e.errorCode.toLowerCase().includes(term) ||
      e.field.toLowerCase().includes(term)
    );
  });

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 15 }}
          className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 bg-emerald-950 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-emerald-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-emerald-200 flex items-center justify-center border border-emerald-700 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold tracking-tight text-white">
                    Master Workbook Diagnostic & Validation Report
                  </h2>
                  <span className="px-2 py-0.5 bg-emerald-800 text-emerald-200 font-mono text-[10px] rounded-full border border-emerald-700">
                    v{workbook.settings?.version || '3.0.0'}
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  Clean & Streamlined Master Engine • {workbook.topics?.length || 0} Topics | {workbook.questions?.length || 0} Questions | {workbook.reportSections?.length || 0} Report Sections
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => downloadMasterEngineWorkbookFile(workbook)}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master .xlsx</span>
              </button>

              <div className="flex flex-col gap-1 items-stretch min-w-[130px]">
                <label className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New Workbook</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={onUploadNewWorkbook}
                    className="hidden"
                  />
                </label>

                {onRefreshWorkbook && (
                  <button
                    type="button"
                    onClick={onRefreshWorkbook}
                    className="px-2.5 py-1 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-500/50 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="Refresh and sync form in realtime"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-300" />
                    <span>Refresh Form (Realtime)</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Validation Status Indicator */}
          <div className={`p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            validationReport.isValid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center gap-3">
              {validationReport.isValid ? (
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold">
                  {validationReport.isValid
                    ? 'Workbook Architecture Fully Validated'
                    : 'Workbook Has Validation Issues — Action Required'}
                </h3>
                <p className="text-xs opacity-80 mt-0.5">
                  {validationReport.totalErrors === 0
                    ? 'All sheets passed structural integrity, foreign key checks, and template matching.'
                    : `Found ${validationReport.totalErrors} Error(s) and ${validationReport.totalWarnings} Warning(s) across sheets.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg text-xs">
                {validationReport.totalErrors} Errors
              </span>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-xs">
                {validationReport.totalWarnings} Warnings
              </span>
              <button
                onClick={onResetToDefault}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset workbook to built-in default"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Engine</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-slate-100 border-b border-slate-200 px-5 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('validation')}
                className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'validation'
                    ? 'bg-white text-emerald-950 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Diagnostic Error Logs ({validationReport.errorList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('inspector')}
                className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                  activeTab === 'inspector'
                    ? 'bg-white text-emerald-950 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Sheet Data Inspector</span>
              </button>
            </div>

            {activeTab === 'validation' && (
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter logs by sheet/field..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-600 w-52"
                />
              </div>
            )}
          </div>

          {/* Main Content Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-6">
            {activeTab === 'validation' ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Sheet-by-Sheet Summary Breakdown</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                    {Object.entries(validationReport.summaryBySheet).map(([sheet, stat]: [string, { rowCount: number; errors: number; warnings: number }]) => (
                      <div
                        key={sheet}
                        className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between ${
                          stat.errors > 0
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : stat.warnings > 0
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="font-bold text-[11px] truncate">{sheet}</span>
                        <div className="flex items-center justify-between mt-1 text-[10px] opacity-90">
                          <span>{stat.rowCount} Rows</span>
                          <div className="flex gap-1 font-bold">
                            {stat.errors > 0 && <span className="text-rose-600">{stat.errors}E</span>}
                            {stat.warnings > 0 && <span className="text-amber-600">{stat.warnings}W</span>}
                            {stat.errors === 0 && stat.warnings === 0 && <span className="text-emerald-600">✓</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Row-by-Row Diagnostic Findings
                  </h4>

                  {filteredErrors.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 space-y-2">
                      <Sparkles className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="font-bold text-sm text-slate-800">No issues found!</p>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Your workbook structure is fully clean. All topic references, question sets, question groups, options, scenario rules, report sections, and templates match perfectly.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="p-3">Sheet</th>
                            <th className="p-3">Row</th>
                            <th className="p-3">Field</th>
                            <th className="p-3">Severity</th>
                            <th className="p-3">Problem Description</th>
                            <th className="p-3">Suggested Fix</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                          {filteredErrors.map((err, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-emerald-950 font-mono text-[11px]">
                                {err.sheetName}
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-700">
                                Row {err.rowIndex}
                              </td>
                              <td className="p-3 font-mono text-slate-600 text-[11px]">
                                {err.field}
                              </td>
                              <td className="p-3">
                                {err.severity === 'ERROR' ? (
                                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded-md text-[10px]">
                                    CRITICAL ERROR
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md text-[10px]">
                                    WARNING
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-slate-900 font-semibold text-[11px]">
                                {err.message}
                              </td>
                              <td className="p-3 text-emerald-900 bg-emerald-50/50 text-[11px] leading-relaxed italic">
                                {err.resolutionTip}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Sheet Inspector Tab */
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-2 rounded-xl">
                  {[
                    { key: 'settings', label: 'Settings', count: 1 },
                    { key: 'profileQuestions', label: 'Profile Qs', count: workbook.profileQuestions?.length || 0 },
                    { key: 'topics', label: 'Topics', count: workbook.topics?.length || 0 },
                    { key: 'questions', label: 'Questions', count: workbook.questions?.length || 0 },
                    { key: 'reportSections', label: 'Report Sections', count: workbook.reportSections?.length || 0 },
                    { key: 'editorialTemplates', label: 'Templates', count: workbook.editorialTemplates?.length || 0 },
                    { key: 'conditionalRules', label: 'Logic Rules', count: workbook.conditionalRules?.length || 0 },
                    { key: 'versionHistory', label: 'Versions', count: workbook.versionHistory?.length || 0 }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedInspectSheet(tab.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedInspectSheet === tab.key
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[50vh]">
                  <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto">
                    {JSON.stringify(workbook[selectedInspectSheet], null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Content managers can edit this workbook in Microsoft Excel or Google Sheets and re-upload anytime.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close Diagnostic Modal
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
