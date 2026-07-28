import * as XLSX from 'xlsx';
import {
  MasterEngineWorkbook,
  EngineSettings,
  ExcelProfileQuestion,
  ExcelTopic,
  ExcelQuestionSet,
  ExcelQuestionGroup,
  ExcelQuestion,
  ExcelOption,
  ExcelConditionalRule,
  ExcelScenarioRule,
  ExcelReportScenario,
  ExcelReportSection,
  ExcelEditorialTemplate,
  ExcelLabel,
  ExcelTranslation,
  ExcelVersionHistory
} from '../types/residentEngineTypes';
import { CONTRIBUTOR_TOPICS, STRUCTURED_QUESTIONS_DATABASE, getMainQuestionForTopic } from '../data/contributorTopicsData';
import { getTopicEditorialTemplates } from './topicEditorialTemplates';

const WORKBOOK_STORAGE_KEY = 'resident_intelligence_master_engine_workbook_v3';

// Seed default settings
export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  maxTopicsPerResident: 5,
  minQuestionsPerTopic: 1,
  maxQuestionsPerTopic: 5,
  maxTemplateVariations: 10,
  defaultSkipText: 'N/A',
  defaultLanguage: 'en-IN',
  version: '3.4.0-UPDATED-EXCEL-MASTER-SCHEMA',
  enableConditionalLogic: true,
  enableFollowUpQuestions: true,
  allowCustomNote: true,
  truthfulnessDeclarationRequired: true
};

// Seed default Profile Questions (Excel Question 1 & Question 2)
export const DEFAULT_PROFILE_QUESTIONS: ExcelProfileQuestion[] = [
  {
    questionId: 'PQ_YEARS_LIVING',
    questionText: 'How many years have you been living in this society?',
    helpText: 'Provides context on resident experience duration',
    questionType: 'number',
    required: true,
    displayOrder: 1,
    status: 'Active'
  },
  {
    questionId: 'PQ_RESIDENT_TYPE',
    questionText: 'Are you an Owner or a Tenant?',
    helpText: 'Clarifies perspective (homeowner vs tenant tenant)',
    questionType: 'single-choice',
    optionsPipeSeparated: 'Owner | Tenant',
    required: true,
    displayOrder: 2,
    status: 'Active'
  }
];

// Seed default Report Sections (Strict 6 Sections required by AGENTS.md)
export const DEFAULT_REPORT_SECTIONS: ExcelReportSection[] = [
  { sectionId: 'SEC_OVERALL_SUMMARY', sectionName: 'Overall Summary', description: 'Concise topic introduction based on resident input', displayOrder: 1, status: 'Active' },
  { sectionId: 'SEC_EVERYDAY_LIFE', sectionName: 'What This Means in Everyday Life', description: 'Practical day-to-day living impacts', displayOrder: 2, status: 'Active' },
  { sectionId: 'SEC_KEEP_IN_MIND', sectionName: 'Things Worth Keeping in Mind', description: 'Cautious considerations or potential limitations', displayOrder: 3, status: 'Active' },
  { sectionId: 'SEC_POSITIVE_ASPECTS', sectionName: 'Positive Aspects', description: 'Honest, non-exaggerated highlights', displayOrder: 4, status: 'Active' },
  { sectionId: 'SEC_CLARIFY_QUESTIONS', sectionName: 'Questions You May Want to Clarify', description: 'Specific follow-up items to ask seller or management', displayOrder: 5, status: 'Active' },
  { sectionId: 'SEC_FINAL_ASSESSMENT', sectionName: 'Final Assessment', description: 'Balanced, objective concluding takeaway', displayOrder: 6, status: 'Active' }
];

// Seed default version history
export const DEFAULT_VERSION_HISTORY: ExcelVersionHistory[] = [
  {
    workbookVersion: '3.0.0',
    date: '2026-07-25',
    author: 'BeforeRegret Product Architecture',
    description: 'Data-driven Master Engine Workbook with Question Sets, Question Groups, Option Keys, Structured Scenario Rules & Report Sections.',
    notes: 'Zero code hardcoding. Profile questions, hierarchy, logic, importance, scenario rules, and section templates driven 100% by Excel.'
  }
];

