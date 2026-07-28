import * as XLSX from 'xlsx';
import { TopicDefinition, StructuredSubQuestion, getMainQuestionForTopic } from '../data/contributorTopicsData';

export interface AnswerTemplateDefinition {
  topicId: string;
  openingFormat?: string;
  fallbackFirst?: string;
  fallbackSecond?: string;
  fallbackThird?: string;
}

export interface ContributionColumnSchema {
  columnName: string;
  dataType: string;
  required: boolean;
  description: string;
  sampleValue: string;
}

const LOCAL_STORAGE_EXCEL_KEY = 'beforeregret_custom_excel_data_v1';

// Default Data Schema definition for Resident Contribution
export const DEFAULT_CONTRIBUTION_COLUMNS: ContributionColumnSchema[] = [
  {
    columnName: 'Resident_Real_Name',
    dataType: 'String',
    required: true,
    description: 'First & Last Name of contributing resident (Kept private)',
    sampleValue: 'Vikram Sharma'
  },
  {
    columnName: 'Public_Anonymous_Persona',
    dataType: 'String',
    required: true,
    description: 'Generated public persona shown on buyer dashboard',
    sampleValue: 'Resident in Tower B (3+ Yrs)'
  },
  {
    columnName: 'Society_ID',
    dataType: 'String',
    required: true,
    description: 'Unique ID of selected society',
    sampleValue: 'soc-101'
  },
  {
    columnName: 'Society_Name',
    dataType: 'String',
    required: true,
    description: 'Name of the residential society',
    sampleValue: 'Lodha Amara'
  },
  {
    columnName: 'Locality_City',
    dataType: 'String',
    required: true,
    description: 'Locality and city location',
    sampleValue: 'Kolshet Road, Thane'
  },
  {
    columnName: 'Years_Living_Here',
    dataType: 'Number',
    required: true,
    description: 'Number of years resident has lived in society',
    sampleValue: '3'
  },
  {
    columnName: 'Resident_Type',
    dataType: 'Enum (Owner/Tenant)',
    required: true,
    description: 'Occupancy status of the resident',
    sampleValue: 'Owner'
  },
  {
    columnName: 'Selected_Topic_IDs',
    dataType: 'Array<String>',
    required: true,
    description: 'The topic IDs selected by the resident',
    sampleValue: 'water, parking, maintenance, monsoon-issues, things-i-wish-i-knew'
  },
  {
    columnName: 'Question_ID',
    dataType: 'String',
    required: true,
    description: 'ID of question selected from topic question bank',
    sampleValue: 'water_morning_pressure'
  },
  {
    columnName: 'Question_Text',
    dataType: 'String',
    required: true,
    description: 'The prompt text shown to resident',
    sampleValue: 'Does water pressure drop significantly during peak morning hours?'
  },
  {
    columnName: 'Selected_Answer_Option',
    dataType: 'String',
    required: true,
    description: 'Resident answer choice or 5-star rating score',
    sampleValue: 'Slight Drop on Peak Mornings (Manageable)'
  },
  {
    columnName: 'Is_Compulsory_Rating',
    dataType: 'Boolean',
    required: true,
    description: 'Whether this is a compulsory overall 5-star rating question',
    sampleValue: 'FALSE'
  },
  {
    columnName: 'Mapped_Conversational_Summary',
    dataType: 'String',
    required: true,
    description: 'Generated unvarnished resident narrative for homebuyers',
    sampleValue: 'We have been staying here for 3 years. Water supply drops slightly on peak mornings...'
  },
  {
    columnName: 'Truthfulness_Declaration',
    dataType: 'Boolean',
    required: true,
    description: 'Declaration that answers represent real resident experience',
    sampleValue: 'TRUE'
  },
  {
    columnName: 'Contribution_Timestamp',
    dataType: 'ISO Date',
    required: true,
    description: 'Date and time of submission',
    sampleValue: '2026-07-27T00:30:00.000Z'
  }
];

// Helper to generate default answer narrative if not explicitly set
export function generateDefaultOptionAnswerNarrative(questionText: string, optionText: string, optionIndex: number): string {
  if (!optionText || !optionText.trim()) return '';

  const cleanQ = questionText.trim().replace(/\?$/, '');

  if (optionText.toLowerCase().includes('star')) {
    if (optionText.includes('1 Star')) return `Rating 1/5: ${cleanQ} is unsatisfactory and a persistent concern.`;
    if (optionText.includes('2 Star')) return `Rating 2/5: ${cleanQ} is below average with noticeable issues.`;
    if (optionText.includes('3 Star')) return `Rating 3/5: ${cleanQ} is moderate and acceptable under normal conditions.`;
    if (optionText.includes('4 Star')) return `Rating 4/5: ${cleanQ} is good and reliably maintained.`;
    if (optionText.includes('5 Star')) return `Rating 5/5: ${cleanQ} is excellent and consistently high quality.`;
  }

  if (optionText.toLowerCase() === 'yes') {
    return `Yes - ${cleanQ} is experienced regularly by residents.`;
  }
  if (optionText.toLowerCase() === 'no') {
    return `No - ${cleanQ} is not an issue in this society.`;
  }
  if (optionText.toLowerCase() === 'sometimes' || optionText.toLowerCase() === 'occasionally') {
    return `Sometimes - ${cleanQ} occurs occasionally during peak times or weather changes.`;
  }

  return `Regarding ${cleanQ.toLowerCase()}: "${optionText.trim()}".`;
}

