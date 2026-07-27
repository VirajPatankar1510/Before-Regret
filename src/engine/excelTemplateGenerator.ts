import * as XLSX from 'xlsx';
import { MasterEngineWorkbook } from '../types/residentEngineTypes';

export function generateDataDrivenMasterExcelWorkbook(workbookData: MasterEngineWorkbook): Uint8Array {
  const wb = XLSX.utils.book_new();

  // 1. Settings Sheet
  const settingsRows = [
    { Key: 'Max_Topics_Per_Resident', Value: workbookData.settings.maxTopicsPerResident, Description: 'Maximum number of topics a resident can select in step 2' },
    { Key: 'Min_Questions_Per_Topic', Value: workbookData.settings.minQuestionsPerTopic, Description: 'Minimum initial questions queued per topic' },
    { Key: 'Max_Questions_Per_Topic', Value: workbookData.settings.maxQuestionsPerTopic, Description: 'Maximum total questions per topic selected from bank' },
    { Key: 'Questions_Per_Topic_Selection_Limit', Value: 5, Description: 'Maximum questions resident selects from question bank per topic' },
    { Key: 'Default_Language', Value: workbookData.settings.defaultLanguage, Description: 'Default language code' },
    { Key: 'Version', Value: workbookData.settings.version || '3.3.0-QUESTION-BANK-SCHEMA', Description: 'Workbook schema version' }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(settingsRows), 'Settings');

  // 2. Profile Questions Sheet (Resident Profile Context)
  const profileRows = (workbookData.profileQuestions || []).map(pq => ({
    Question_ID: pq.questionId,
    Question_Text: pq.questionText,
    Help_Text: pq.helpText || '',
    Question_Type: pq.questionType,
    Options_Pipe_Separated: pq.optionsPipeSeparated || '',
    Required: pq.required ? 'YES' : 'NO',
    Display_Order: pq.displayOrder,
    Status: pq.status
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileRows), 'Profile_Questions');

  // 3. Topics Sheet
  const topicsRows = (workbookData.topics || []).map(t => ({
    Topic_ID: t.topicId,
    Topic_Name: t.topicName,
    Category: t.category,
    Description: t.description,
    Icon: t.icon,
    Display_Order: t.displayOrder,
    Status: t.status
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topicsRows), 'Topics');

  // 4. Questions Sheet (Clean & Direct with Individual Option Columns)
  const questionsRows = (workbookData.questions || []).map(q => {
    let optsList: string[] = [];
    if (q.optionsPipeSeparated) {
      optsList = q.optionsPipeSeparated.split('|').map(s => s.trim()).filter(Boolean);
    } else if (workbookData.options) {
      optsList = workbookData.options
        .filter(o => o.questionId === q.questionId && o.status === 'Active')
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(o => o.displayText);
    }

    const isRating = q.questionType === 'rating';
    if (optsList.length === 0 && isRating) {
      optsList = ['1 Star - Poor', '2 Stars - Below Average', '3 Stars - Average', '4 Stars - Good', '5 Stars - Excellent'];
    }

    const rowObj: any = {
      Question_ID: q.questionId,
      Topic_ID: q.topicId,
      Question_Text: q.questionText,
      Help_Text: q.helpText || '',
      Question_Type: q.questionType,
      Importance: q.importance || 'Medium',
      Is_Compulsory_Rating: isRating ? 'YES' : 'NO',
      Required: isRating ? 'YES' : 'NO',
      Display_Order: q.displayOrder,
      Status: q.status
    };

    // Add individual option columns Option_1 to Option_8
    for (let i = 0; i < 8; i++) {
      rowObj[`Option_${i + 1}`] = optsList[i] || '';
    }

    rowObj['Options_Pipe_Separated'] = optsList.join(' | ');

    return rowObj;
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(questionsRows), 'Questions');

  // 5. Report Sections Sheet (Exact 6 Sections required by AGENTS.md)
  const sectionRows = (workbookData.reportSections || []).map(sec => ({
    Section_ID: sec.sectionId,
    Section_Name: sec.sectionName,
    Description: sec.description || '',
    Display_Order: sec.displayOrder,
    Status: sec.status
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sectionRows), 'Report_Sections');

  // 6. Editorial Templates Sheet
  const templateRows = (workbookData.editorialTemplates || []).map(t => ({
    Template_ID: t.templateId,
    Topic_ID: (t as any).topicId || '',
    Section_ID: t.sectionId,
    Template_Text: t.templateText,
    Tone: t.tone || 'Conversational',
    Status: t.status
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(templateRows), 'Editorial_Templates');

  // 7. Conditional Logic Sheet
  const logicRows = (workbookData.conditionalRules || []).map(r => ({
    Rule_ID: r.ruleId,
    Source_Question_ID: r.sourceQuestionId,
    Operator: r.operator,
    Target_Answer_Value: r.targetAnswerValue,
    Action: r.action,
    Target_Question_ID: r.targetQuestionId,
    Description: r.description || ''
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logicRows), 'Conditional_Logic');

  // 8. Version History Sheet
  const versionRows = (workbookData.versionHistory || []).map(v => ({
    Workbook_Version: v.workbookVersion,
    Date: v.date,
    Author: v.author,
    Description: v.description,
    Notes: v.notes
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(versionRows), 'Version_History');

  const binaryBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(binaryBuffer);
}

export function downloadMasterEngineWorkbookFile(workbookData: MasterEngineWorkbook) {
  const binaryArray = generateDataDrivenMasterExcelWorkbook(workbookData);
  const blob = new Blob([binaryArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Resident_Intelligence_Master_Engine_Workbook_v${workbookData.settings.version || '3.2.0'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