// Seed default labels for UI
export const DEFAULT_ENGINE_LABELS: ExcelLabel[] = [
  { labelKey: 'wizard_title', defaultText: 'Resident Intelligence Questionnaire Engine', section: 'Wizard', status: 'Active' },
  { labelKey: 'wizard_subtitle', defaultText: 'Unvarnished, real resident experience shared in under 3 minutes', section: 'Wizard', status: 'Active' },
  { labelKey: 'btn_select_topics', defaultText: 'Choose 5 Topics That Matter Most', section: 'Wizard', status: 'Active' },
  { labelKey: 'btn_next_question', defaultText: 'Next Question', section: 'Wizard', status: 'Active' },
  { labelKey: 'btn_skip_question', defaultText: 'Skip This Question', section: 'Wizard', status: 'Active' },
  { labelKey: 'declaration_text', defaultText: 'I confirm that these insights represent my true living experience as a resident.', section: 'Wizard', status: 'Active' },
  { labelKey: 'btn_submit_contribution', defaultText: 'Publish My Resident Report', section: 'Wizard', status: 'Active' }
];

export const DEFAULT_ENGINE_TRANSLATIONS: ExcelTranslation[] = [
  { languageCode: 'en-IN', key: 'wizard_title', translationText: 'Resident Intelligence Questionnaire Engine' },
  { languageCode: 'hi-IN', key: 'wizard_title', translationText: 'निवासी गुप्तवार्ता प्रश्नावली इंजन' }
];