// Helper to generate downloadable XLSX binary workbook
export function generateMasterExcelWorkbook(
  topics: TopicDefinition[],
  questionsMap: Record<string, StructuredSubQuestion[]>
): Uint8Array {
  const wb = XLSX.utils.book_new();

  // 1. Sheet 1: Topics
  const topicsRows = topics.map(t => {
    const qList = questionsMap[t.id] || [];
    const ratingCount = qList.filter(q => q.type === 'rating' || q.inputType === 'rating').length;
    const mainQ = t.mainQuestion || getMainQuestionForTopic(t.id);
    return {
      Topic_ID: t.id,
      Title: t.title,
      Main_Question: mainQ,
      Category: t.category,
      Icon_Name: t.iconName,
      Description: t.description,
      Compulsory_Rating_Questions_Count: ratingCount,
      Total_Questions_In_Question_Bank: qList.length
    };
  });
  const wsTopics = XLSX.utils.json_to_sheet(topicsRows);
  XLSX.utils.book_append_sheet(wb, wsTopics, 'Topics');

  // 2. Sheet 2: Sub_Questions_Question_Bank
  const questionsRows: any[] = [];
  Object.entries(questionsMap).forEach(([topicId, questions]) => {
    const topicTitle = topics.find(t => t.id === topicId)?.title || topicId;
    const topicMainQ = topics.find(t => t.id === topicId)?.mainQuestion || getMainQuestionForTopic(topicId);

    questions.forEach((q, idx) => {
      const isRating = q.type === 'rating' || q.inputType === 'rating';
      const opts = q.options && q.options.length > 0
        ? q.options
        : isRating
          ? ['1 Star - Poor', '2 Stars - Below Average', '3 Stars - Average', '4 Stars - Good', '5 Stars - Excellent']
          : ['Yes', 'No', 'Sometimes'];

      const mainQuestionText = q.mainQuestionText || topicMainQ;

      const rowObj: any = {
        Topic_ID: topicId,
        Topic_Title: topicTitle,
        Main_Question: mainQuestionText,
        Question_ID: q.id,
        Question_Order: idx + 1,
        Is_Compulsory_Rating: isRating ? 'YES' : 'NO',
        Question_Role: isRating ? 'Compulsory Rating Question' : 'Selectable Question Bank Item',
        Question_Text: q.questionText,
        Question_Type: q.type || q.inputType || 'single-choice',
        Help_Text: q.helpText || ''
      };

      // Store options and corresponding answers side-by-side: Option_1, Answer_1, Option_2, Answer_2 ... Option_8, Answer_8
      for (let i = 0; i < 8; i++) {
        const optText = opts[i] || '';
        const ansText = (q.answers && q.answers[i]) ? q.answers[i] : generateDefaultOptionAnswerNarrative(q.questionText, optText, i);
        rowObj[`Option_${i + 1}`] = optText;
        rowObj[`Answer_${i + 1}`] = optText ? ansText : '';
      }

      // Also include Options_Pipe_Separated for reference
      rowObj['Options_Pipe_Separated'] = opts.join(' | ');

      questionsRows.push(rowObj);
    });
  });
  const wsQuestions = XLSX.utils.json_to_sheet(questionsRows);
  XLSX.utils.book_append_sheet(wb, wsQuestions, 'Sub_Questions_Question_Bank');

  // 3. Sheet 3: Answer_Templates for Narrative Summaries
  const answerTemplateRows: any[] = [];

  // Add macro topic opening formats first
  topics.forEach(t => {
    const mainQ = t.mainQuestion || getMainQuestionForTopic(t.id);
    answerTemplateRows.push({
      Topic_ID: t.id,
      Topic_Title: t.title,
      Main_Question: mainQ,
      Question_ID: 'ALL_QUESTIONS_MACRO',
      Question_Text: `[MACRO OPENING TEMPLATE FOR ${t.title.toUpperCase()}]`,
      Option_Choice: 'N/A (Topic Opening Header)',
      Answer_Narrative_Template: `We have been staying here for {Years_Living_Here} years as {Resident_Type}. Honestly speaking regarding ${t.title.toLowerCase()}:`,
      Template_Category: 'Macro Opening Sentence'
    });
  });

  // Add detailed option templates for each question in topic question bank
  Object.entries(questionsMap).forEach(([topicId, questions]) => {
    const topicTitle = topics.find(t => t.id === topicId)?.title || topicId;
    const topicMainQ = topics.find(t => t.id === topicId)?.mainQuestion || getMainQuestionForTopic(topicId);

    questions.forEach((q) => {
      const isRating = q.type === 'rating' || q.inputType === 'rating';
      const opts = q.options && q.options.length > 0
        ? q.options
        : isRating
          ? ['1 Star - Poor', '2 Stars - Below Average', '3 Stars - Average', '4 Stars - Good', '5 Stars - Excellent']
          : ['Yes', 'No', 'Sometimes'];

      const mainQuestionText = q.mainQuestionText || topicMainQ;

      opts.forEach((opt, optIdx) => {
        const snippet = (q.answers && q.answers[optIdx])
          ? q.answers[optIdx]
          : generateDefaultOptionAnswerNarrative(q.questionText, opt, optIdx);

        answerTemplateRows.push({
          Topic_ID: topicId,
          Topic_Title: topicTitle,
          Main_Question: mainQuestionText,
          Question_ID: q.id,
          Question_Text: q.questionText,
          Option_Choice: opt,
          Answer_Narrative_Template: snippet,
          Template_Category: isRating ? 'Compulsory Rating Answer Template' : 'Question Bank Answer Template'
        });
      });
    });
  });

  const wsTemplates = XLSX.utils.json_to_sheet(answerTemplateRows);
  XLSX.utils.book_append_sheet(wb, wsTemplates, 'Answer_Templates');

  // 4. Sheet 4: Resident Contribution Data Schema & Columns
  const wsSchema = XLSX.utils.json_to_sheet(DEFAULT_CONTRIBUTION_COLUMNS);
  XLSX.utils.book_append_sheet(wb, wsSchema, 'Data_Schema_&_Columns');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}

