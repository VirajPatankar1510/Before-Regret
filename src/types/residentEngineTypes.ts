// ==========================================================
// RESIDENT INTELLIGENCE MASTER ENGINE TYPES
// 100% Data-Driven Architecture (Excel Workbook = Engine Brain)
// ==========================================================

// 1. Settings Sheet
export interface EngineSettings {
  maxTopicsPerResident: number;
  minQuestionsPerTopic: number;
  maxQuestionsPerTopic: number;
  maxTemplateVariations: number;
  defaultSkipText: string;
  defaultLanguage: string;
  version: string;
  enableConditionalLogic: boolean;
  enableFollowUpQuestions: boolean;
  allowCustomNote: boolean;
  truthfulnessDeclarationRequired: boolean;
}

// 2. Profile Questions Sheet (Question 1 & Question 2 in Excel)
export interface ExcelProfileQuestion {
  questionId: string; // e.g. PQ_YEARS_LIVING, PQ_RESIDENT_TYPE
  questionText: string; // e.g. "How many years have you been living in this society?"
  helpText?: string;
  questionType: 'number' | 'single-choice';
  optionsPipeSeparated?: string; // e.g. "Owner | Tenant"
  required: boolean;
  displayOrder: number;
  status: 'Active' | 'Inactive';
}

// 3. Topics Sheet
export interface ExcelTopic {
  topicId: string;
  topicName: string;
  description: string;
  icon: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
  category: string;
  buyerPriority: number;
  contributorPriority: number;
  minYearsRequired?: number;
}

// 4. Question Sets Sheet (Logical Container for Question Groups)
export interface ExcelQuestionSet {
  questionSetId: string; // e.g. QS_WATER_BASIC
  topicId: string; // References Topics.topicId
  questionSetName: string; // e.g. "Basic Water Questions"
  description?: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
}

// 5. Question Groups Sheet (Organizes Questions into Logical Sections)
export interface ExcelQuestionGroup {
  questionGroupId: string; // e.g. QG_WATER_AVAILABILITY, QG_WATER_PRESSURE
  questionSetId: string; // References Question_Sets.questionSetId
  questionGroupName: string; // e.g. "Water Availability"
  description?: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
}

// 6. Questions Sheet (Clean & Direct with optionsPipeSeparated)
export interface ExcelQuestion {
  questionId: string;
  topicId: string; // References Topics.topicId
  questionSetId?: string; // Optional legacy reference
  questionGroupId?: string; // Optional legacy reference
  questionText: string;
  questionDescription?: string;
  questionType: 'single-choice' | 'multiple-choice' | 'text' | 'rating' | 'frequency' | 'dropdown';
  optionsPipeSeparated?: string; // e.g. "24x7 Municipal Water | Fixed Slot Supply | Tanker Dependent | Severe Scarcity"
  importance: 'Critical' | 'High' | 'Medium' | 'Low';
  displayOrder: number;
  required: boolean;
  allowSkip: boolean;
  skipText?: string;
  helpText?: string;
  placeholder?: string;
  conditionalRuleId?: string;
  status: 'Active' | 'Inactive';
}

// 7. Options Sheet (Stable Internal Keys & Explicit Display Settings)
export interface ExcelOption {
  optionId: string; // e.g. OPT_WATER_1_YES
  questionId: string; // References Questions.questionId
  optionKey: string; // e.g. OPT_KEY_YES, OPT_KEY_SEVERE
  displayText: string; // User facing label
  storedValue: string; // Internal database value
  displayOrder: number;
  triggersFollowUp?: boolean;
  followUpRuleId?: string;
  weight?: number;
  status: 'Active' | 'Inactive';
}

// 8. Conditional Logic Sheet
export interface ExcelConditionalRule {
  ruleId: string;
  sourceQuestionId: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'IS_SKIPPED' | 'IS_ANSWERED';
  targetAnswerValue: string;
  action: 'SHOW_QUESTION' | 'HIDE_QUESTION' | 'SHOW_FOLLOW_UP' | 'REPLACE_QUESTION';
  targetQuestionId: string;
  description?: string;
}