// Seed default Master Engine Workbook
export function buildDefaultMasterEngineWorkbook(): MasterEngineWorkbook {
  const topics: ExcelTopic[] = CONTRIBUTOR_TOPICS.map((t, idx) => ({
    topicId: t.id,
    topicName: t.title,
    mainQuestion: t.mainQuestion || getMainQuestionForTopic(t.id),
    description: t.description,
    icon: t.iconName,
    displayOrder: idx + 1,
    status: 'Active',
    category: t.category,
    buyerPriority: 10 - Math.floor(idx / 2),
    contributorPriority: 10 - Math.floor(idx / 2),
    minYearsRequired: 0
  }));

  const questionSets: ExcelQuestionSet[] = [];
  const questionGroups: ExcelQuestionGroup[] = [];
  const questions: ExcelQuestion[] = [];
  const options: ExcelOption[] = [];
  const conditionalRules: ExcelConditionalRule[] = [];
  const scenarioRules: ExcelScenarioRule[] = [];
  const reportScenarios: ExcelReportScenario[] = [];
  const editorialTemplates: ExcelEditorialTemplate[] = [];

  Object.entries(STRUCTURED_QUESTIONS_DATABASE).forEach(([topicId, qList]) => {
    // 1. Question Set per topic
    const questionSetId = `QS_${topicId.toUpperCase()}_MAIN`;
    const topicTitle = CONTRIBUTOR_TOPICS.find(t => t.id === topicId)?.title || topicId;

    questionSets.push({
      questionSetId,
      topicId,
      questionSetName: `Basic ${topicTitle} Questions`,
      description: `Core questionnaire set for evaluating ${topicTitle}`,
      displayOrder: 1,
      status: 'Active'
    });

    // 2. Question Groups per topic
    const defaultGroup1Id = `QG_${topicId.toUpperCase()}_AVAILABILITY`;
    const defaultGroup2Id = `QG_${topicId.toUpperCase()}_QUALITY`;

    questionGroups.push({
      questionGroupId: defaultGroup1Id,
      questionSetId,
      questionGroupName: `${topicTitle} Conditions & Operations`,
      description: `Primary operational indicators for ${topicTitle}`,
      displayOrder: 1,
      status: 'Active'
    });

    questionGroups.push({
      questionGroupId: defaultGroup2Id,
      questionSetId,
      questionGroupName: `${topicTitle} Specific Issues & Edge Cases`,
      description: `Targeted secondary issues for ${topicTitle}`,
      displayOrder: 2,
      status: 'Active'
    });

    // 3. Report Scenarios
    const defaultScenarioId = `SCN_${topicId.toUpperCase()}_NORMAL`;
    const criticalScenarioId = `SCN_${topicId.toUpperCase()}_CRITICAL`;

    reportScenarios.push({
      scenarioId: defaultScenarioId,
      topicId,
      scenarioName: `Normal Operations - ${topicTitle}`,
      priority: 1,
      status: 'Active',
      scenarioDescription: `Standard smooth or minor issue narrative for ${topicTitle}`
    });

    reportScenarios.push({
      scenarioId: criticalScenarioId,
      topicId,
      scenarioName: `Severe / Critical Issue - ${topicTitle}`,
      priority: 10,
      status: 'Active',
      scenarioDescription: `High alert or severe frustration narrative for ${topicTitle}`
    });

    // 4. Questions & Options
    qList.forEach((q, qIdx) => {
      const isRating = q.type === 'rating' || (q as any).inputType === 'rating';
      const questionGroupId = isRating ? defaultGroup1Id : defaultGroup2Id;
      const importanceLevel: 'Critical' | 'High' | 'Medium' | 'Low' =
        isRating ? 'Critical' : qIdx === 0 ? 'High' : 'Medium';

      const rawOpts = q.options && q.options.length > 0
        ? q.options
        : isRating
          ? ['1 Star - Poor', '2 Stars - Below Average', '3 Stars - Average', '4 Stars - Good', '5 Stars - Excellent']
          : ['Yes', 'No', 'Sometimes'];

      questions.push({
        questionId: q.id,
        topicId,
        questionSetId,
        questionGroupId,
        mainQuestionText: q.mainQuestionText || (CONTRIBUTOR_TOPICS.find(t => t.id === topicId)?.mainQuestion || getMainQuestionForTopic(topicId)),
        questionText: q.questionText,
        questionDescription: isRating ? 'Compulsory overall rating question' : 'Selectable question bank item',
        questionType: (q.type as any) || (q as any).inputType || 'single-choice',
        optionsPipeSeparated: rawOpts.join(' | '),
        answers: q.answers,
        importance: importanceLevel,
        displayOrder: qIdx + 1,
        required: isRating,
        allowSkip: false,
        skipText: '',
        helpText: q.helpText || '',
        placeholder: 'Select option...',
        status: 'Active'
      });

      // Options with stable internal Option Keys
      rawOpts.forEach((optText, optIdx) => {
        const optId = `OPT_${q.id}_${optIdx + 1}`;
        const cleanKey = optText.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        const optionKey = `OPT_KEY_${cleanKey}`;

        const isSevere = optText.toLowerCase().includes('severe') ||
          optText.toLowerCase().includes('frequent') ||
          optText.toLowerCase().includes('poor') ||
          optText.toLowerCase().includes('daily');

        options.push({
          optionId: optId,
          questionId: q.id,
          optionKey,
          displayText: optText,
          storedValue: optText,
          displayOrder: optIdx + 1,
          triggersFollowUp: isSevere,
          followUpRuleId: isSevere ? `FOL_${q.id}` : undefined,
          weight: isSevere ? -2 : 1,
          status: 'Active'
        });

        // Add structured Scenario Rule for critical severe answer
        if (isSevere) {
          scenarioRules.push({
            ruleId: `SR_${q.id}_CRITICAL`,
            scenarioId: criticalScenarioId,
            questionId: q.id,
            operator: 'EQUALS',
            expectedValue: optText,
            priority: 10,
            status: 'Active'
          });
        }
      });
    });

    // Default Scenario Rule for normal scenario
    if (qList.length > 0) {
      scenarioRules.push({
        ruleId: `SR_${topicId.toUpperCase()}_NORMAL`,
        scenarioId: defaultScenarioId,
        questionId: qList[0].id,
        operator: 'NOT_EQUALS',
        expectedValue: 'Severe',
        priority: 1,
        status: 'Active'
      });
    }

    // Editorial Templates across Report Sections for Normal and Critical Scenarios
    const topicTemplates = getTopicEditorialTemplates(topicId, topicTitle, defaultScenarioId, criticalScenarioId);
    editorialTemplates.push(...topicTemplates);
  });

  return {
    settings: DEFAULT_ENGINE_SETTINGS,
    profileQuestions: DEFAULT_PROFILE_QUESTIONS,
    topics,
    questionSets,
    questionGroups,
    questions,
    options,
    conditionalRules,
    scenarioRules,
    reportScenarios,
    reportSections: DEFAULT_REPORT_SECTIONS,
    editorialTemplates,
    labels: DEFAULT_ENGINE_LABELS,
    translations: DEFAULT_ENGINE_TRANSLATIONS,
    versionHistory: DEFAULT_VERSION_HISTORY
  };
}