// Helper to trigger browser file download
export function downloadMasterExcelFile(
  topics: TopicDefinition[],
  questionsMap: Record<string, StructuredSubQuestion[]>
) {
  const binaryArray = generateMasterExcelWorkbook(topics, questionsMap);
  const blob = new Blob([binaryArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BeforeRegret_Resident_Contribution_Master_Questions_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parse uploaded Excel workbook file
export function parseUploadedExcelFile(
  arrayBuffer: ArrayBuffer
): {
  success: boolean;
  topics: TopicDefinition[];
  questionsMap: Record<string, StructuredSubQuestion[]>;
  message: string;
} {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    let parsedTopics: TopicDefinition[] = [];
    let parsedQuestionsMap: Record<string, StructuredSubQuestion[]> = {};

    // 1. Parse Topics sheet if present
    const topicsSheetName = workbook.SheetNames.find(
      s => s.toLowerCase().includes('topic')
    );
    if (topicsSheetName) {
      const ws = workbook.Sheets[topicsSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(ws);
      parsedTopics = json.map((row, index) => ({
        id: String(row.Topic_ID || row.id || `topic_${index + 1}`).trim(),
        title: String(row.Title || row.title || 'Untitled Topic').trim(),
        mainQuestion: String(row.Main_Question || row.Main_Question_Text || row.MainQuestion || row.Topic_Main_Question || '').trim() || undefined,
        category: String(row.Category || row.category || 'General').trim(),
        iconName: String(row.Icon_Name || row.iconName || 'Info').trim(),
        description: String(row.Description || row.description || '').trim(),
        defaultAnsweredCount: Number(row.Default_Answered_Count || row.defaultAnsweredCount || 10)
      }));
    }

    // 2. Parse Sub_Questions sheet if present
    const questionsSheetName = workbook.SheetNames.find(
      s => s.toLowerCase().includes('question') || s.toLowerCase().includes('sub')
    );
    if (questionsSheetName) {
      const ws = workbook.Sheets[questionsSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(ws);
      
      json.forEach((row, index) => {
        const topicId = String(row.Topic_ID || row.topicId || 'general').trim();
        const qId = String(row.Question_ID || row.id || `q_${index + 1}`).trim();
        const mainQText = String(row.Main_Question || row.Main_Question_Text || row.MainQuestion || row.Topic_Main_Question || '').trim();
        const qText = String(row.Question_Text || row.questionText || row.Question || mainQText || '').trim();
        const qType = String(row.Question_Type || row.type || 'single-choice').trim() as any;
        
        let opts: string[] = [];
        let ansList: string[] = [];

        // 1. Check for individual option columns (Option_1, Option_2, ..., Option_15) & Answer columns (Answer_1, Answer_2, ...)
        for (let i = 1; i <= 15; i++) {
          const optVal = row[`Option_${i}`] ?? row[`Option ${i}`] ?? row[`Option_${String.fromCharCode(64 + i)}`] ?? row[`Option ${String.fromCharCode(64 + i)}` ];
          const ansVal = row[`Answer_${i}`] ?? row[`Answer ${i}`] ?? row[`Answer_${String.fromCharCode(64 + i)}`] ?? row[`Answer ${String.fromCharCode(64 + i)}` ];
          
          if (optVal !== undefined && optVal !== null && String(optVal).trim() !== '') {
            const cleanOpt = String(optVal).trim();
            opts.push(cleanOpt);
            
            if (ansVal !== undefined && ansVal !== null && String(ansVal).trim() !== '') {
              ansList.push(String(ansVal).trim());
            } else {
              ansList.push(generateDefaultOptionAnswerNarrative(qText, cleanOpt, i - 1));
            }
          }
        }

        // 2. If no individual option columns were found, check pipe/comma separated fallback
        if (opts.length === 0) {
          if (row.Options_Pipe_Separated) {
            opts = String(row.Options_Pipe_Separated).split('|').map(s => s.trim()).filter(Boolean);
          } else if (row.options) {
            opts = String(row.options).split('|').map(s => s.trim()).filter(Boolean);
          } else if (row.Options) {
            opts = String(row.Options).split(',').map(s => s.trim()).filter(Boolean);
          }
          ansList = opts.map((optStr, optIdx) => generateDefaultOptionAnswerNarrative(qText, optStr, optIdx));
        }

        if (!opts.length) {
          opts = qType === 'rating' ? ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'] : ['Yes', 'No', 'Sometimes'];
          ansList = opts.map((optStr, optIdx) => generateDefaultOptionAnswerNarrative(qText, optStr, optIdx));
        }

        const subQ: StructuredSubQuestion = {
          id: qId,
          topicId: topicId,
          mainQuestionText: mainQText || undefined,
          questionText: qText || mainQText || 'Default Question Text',
          type: qType,
          options: opts,
          answers: ansList,
          helpText: row.Help_Text ? String(row.Help_Text) : undefined
        };

        // If topic mainQuestion is missing, attach from mainQText
        const topicInList = parsedTopics.find(t => t.id === topicId);
        if (topicInList && !topicInList.mainQuestion && mainQText) {
          topicInList.mainQuestion = mainQText;
        }

        if (!parsedQuestionsMap[topicId]) {
          parsedQuestionsMap[topicId] = [];
        }
        parsedQuestionsMap[topicId].push(subQ);
      });
    }

    if (parsedTopics.length === 0) {
      return {
        success: false,
        topics: [],
        questionsMap: {},
        message: 'No "Topics" sheet found or sheet was empty in uploaded file.'
      };
    }

    // Save to local storage for persistent real-time usage
    saveCustomExcelDataToStorage(parsedTopics, parsedQuestionsMap);

    const totalQuestionsCount = Object.values(parsedQuestionsMap).reduce((acc, qList) => acc + qList.length, 0);

    return {
      success: true,
      topics: parsedTopics,
      questionsMap: parsedQuestionsMap,
      message: `Successfully loaded ${parsedTopics.length} Topics and ${totalQuestionsCount} Sub-Questions from Excel sheet in real time!`
    };
  } catch (err: any) {
    return {
      success: false,
      topics: [],
      questionsMap: {},
      message: `Error parsing Excel file: ${err.message || String(err)}`
    };
  }
}

// LocalStorage Persistence Helpers
export function saveCustomExcelDataToStorage(
  topics: TopicDefinition[],
  questionsMap: Record<string, StructuredSubQuestion[]>
) {
  try {
    const payload = JSON.stringify({ topics, questionsMap, updatedAt: new Date().toISOString() });
    localStorage.setItem(LOCAL_STORAGE_EXCEL_KEY, payload);
  } catch (e) {
    console.error('Failed to save Excel data to localStorage', e);
  }
}

export function loadCustomExcelDataFromStorage(): {
  topics: TopicDefinition[];
  questionsMap: Record<string, StructuredSubQuestion[]>;
} | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EXCEL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.topics && parsed.questionsMap) {
      return {
        topics: parsed.topics,
        questionsMap: parsed.questionsMap
      };
    }
  } catch (e) {
    console.error('Failed to parse stored Excel data', e);
  }
  return null;
}

export function clearCustomExcelDataFromStorage() {
  localStorage.removeItem(LOCAL_STORAGE_EXCEL_KEY);
}