// 9. Scenario Rules Sheet (Structured Condition Rows - No Text Expressions)
export interface ExcelScenarioRule {
  ruleId: string; // e.g. SR_WATER_PERFECT_1
  scenarioId: string; // References Report_Scenarios.scenarioId
  questionId: string; // References Questions.questionId
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'IN' | 'GREATER_THAN' | 'LESS_THAN' | 'IS_SKIPPED' | 'IS_ANSWERED' | 'HAS_CRITICAL_ANSWER';
  expectedValue: string; // e.g. "No Issues", "Severe", "2"
  priority: number;
  status: 'Active' | 'Inactive';
}

// 10. Report Scenarios Sheet
export interface ExcelReportScenario {
  scenarioId: string; // e.g. SCN_WATER_PERFECT, SCN_WATER_CRITICAL
  topicId: string; // References Topics.topicId
  scenarioName: string; // e.g. "Pristine Water Operations"
  priority: number;
  status: 'Active' | 'Inactive';
  scenarioDescription?: string;
}

// 11. Report Sections Sheet (Reusable Narrative Sections)
export interface ExcelReportSection {
  sectionId: string; // e.g. SEC_OPENING, SEC_DAILY_EXP, SEC_LIKES, SEC_BUYER_KNOW, SEC_FRUSTRATIONS, SEC_BUY_AGAIN, SEC_CLOSING
  sectionName: string; // e.g. "Opening Overview", "Daily Living Experience"
  description?: string;
  displayOrder: number;
  status: 'Active' | 'Inactive';
}

// 12. Editorial Templates Sheet (Linked to Report Section & Scenario)
export interface ExcelEditorialTemplate {
  templateId: string; // e.g. TMPL_OPENING_WATER_01
  sectionId: string; // References Report_Sections.sectionId
  scenarioId: string; // References Report_Scenarios.scenarioId
  variationNumber: number;
  language: string;
  tone: 'Neutral' | 'Direct' | 'Detailed' | 'Conversational';
  templateText: string; // Supports tokens {Years_Living_Here}, {Resident_Type}, {Society_Name}, {Answer_Q_ID}
  status: 'Active' | 'Inactive';
}

// 13. Labels Sheet
export interface ExcelLabel {
  labelKey: string;
  defaultText: string;
  section: string;
  status: 'Active' | 'Inactive';
}

// 14. Translations Sheet
export interface ExcelTranslation {
  languageCode: string;
  key: string;
  translationText: string;
}

// 15. Version History Sheet
export interface ExcelVersionHistory {
  workbookVersion: string;
  date: string;
  author: string;
  description: string;
  notes: string;
}

// Complete Master Engine Workbook Data Structure (Clean 8-Sheet Architecture)
export interface MasterEngineWorkbook {
  settings: EngineSettings;
  profileQuestions: ExcelProfileQuestion[];
  topics: ExcelTopic[];
  questions: ExcelQuestion[];
  reportSections: ExcelReportSection[];
  editorialTemplates: ExcelEditorialTemplate[];
  conditionalRules: ExcelConditionalRule[];
  versionHistory: ExcelVersionHistory[];
  
  // Optional legacy / extended sheets
  questionSets?: ExcelQuestionSet[];
  questionGroups?: ExcelQuestionGroup[];
  options?: ExcelOption[];
  scenarioRules?: ExcelScenarioRule[];
  reportScenarios?: ExcelReportScenario[];
  labels?: ExcelLabel[];
  translations?: ExcelTranslation[];
}

// Validation Diagnostic Error Item
export interface ValidationErrorItem {
  sheetName: string;
  rowIndex: number; // 1-indexed Excel row
  field: string;
  severity: 'ERROR' | 'WARNING';
  errorCode: string;
  message: string;
  resolutionTip: string;
}

// Workbook Validation Report Summary
export interface WorkbookValidationReport {
  isValid: boolean;
  totalErrors: number;
  totalWarnings: number;
  errorList: ValidationErrorItem[];
  summaryBySheet: Record<string, { errors: number; warnings: number; rowCount: number }>;
}