// LocalStorage Persistence
export function saveMasterEngineWorkbookToStorage(workbook: MasterEngineWorkbook): void {
  try {
    localStorage.setItem(WORKBOOK_STORAGE_KEY, JSON.stringify(workbook));
  } catch (e) {
    console.error('Failed to persist MasterEngineWorkbook to LocalStorage', e);
  }
}

export function loadMasterEngineWorkbookFromStorage(): MasterEngineWorkbook {
  try {
    const raw = localStorage.getItem(WORKBOOK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed.topics &&
        parsed.questions &&
        parsed.settings &&
        parsed.settings.version === DEFAULT_ENGINE_SETTINGS.version
      ) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading MasterEngineWorkbook from LocalStorage', e);
  }
  const defaultWb = buildDefaultMasterEngineWorkbook();
  saveMasterEngineWorkbookToStorage(defaultWb);
  return defaultWb;
}

export function resetMasterEngineWorkbookStorage(): MasterEngineWorkbook {
  localStorage.removeItem(WORKBOOK_STORAGE_KEY);
  const fresh = buildDefaultMasterEngineWorkbook();
  saveMasterEngineWorkbookToStorage(fresh);
  return fresh;
}

// Parse uploaded Excel ArrayBuffer into MasterEngineWorkbook
export function parseWorkbookArrayBuffer(arrayBuffer: ArrayBuffer): MasterEngineWorkbook {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  const master = buildDefaultMasterEngineWorkbook();

  // 1. Settings Sheet
  const settingsSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('setting'));
  if (settingsSheetName) {
    const ws = wb.Sheets[settingsSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    rows.forEach(r => {
      const key = String(r.Key || r.Setting || r.Property || '').trim();
      const val = String(r.Value || r.Setting_Value || '').trim();
      if (key === 'Max_Topics_Per_Resident' || key === 'maxTopicsPerResident') master.settings.maxTopicsPerResident = Number(val) || 5;
      if (key === 'Min_Questions_Per_Topic' || key === 'minQuestionsPerTopic') master.settings.minQuestionsPerTopic = Number(val) || 2;
      if (key === 'Max_Questions_Per_Topic' || key === 'maxQuestionsPerTopic') master.settings.maxQuestionsPerTopic = Number(val) || 4;
      if (key === 'Default_Skip_Text' || key === 'defaultSkipText') master.settings.defaultSkipText = val;
    });
  }

  // 2. Profile Questions Sheet
  const profileSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('profile'));
  if (profileSheetName) {
    const ws = wb.Sheets[profileSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.profileQuestions = rows.map((r, idx) => ({
        questionId: String(r.Question_ID || r.questionId || `PQ_${idx + 1}`).trim(),
        questionText: String(r.Question_Text || r.questionText || 'Profile Question').trim(),
        helpText: String(r.Help_Text || '').trim(),
        questionType: (r.Question_Type || 'single-choice') as any,
        optionsPipeSeparated: String(r.Options_Pipe_Separated || '').trim(),
        required: String(r.Required).toLowerCase() !== 'false',
        displayOrder: Number(r.Display_Order || idx + 1),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active'
      }));
    }
  }

  // 3. Topics Sheet
  const topicsSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('topic'));
  if (topicsSheetName) {
    const ws = wb.Sheets[topicsSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.topics = rows.map((r, idx) => ({
        topicId: String(r.Topic_ID || r.topicId || `TOP_${idx + 1}`).trim(),
        topicName: String(r.Topic_Name || r.topicName || 'Untitled Topic').trim(),
        mainQuestion: String(r.Main_Question || r.Main_Question_Text || r.MainQuestion || r.Topic_Main_Question || '').trim() || undefined,
        description: String(r.Description || '').trim(),
        icon: String(r.Icon || 'HelpCircle').trim(),
        displayOrder: Number(r.Display_Order || idx + 1),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active',
        category: String(r.Category || 'General').trim(),
        buyerPriority: Number(r.Buyer_Priority || 5),
        contributorPriority: Number(r.Contributor_Priority || 5),
        minYearsRequired: Number(r.Min_Years_Required || 0)
      }));
    }
  }

  // 4. Question Sets Sheet
  const setsSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('question_set') || s.toLowerCase().includes('question_sets'));
  if (setsSheetName) {
    const ws = wb.Sheets[setsSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.questionSets = rows.map((r, idx) => ({
        questionSetId: String(r.Question_Set_ID || `QS_${idx + 1}`).trim(),
        topicId: String(r.Topic_ID || '').trim(),
        questionSetName: String(r.Question_Set_Name || 'Question Set').trim(),
        description: String(r.Description || '').trim(),
        displayOrder: Number(r.Display_Order || idx + 1),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active'
      }));
    }
  }

  // 5. Question Groups Sheet
  const groupsSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('question_group') || s.toLowerCase().includes('question_groups'));
  if (groupsSheetName) {
    const ws = wb.Sheets[groupsSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.questionGroups = rows.map((r, idx) => ({
        questionGroupId: String(r.Question_Group_ID || `QG_${idx + 1}`).trim(),
        questionSetId: String(r.Question_Set_ID || '').trim(),
        questionGroupName: String(r.Question_Group_Name || 'Question Group').trim(),
        description: String(r.Description || '').trim(),
        displayOrder: Number(r.Display_Order || idx + 1),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active'
      }));
    }
  }

  // 6. Questions Sheet
  const questionsSheetName = wb.SheetNames.find(s => s.toLowerCase() === 'questions' || s.toLowerCase().includes('sub_question'));
  if (questionsSheetName) {
    const ws = wb.Sheets[questionsSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      const parsedOptions: typeof master.options = [];

      master.questions = rows.map((r, idx) => {
        const qId = String(r.Question_ID || `Q_${idx + 1}`).trim();
        const mainQText = String(r.Main_Question || r.Main_Question_Text || r.MainQuestion || r.Topic_Main_Question || '').trim();
        
        let optList: string[] = [];
        let ansList: string[] = [];

        // 1. Fetch from individual option columns Option_1, Option_2, ... Option_15 and Answer_1, Answer_2, ...
        for (let i = 1; i <= 15; i++) {
          const val = r[`Option_${i}`] ?? r[`Option ${i}`] ?? r[`Option_${String.fromCharCode(64 + i)}`] ?? r[`Option ${String.fromCharCode(64 + i)}` ];
          const ansVal = r[`Answer_${i}`] ?? r[`Answer ${i}`] ?? r[`Answer_${String.fromCharCode(64 + i)}`] ?? r[`Answer ${String.fromCharCode(64 + i)}` ];
          
          if (val !== undefined && val !== null && String(val).trim() !== '') {
            const cleanOpt = String(val).trim();
            optList.push(cleanOpt);
            if (ansVal !== undefined && ansVal !== null && String(ansVal).trim() !== '') {
              ansList.push(String(ansVal).trim());
            } else {
              ansList.push(`Regarding ${cleanOpt}: mapped narrative from resident experience.`);
            }
          }
        }

        // 2. Fallback to Options_Pipe_Separated if no individual option columns found
        const pipeOpts = String(r.Options_Pipe_Separated || r.Options || '').trim();
        if (optList.length === 0 && pipeOpts) {
          optList = pipeOpts.split('|').map(s => s.trim()).filter(Boolean);
          ansList = optList.map(o => `Regarding ${o}: mapped narrative from resident experience.`);
        }

        if (optList.length > 0) {
          optList.forEach((optText, optIdx) => {
            const cleanKey = optText.toUpperCase().replace(/[^A-Z0-9]/g, '_');
            const isSevere = optText.toLowerCase().includes('severe') ||
              optText.toLowerCase().includes('frequent') ||
              optText.toLowerCase().includes('poor') ||
              optText.toLowerCase().includes('daily');

            parsedOptions.push({
              optionId: `OPT_${qId}_${optIdx + 1}`,
              questionId: qId,
              optionKey: `OPT_KEY_${cleanKey}`,
              displayText: optText,
              storedValue: optText,
              displayOrder: optIdx + 1,
              triggersFollowUp: isSevere,
              followUpRuleId: isSevere ? `FOL_${qId}` : undefined,
              weight: isSevere ? -2 : 1,
              status: 'Active'
            });
          });
        }

        return {
          questionId: qId,
          topicId: String(r.Topic_ID || '').trim(),
          questionSetId: String(r.Question_Set_ID || '').trim(),
          questionGroupId: String(r.Question_Group_ID || '').trim(),
          mainQuestionText: mainQText || undefined,
          questionText: String(r.Question_Text || mainQText || 'Question Text').trim(),
          questionDescription: String(r.Question_Description || '').trim(),
          questionType: (r.Question_Type || 'single-choice') as any,
          optionsPipeSeparated: pipeOpts || optList.join(' | '),
          answers: ansList,
          importance: (r.Importance || 'Medium') as any,
          displayOrder: Number(r.Display_Order || idx + 1),
          required: String(r.Is_Compulsory_Rating).toLowerCase() === 'yes' || String(r.Is_Compulsory_Rating).toLowerCase() === 'true' || String(r.Required).toLowerCase() === 'true' || String(r.Required).toLowerCase() === 'yes' || String(r.Question_Type) === 'rating',
          allowSkip: false,
          skipText: '',
          helpText: String(r.Help_Text || '').trim(),
          placeholder: String(r.Placeholder || '').trim(),
          status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active'
        };
      });

      if (parsedOptions.length > 0) {
        master.options = parsedOptions;
      }
    }
  }

  // 7. Options Sheet
  const optionsSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('option'));
  if (optionsSheetName) {
    const ws = wb.Sheets[optionsSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.options = rows.map((r, idx) => ({
        optionId: String(r.Option_ID || `OPT_${idx + 1}`).trim(),
        questionId: String(r.Question_ID || '').trim(),
        optionKey: String(r.Option_Key || `OPT_KEY_${idx + 1}`).trim(),
        displayText: String(r.Display_Text || 'Option').trim(),
        storedValue: String(r.Stored_Value || r.Display_Text || 'Option').trim(),
        displayOrder: Number(r.Display_Order || idx + 1),
        triggersFollowUp: String(r.Triggers_Follow_Up).toLowerCase() === 'true' || String(r.Triggers_Follow_Up).toLowerCase() === 'yes',
        followUpRuleId: r.Follow_Up_Rule_ID ? String(r.Follow_Up_Rule_ID) : undefined,
        weight: Number(r.Weight || 0),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active'
      }));
    }
  }

  // 8. Conditional Logic Sheet
  const condSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('conditional'));
  if (condSheetName) {
    const ws = wb.Sheets[condSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.conditionalRules = rows.map((r, idx) => ({
        ruleId: String(r.Rule_ID || `RULE_${idx + 1}`).trim(),
        sourceQuestionId: String(r.Source_Question_ID || '').trim(),
        operator: (r.Operator || 'IS_SKIPPED') as any,
        targetAnswerValue: String(r.Target_Answer_Value || 'Skipped').trim(),
        action: (r.Action || 'REPLACE_QUESTION') as any,
        targetQuestionId: String(r.Target_Question_ID || '').trim(),
        description: String(r.Description || '').trim()
      }));
    }
  }

  // 9. Scenario Rules Sheet
  const scenarioRulesSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('scenario_rule') || s.toLowerCase().includes('scenario_rules'));
  if (scenarioRulesSheetName) {
    const ws = wb.Sheets[scenarioRulesSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.scenarioRules = rows.map((r, idx) => ({
        ruleId: String(r.Rule_ID || `SR_${idx + 1}`).trim(),
        scenarioId: String(r.Scenario_ID || '').trim(),
        questionId: String(r.Question_ID || '').trim(),
        operator: (r.Operator || 'EQUALS') as any,
        expectedValue: String(r.Expected_Value || '').trim(),
        priority: Number(r.Priority || 1),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active'
      }));
    }
  }

  // 10. Report Scenarios Sheet
  const scenarioSheetName = wb.SheetNames.find(s => s.toLowerCase() === 'report_scenarios' || (s.toLowerCase().includes('scenario') && !s.toLowerCase().includes('rule')));
  if (scenarioSheetName) {
    const ws = wb.Sheets[scenarioSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.reportScenarios = rows.map((r, idx) => ({
        scenarioId: String(r.Scenario_ID || `SCN_${idx + 1}`).trim(),
        topicId: String(r.Topic_ID || '').trim(),
        scenarioName: String(r.Scenario_Name || 'Scenario').trim(),
        priority: Number(r.Priority || 1),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active',
        scenarioDescription: String(r.Scenario_Description || '').trim()
      }));
    }
  }

  // 11. Report Sections Sheet
  const sectionSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('report_section') || s.toLowerCase().includes('report_sections'));
  if (sectionSheetName) {
    const ws = wb.Sheets[sectionSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.reportSections = rows.map((r, idx) => ({
        sectionId: String(r.Section_ID || `SEC_${idx + 1}`).trim(),
        sectionName: String(r.Section_Name || 'Report Section').trim(),
        description: String(r.Description || '').trim(),
        displayOrder: Number(r.Display_Order || idx + 1),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active'
      }));
    }
  }

  // 12. Editorial Templates Sheet
  const templateSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('template') || s.toLowerCase().includes('editorial'));
  if (templateSheetName) {
    const ws = wb.Sheets[templateSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.editorialTemplates = rows.map((r, idx) => ({
        templateId: String(r.Template_ID || `TMPL_${idx + 1}`).trim(),
        sectionId: String(r.Section_ID || '').trim(),
        scenarioId: String(r.Scenario_ID || '').trim(),
        variationNumber: Number(r.Variation_Number || 1),
        language: String(r.Language || 'en-IN'),
        tone: (r.Tone || 'Conversational') as any,
        templateText: String(r.Template_Text || '').trim(),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active'
      }));
    }
  }

  // 13. Labels Sheet
  const labelSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('label'));
  if (labelSheetName) {
    const ws = wb.Sheets[labelSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length > 0) {
      master.labels = rows.map(r => ({
        labelKey: String(r.Label_Key || '').trim(),
        defaultText: String(r.Default_Text || '').trim(),
        section: String(r.Section || 'General').trim(),
        status: (r.Status || 'Active') === 'Inactive' ? 'Inactive' : 'Active'
      }));
    }
  }

  return master;
}

