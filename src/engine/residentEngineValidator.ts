import { MasterEngineWorkbook, WorkbookValidationReport, ValidationErrorItem } from '../types/residentEngineTypes';

export function validateWorkbook(workbook: MasterEngineWorkbook): WorkbookValidationReport {
  const errorList: ValidationErrorItem[] = [];
  const summaryBySheet: Record<string, { errors: number; warnings: number; rowCount: number }> = {
    Settings: { errors: 0, warnings: 0, rowCount: 1 },
    Profile_Questions: { errors: 0, warnings: 0, rowCount: workbook.profileQuestions?.length || 0 },
    Topics: { errors: 0, warnings: 0, rowCount: workbook.topics?.length || 0 },
    Question_Sets: { errors: 0, warnings: 0, rowCount: workbook.questionSets?.length || 0 },
    Question_Groups: { errors: 0, warnings: 0, rowCount: workbook.questionGroups?.length || 0 },
    Questions: { errors: 0, warnings: 0, rowCount: workbook.questions?.length || 0 },
    Options: { errors: 0, warnings: 0, rowCount: workbook.options?.length || 0 },
    Conditional_Logic: { errors: 0, warnings: 0, rowCount: workbook.conditionalRules?.length || 0 },
    Scenario_Rules: { errors: 0, warnings: 0, rowCount: workbook.scenarioRules?.length || 0 },
    Report_Scenarios: { errors: 0, warnings: 0, rowCount: workbook.reportScenarios?.length || 0 },
    Report_Sections: { errors: 0, warnings: 0, rowCount: workbook.reportSections?.length || 0 },
    Editorial_Templates: { errors: 0, warnings: 0, rowCount: workbook.editorialTemplates?.length || 0 },
    Labels: { errors: 0, warnings: 0, rowCount: workbook.labels?.length || 0 },
    Translations: { errors: 0, warnings: 0, rowCount: workbook.translations?.length || 0 },
    Version_History: { errors: 0, warnings: 0, rowCount: workbook.versionHistory?.length || 0 }
  };

  const addIssue = (
    sheetName: string,
    rowIndex: number,
    field: string,
    severity: 'ERROR' | 'WARNING',
    errorCode: string,
    message: string,
    resolutionTip: string
  ) => {
    errorList.push({
      sheetName,
      rowIndex,
      field,
      severity,
      errorCode,
      message,
      resolutionTip
    });

    if (summaryBySheet[sheetName]) {
      if (severity === 'ERROR') summaryBySheet[sheetName].errors++;
      else summaryBySheet[sheetName].warnings++;
    }
  };

  // 1. Settings Sheet Validation
  if (!workbook.settings) {
    addIssue('Settings', 1, 'Settings', 'ERROR', 'MISSING_SETTINGS', 'Settings object is missing.', 'Provide a Settings sheet with basic configuration key-values.');
  } else {
    if (workbook.settings.maxTopicsPerResident <= 0) {
      addIssue('Settings', 2, 'maxTopicsPerResident', 'ERROR', 'INVALID_SETTING', 'maxTopicsPerResident must be greater than 0.', 'Set maxTopicsPerResident to a positive integer e.g., 5.');
    }
  }

  // 2. Profile Questions Sheet Validation
  const profileQuestionIdSet = new Set<string>();
  (workbook.profileQuestions || []).forEach((pq, index) => {
    const rowNum = index + 2;
    if (!pq.questionId || !pq.questionId.trim()) {
      addIssue('Profile_Questions', rowNum, 'Question_ID', 'ERROR', 'EMPTY_PROFILE_Q_ID', 'Profile Question ID is empty.', 'Assign a unique Question_ID e.g., PQ_YEARS_LIVING.');
    } else {
      if (profileQuestionIdSet.has(pq.questionId)) {
        addIssue('Profile_Questions', rowNum, 'Question_ID', 'ERROR', 'DUPLICATE_PROFILE_Q_ID', `Duplicate Profile Question ID "${pq.questionId}".`, 'Ensure all Profile Question IDs are unique.');
      }
      profileQuestionIdSet.add(pq.questionId);
    }

    if (!pq.questionText || !pq.questionText.trim()) {
      addIssue('Profile_Questions', rowNum, 'Question_Text', 'ERROR', 'EMPTY_PROFILE_Q_TEXT', 'Profile Question Text is required.', 'Enter the question text e.g., "How many years have you been living in this society?".');
    }
  });

  // 3. Topics Sheet Validation
  const topicIdSet = new Set<string>();
  const topicDisplayOrders = new Set<number>();

  (workbook.topics || []).forEach((t, index) => {
    const rowNum = index + 2;
    if (!t.topicId || !t.topicId.trim()) {
      addIssue('Topics', rowNum, 'Topic_ID', 'ERROR', 'EMPTY_TOPIC_ID', 'Topic ID is empty or whitespace.', 'Provide a unique alphanumeric Topic ID e.g., TOP_WATER.');
    } else {
      if (topicIdSet.has(t.topicId)) {
        addIssue('Topics', rowNum, 'Topic_ID', 'ERROR', 'DUPLICATE_TOPIC_ID', `Duplicate Topic ID "${t.topicId}" found.`, 'Ensure every topic has a unique Topic ID.');
      }
      topicIdSet.add(t.topicId);
    }

    if (!t.topicName || !t.topicName.trim()) {
      addIssue('Topics', rowNum, 'Topic_Name', 'ERROR', 'EMPTY_TOPIC_NAME', 'Topic Name is required.', 'Enter a descriptive title for this topic.');
    }

    if (topicDisplayOrders.has(t.displayOrder)) {
      addIssue('Topics', rowNum, 'Display_Order', 'WARNING', 'DUPLICATE_TOPIC_DISPLAY_ORDER', `Topic display order ${t.displayOrder} is duplicated.`, 'Use unique numbers for Display Order to control topic sequence.');
    } else {
      topicDisplayOrders.add(t.displayOrder);
    }
  });

  // 4. Question Sets Sheet Validation
  const questionSetIdSet = new Set<string>();
  (workbook.questionSets || []).forEach((qs, index) => {
    const rowNum = index + 2;
    if (!qs.questionSetId || !qs.questionSetId.trim()) {
      addIssue('Question_Sets', rowNum, 'Question_Set_ID', 'ERROR', 'EMPTY_QUESTION_SET_ID', 'Question Set ID is empty.', 'Assign a unique Question_Set_ID e.g., QS_WATER_BASIC.');
    } else {
      if (questionSetIdSet.has(qs.questionSetId)) {
        addIssue('Question_Sets', rowNum, 'Question_Set_ID', 'ERROR', 'DUPLICATE_QUESTION_SET_ID', `Duplicate Question Set ID "${qs.questionSetId}".`, 'Ensure every Question Set ID is distinct.');
      }
      questionSetIdSet.add(qs.questionSetId);
    }

    if (!qs.topicId || !topicIdSet.has(qs.topicId)) {
      addIssue('Question_Sets', rowNum, 'Topic_ID', 'ERROR', 'INVALID_TOPIC_REF_IN_SET', `Question Set references non-existent Topic ID "${qs.topicId}".`, 'Check Topics sheet and link to a valid Topic_ID.');
    }
  });

  // 5. Question Groups Sheet Validation
  const questionGroupIdSet = new Set<string>();
  (workbook.questionGroups || []).forEach((qg, index) => {
    const rowNum = index + 2;
    if (!qg.questionGroupId || !qg.questionGroupId.trim()) {
      addIssue('Question_Groups', rowNum, 'Question_Group_ID', 'ERROR', 'EMPTY_QUESTION_GROUP_ID', 'Question Group ID is empty.', 'Assign a unique Question_Group_ID e.g., QG_WATER_PRESSURE.');
    } else {
      if (questionGroupIdSet.has(qg.questionGroupId)) {
        addIssue('Question_Groups', rowNum, 'Question_Group_ID', 'ERROR', 'DUPLICATE_QUESTION_GROUP_ID', `Duplicate Question Group ID "${qg.questionGroupId}".`, 'Ensure every Question Group ID is distinct.');
      }
      questionGroupIdSet.add(qg.questionGroupId);
    }

    if (!qg.questionSetId || !questionSetIdSet.has(qg.questionSetId)) {
      addIssue('Question_Groups', rowNum, 'Question_Set_ID', 'ERROR', 'INVALID_SET_REF_IN_GROUP', `Question Group references non-existent Question Set ID "${qg.questionSetId}".`, 'Check Question_Sets sheet and link to a valid Question_Set_ID.');
    }
  });

  // 6. Questions Sheet Validation
  const questionIdSet = new Set<string>();
  (workbook.questions || []).forEach((q, index) => {
    const rowNum = index + 2;
    if (!q.questionId || !q.questionId.trim()) {
      addIssue('Questions', rowNum, 'Question_ID', 'ERROR', 'EMPTY_QUESTION_ID', 'Question ID is required.', 'Assign a unique Question ID e.g., Q_WATER_01.');
    } else {
      if (questionIdSet.has(q.questionId)) {
        addIssue('Questions', rowNum, 'Question_ID', 'ERROR', 'DUPLICATE_QUESTION_ID', `Duplicate Question ID "${q.questionId}" found.`, 'Change this Question ID to be unique across all topics.');
      }
      questionIdSet.add(q.questionId);
    }

    if (!q.topicId || !topicIdSet.has(q.topicId)) {
      addIssue('Questions', rowNum, 'Topic_ID', 'ERROR', 'INVALID_TOPIC_REF', `Question references non-existent Topic ID "${q.topicId}".`, 'Ensure Topic ID matches an active topic in the Topics sheet.');
    }

    if (q.questionSetId && !questionSetIdSet.has(q.questionSetId)) {
      addIssue('Questions', rowNum, 'Question_Set_ID', 'WARNING', 'INVALID_SET_REF', `Question references non-existent Question Set ID "${q.questionSetId}".`, 'Link question to a valid Question Set ID in Question_Sets sheet.');
    }

    if (q.questionGroupId && !questionGroupIdSet.has(q.questionGroupId)) {
      addIssue('Questions', rowNum, 'Question_Group_ID', 'WARNING', 'INVALID_GROUP_REF', `Question references non-existent Question Group ID "${q.questionGroupId}".`, 'Link question to a valid Question Group ID in Question_Groups sheet.');
    }

    if (!['Critical', 'High', 'Medium', 'Low'].includes(q.importance)) {
      addIssue('Questions', rowNum, 'Importance', 'WARNING', 'INVALID_IMPORTANCE', `Importance value "${q.importance}" is not standard.`, 'Use Critical, High, Medium, or Low for importance rating.');
    }

    if (!q.questionText || !q.questionText.trim()) {
      addIssue('Questions', rowNum, 'Question_Text', 'ERROR', 'EMPTY_QUESTION_TEXT', 'Question Text is required.', 'Fill in the prompt question shown to residents.');
    }
  });

  // 7. Options Sheet Validation
  const optionIdSet = new Set<string>();
  const optionKeySet = new Set<string>();

  (workbook.options || []).forEach((opt, index) => {
    const rowNum = index + 2;
    if (!opt.optionId || !opt.optionId.trim()) {
      addIssue('Options', rowNum, 'Option_ID', 'ERROR', 'EMPTY_OPTION_ID', 'Option ID is required.', 'Specify a unique Option ID e.g., OPT_W1_YES.');
    } else {
      if (optionIdSet.has(opt.optionId)) {
        addIssue('Options', rowNum, 'Option_ID', 'ERROR', 'DUPLICATE_OPTION_ID', `Duplicate Option ID "${opt.optionId}" found.`, 'Ensure each answer option ID is distinct.');
      }
      optionIdSet.add(opt.optionId);
    }

    if (!opt.optionKey || !opt.optionKey.trim()) {
      addIssue('Options', rowNum, 'Option_Key', 'WARNING', 'EMPTY_OPTION_KEY', 'Option Key is missing.', 'Provide a stable internal Option_Key e.g. OPT_KEY_YES.');
    } else {
      optionKeySet.add(opt.optionKey);
    }

    if (!opt.questionId || !questionIdSet.has(opt.questionId)) {
      addIssue('Options', rowNum, 'Question_ID', 'ERROR', 'INVALID_QUESTION_REF', `Option references non-existent Question ID "${opt.questionId}".`, 'Check the Questions sheet and link to a valid Question ID.');
    }

    if (!opt.displayText || !opt.displayText.trim()) {
      addIssue('Options', rowNum, 'Display_Text', 'ERROR', 'EMPTY_OPTION_TEXT', 'Option Display Text is required.', 'Provide user-facing answer text.');
    }
  });

  // 8. Conditional Logic Sheet Validation
  const conditionalRuleIdSet = new Set<string>();
  (workbook.conditionalRules || []).forEach((rule, index) => {
    const rowNum = index + 2;
    if (!rule.ruleId || !rule.ruleId.trim()) {
      addIssue('Conditional_Logic', rowNum, 'Rule_ID', 'ERROR', 'EMPTY_RULE_ID', 'Rule ID is required.', 'Provide a rule ID e.g., COND_SKIP_W1.');
    } else {
      if (conditionalRuleIdSet.has(rule.ruleId)) {
        addIssue('Conditional_Logic', rowNum, 'Rule_ID', 'ERROR', 'DUPLICATE_RULE_ID', `Duplicate Rule ID "${rule.ruleId}".`, 'Use unique Rule IDs.');
      }
      conditionalRuleIdSet.add(rule.ruleId);
    }

    if (!rule.sourceQuestionId || !questionIdSet.has(rule.sourceQuestionId)) {
      addIssue('Conditional_Logic', rowNum, 'Source_Question_ID', 'ERROR', 'INVALID_SOURCE_Q', `Rule references unknown source Question ID "${rule.sourceQuestionId}".`, 'Match against a valid Question ID in the Questions sheet.');
    }

    if (rule.targetQuestionId && !questionIdSet.has(rule.targetQuestionId)) {
      addIssue('Conditional_Logic', rowNum, 'Target_Question_ID', 'ERROR', 'INVALID_TARGET_Q', `Rule references unknown target Question ID "${rule.targetQuestionId}".`, 'Match against a valid Question ID in the Questions sheet.');
    }

    if (rule.sourceQuestionId === rule.targetQuestionId) {
      addIssue('Conditional_Logic', rowNum, 'Target_Question_ID', 'ERROR', 'CIRCULAR_RULE', `Rule source and target Question ID are identical (${rule.sourceQuestionId}).`, 'A question cannot trigger a conditional replacement on itself.');
    }
  });

  // 9. Report Scenarios Sheet Validation
  const scenarioIdSet = new Set<string>();
  (workbook.reportScenarios || []).forEach((sc, index) => {
    const rowNum = index + 2;
    if (!sc.scenarioId || !sc.scenarioId.trim()) {
      addIssue('Report_Scenarios', rowNum, 'Scenario_ID', 'ERROR', 'EMPTY_SCENARIO_ID', 'Scenario ID is required.', 'Enter a unique Scenario ID e.g., SCN_WATER_NORMAL.');
    } else {
      if (scenarioIdSet.has(sc.scenarioId)) {
        addIssue('Report_Scenarios', rowNum, 'Scenario_ID', 'ERROR', 'DUPLICATE_SCENARIO_ID', `Duplicate Scenario ID "${sc.scenarioId}".`, 'Make Scenario IDs unique.');
      }
      scenarioIdSet.add(sc.scenarioId);
    }

    if (!sc.topicId || !topicIdSet.has(sc.topicId)) {
      addIssue('Report_Scenarios', rowNum, 'Topic_ID', 'ERROR', 'INVALID_SCENARIO_TOPIC', `Scenario references non-existent Topic ID "${sc.topicId}".`, 'Link scenario to a valid Topic ID.');
    }
  });

  // 10. Scenario Rules Sheet Validation
  (workbook.scenarioRules || []).forEach((sr, index) => {
    const rowNum = index + 2;
    if (!sr.scenarioId || !scenarioIdSet.has(sr.scenarioId)) {
      addIssue('Scenario_Rules', rowNum, 'Scenario_ID', 'ERROR', 'INVALID_SCENARIO_REF_IN_RULE', `Scenario Rule references non-existent Scenario ID "${sr.scenarioId}".`, 'Check Report_Scenarios sheet and link to a valid Scenario_ID.');
    }

    if (!sr.questionId || !questionIdSet.has(sr.questionId)) {
      addIssue('Scenario_Rules', rowNum, 'Question_ID', 'ERROR', 'INVALID_QUESTION_REF_IN_SCENARIO_RULE', `Scenario Rule references non-existent Question ID "${sr.questionId}".`, 'Check Questions sheet and link to a valid Question_ID.');
    }

    if (!['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'IN', 'GREATER_THAN', 'LESS_THAN', 'IS_SKIPPED', 'IS_ANSWERED'].includes(sr.operator)) {
      addIssue('Scenario_Rules', rowNum, 'Operator', 'WARNING', 'UNKNOWN_OPERATOR', `Scenario Rule operator "${sr.operator}" is non-standard.`, 'Use EQUALS, NOT_EQUALS, CONTAINS, IN, GREATER_THAN, LESS_THAN, IS_SKIPPED, or IS_ANSWERED.');
    }
  });

  // 11. Report Sections Sheet Validation
  const reportSectionIdSet = new Set<string>();
  (workbook.reportSections || []).forEach((sec, index) => {
    const rowNum = index + 2;
    if (!sec.sectionId || !sec.sectionId.trim()) {
      addIssue('Report_Sections', rowNum, 'Section_ID', 'ERROR', 'EMPTY_SECTION_ID', 'Section ID is empty.', 'Provide a unique Section_ID e.g., SEC_OPENING.');
    } else {
      if (reportSectionIdSet.has(sec.sectionId)) {
        addIssue('Report_Sections', rowNum, 'Section_ID', 'ERROR', 'DUPLICATE_SECTION_ID', `Duplicate Section ID "${sec.sectionId}".`, 'Ensure all Report Section IDs are distinct.');
      }
      reportSectionIdSet.add(sec.sectionId);
    }
  });

  // 12. Editorial Templates Sheet Validation
  (workbook.editorialTemplates || []).forEach((tmpl, index) => {
    const rowNum = index + 2;
    if (tmpl.scenarioId && scenarioIdSet.size > 0 && !scenarioIdSet.has(tmpl.scenarioId)) {
      addIssue('Editorial_Templates', rowNum, 'Scenario_ID', 'WARNING', 'INVALID_SCENARIO_REF_IN_TMPL', `Template references unknown Scenario ID "${tmpl.scenarioId}".`, 'Check Report_Scenarios sheet and match a valid Scenario_ID.');
    }

    if (tmpl.sectionId && reportSectionIdSet.size > 0 && !reportSectionIdSet.has(tmpl.sectionId)) {
      addIssue('Editorial_Templates', rowNum, 'Section_ID', 'WARNING', 'INVALID_SECTION_REF', `Template references unknown Section ID "${tmpl.sectionId}".`, 'Link template to a valid Section_ID in Report_Sections sheet.');
    }

    if (!tmpl.templateText || !tmpl.templateText.trim()) {
      addIssue('Editorial_Templates', rowNum, 'Template_Text', 'ERROR', 'EMPTY_TEMPLATE_TEXT', 'Editorial Template text is required.', 'Write the narrative template text.');
    }
  });

  const totalErrors = errorList.filter(e => e.severity === 'ERROR').length;
  const totalWarnings = errorList.filter(e => e.severity === 'WARNING').length;

  return {
    isValid: totalErrors === 0,
    totalErrors,
    totalWarnings,
    errorList,
    summaryBySheet
  };
}