// Runtime Evaluator Helpers
export function getEngineLabel(key: string, fallback: string, workbook: MasterEngineWorkbook): string {
  const item = workbook.labels.find(l => l.labelKey === key && l.status === 'Active');
  return item ? item.defaultText : fallback;
}

// Evaluates structured scenario rules against answers and compiles narrative sections
export function evaluateScenarioNarrative(
  topicId: string,
  answers: Record<string, string>,
  residentContext: { yearsLiving: number; residentType: string; societyName?: string },
  workbook: MasterEngineWorkbook
): { summaryText: string; scenarioId: string; templateId: string } {
  const activeScenarios = workbook.reportScenarios
    .filter(s => s.topicId === topicId && s.status === 'Active')
    .sort((a, b) => b.priority - a.priority);

  let matchedScenario = activeScenarios[0];

  // Evaluate structured scenario rules row-by-row
  for (const scenario of activeScenarios) {
    const rules = workbook.scenarioRules.filter(
      r => r.scenarioId === scenario.scenarioId && r.status === 'Active'
    );

    if (rules.length === 0) continue;

    const allConditionsMet = rules.every(rule => {
      const userAns = answers[rule.questionId] || '';
      if (!userAns) return false;

      switch (rule.operator) {
        case 'EQUALS':
          return userAns.toLowerCase() === rule.expectedValue.toLowerCase();
        case 'NOT_EQUALS':
          return userAns.toLowerCase() !== rule.expectedValue.toLowerCase();
        case 'CONTAINS':
          return userAns.toLowerCase().includes(rule.expectedValue.toLowerCase());
        case 'IS_SKIPPED':
          return userAns === 'Skipped';
        case 'IS_ANSWERED':
          return userAns !== 'Skipped' && userAns.length > 0;
        default:
          return true;
      }
    });

    if (allConditionsMet) {
      matchedScenario = scenario;
      break;
    }
  }

  const safeTopicId = (topicId || '').toUpperCase();
  const scenarioId = matchedScenario ? matchedScenario.scenarioId : `SCN_${safeTopicId}_NORMAL`;

  // Fetch editorial templates for matched scenario across report sections
  const matchedTemplates = workbook.editorialTemplates.filter(
    t => t.scenarioId === scenarioId && t.status === 'Active'
  );

  let textSegments: string[] = [];
  let primaryTemplateId = 'TMPL_DEFAULT';

  // Group templates by section display order
  const activeSections = workbook.reportSections
    .filter(s => s.status === 'Active')
    .sort((a, b) => a.displayOrder - b.displayOrder);

  activeSections.forEach(section => {
    const secTemplates = matchedTemplates.filter(t => t.sectionId === section.sectionId);
    if (secTemplates.length > 0) {
      const picked = secTemplates[Math.floor(Math.random() * secTemplates.length)];
      primaryTemplateId = picked.templateId;
      textSegments.push(picked.templateText);
    }
  });

  if (textSegments.length === 0) {
    const topicTitle = CONTRIBUTOR_TOPICS.find(t => t.id === topicId)?.title || topicId || 'this topic';
    textSegments.push(`Based on resident responses in {Society_Name}, evaluating ${topicTitle.toLowerCase()} provides evidence-based practical insight for prospective buyers. Reviewing resident feedback and inspecting peak usage conditions will help set realistic expectations before finalizing a purchase.`);
  }

  let compiledText = textSegments.join(' ');

  // Interpolate placeholders
  compiledText = compiledText
    .replace(/\{Years_Living_Here\}/g, String(residentContext.yearsLiving || 3))
    .replace(/\{Resident_Type\}/g, residentContext.residentType || 'Owner')
    .replace(/\{Society_Name\}/g, residentContext.societyName || 'our society');

  Object.entries(answers).forEach(([qId, ansVal]) => {
    const token = new RegExp(`\\{Answer_${qId}\\}`,'g');
    compiledText = compiledText.replace(token, ansVal);
  });

  return {
    summaryText: compiledText,
    scenarioId,
    templateId: primaryTemplateId
  };
}
