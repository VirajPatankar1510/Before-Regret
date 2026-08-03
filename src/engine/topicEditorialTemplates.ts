import { ExcelEditorialTemplate } from '../types/residentEngineTypes';

export function getTopicEditorialTemplates(
  topicId: string,
  topicTitle: string,
  defaultScenarioId: string,
  criticalScenarioId: string
): ExcelEditorialTemplate[] {
  const templates: ExcelEditorialTemplate[] = [];

  const addTmpl = (
    tmplId: string,
    secId: string,
    scnId: string,
    tone: 'Conversational' | 'Direct' | 'Detailed' | 'Neutral',
    text: string
  ) => {
    templates.push({
      templateId: tmplId,
      sectionId: secId,
      scenarioId: scnId,
      variationNumber: 1,
      language: 'en-IN',
      tone,
      templateText: text,
      status: 'Active'
    });
  };

  const idUpper = topicId.toUpperCase().replace(/[^A-Z0-9]/g, '_');

  switch (topicId) {
    case 'water':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, water supply is highlighted as a core operational utility for prospective buyers to evaluate. Current feedback indicates that while baseline supply is generally available, peak usage periods can experience pressure variations.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, water pressure levels vary across different floors and supply cycles. For everyday living, this means households on higher levels or with concurrent morning usage may experience fluctuations in tap flow.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Residents who responded favorably noted that scheduled storage tank maintenance and periodic quality checks are conducted, helping maintain baseline supply cleanliness.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Based on resident input, buyers should verify whether the unit relies primarily on municipal lines or supplementary tanker supply, as tanker dependency during dry seasons can impact recurring maintenance costs.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Resident responses indicate that hard water mineral accumulation on fixtures and appliances remains a reported concern, requiring periodic maintenance or filtration solutions.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Available resident feedback suggests that water conditions are manageable when prospective buyers inspect pressure levels and plan for appropriate filtration systems prior to moving in.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident responses demonstrate that while water availability is functional, buyers should check floor-level pressure and supply arrangements before finalizing a purchase.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, water supply constraints represent a major operational concern requiring active household management.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that supply rationing or scheduled restrictions occur during high-demand periods. For daily life, households without adequate internal storage capacity face noticeable disruption during peak hours.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that emergency tanker arrangements are deployed by facility staff during supply interruptions to maintain baseline sanitation needs.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available resident responses, prospective buyers should review historical society water expenditure and verify whether alternative supply infrastructure or harvesting systems exist.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Feedback from residents highlights persistent concerns with high mineral content in supplementary supply, which accelerates plumbing wear and appliance scaling.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Current resident feedback indicates that buyers should request recent utility billing records and inspect filtration options before committing to a flat in this society.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, resident responses show that water management requires careful pre-purchase verification and budgeting for seasonal supply variations.`
      );
      break;

    case 'parking':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, parking allocation and basement navigation directly influence daily convenience for vehicle owners.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, navigating parking bays during peak departure and arrival hours requires careful maneuvering due to spatial constraints and aisle clearance.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents noted that assigned parking slots are designated and monitored by security personnel, preventing unauthorized vehicle occupancy in resident spaces.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that buyers should physically inspect the exact allocated parking slot prior to purchase, checking overhead clearance, pillar positioning, and proximity to utility pipes.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents indicates that visitor parking capacity is limited, which can create access friction and require guests to seek external parking options.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Based on resident input, parking satisfaction remains high provided a designated covered slot is explicitly tied to the property agreement.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, available resident feedback confirms that confirming designated parking slot registration is a critical step during property negotiations.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, parking congestion and slot shortages represent a frequent source of resident dissatisfaction.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that unassigned parking arrangements and aisle obstruction lead to delays during morning departure hours.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents reported that security staff attempt to coordinate vehicle movements and manage parking logs to alleviate congestion.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, buyers with multiple vehicles should verify second-car parking policies in writing, as unassigned slots are subject to limited availability or waiting lists.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights tight pillar spacing and narrow driveways, which increase the risk of minor vehicle scratches during parking maneuvers.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses suggest that multi-vehicle households should secure explicit parking documentation before concluding sale terms.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses underscores the importance of verifying physical parking boundaries and society allocation rules prior to purchase.`
      );
      break;

    case 'maintenance':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, facility management responsiveness plays a major role in overall residential satisfaction.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, routine common area cleaning and daily maintenance occur regularly, though individual apartment service requests may require formal ticketing and follow-up.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents highlighted the upkeep of shared areas, landscaping, and main entrances as positive factors in society maintenance.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that prospective buyers should clarify what services are covered under the standard monthly maintenance fee versus those billed separately.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents indicates that maintenance dispatch during weekends or off-peak hours can experience delays due to reduced staff availability.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident feedback suggests that maintenance standards align with recurring fee structures, provided residents maintain direct contacts for urgent internal repairs.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident responses show that facility management maintains common areas effectively, while internal repairs benefit from clear resident follow-up.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, persistent maintenance delays and facility response lags represent key operational challenges.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that resolving in-flat plumbing or electrical issues often requires repeated reminders to the administrative office.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that housekeeping personnel work diligently to maintain main entrance lobbies despite operational constraints.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available resident responses, prospective buyers should inspect common corridors, stairwells, and shared facilities for visible maintenance backlogs.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights vendor turnover and delayed repairs in shared amenities as recurring areas of concern.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses suggest that buyers should factor in personal oversight and independent technician assistance for internal apartment upkeep.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses demonstrates that buyers should evaluate society maintenance logs and clear pending dues before finalizing purchase terms.`
      );
      break;

    case 'committee':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, society governance and committee administration establish the operational rules for the community.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, the managing committee enforces established guidelines regarding remodeling timelines, noise limits, and move-in procedures.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents appreciated the publication of financial reports and formal meeting notes, which support administrative transparency.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses indicate that buyers planning interior renovations should review society approval procedures, deposit requirements, and permitted work hours in advance.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents notes that strict enforcement of community rules can occasionally feel rigid for newly arrived residents.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident responses suggest that structured governance maintains orderly living conditions and protects long-term community standards.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident feedback advises prospective buyers to review society bye-laws to ensure compliance expectations align with their lifestyle.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, administrative delays and governance friction represent noticeable challenges for residents.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that obtaining formal approvals for flat modifications, tenant documentation, or facility requests can involve lengthy processing times.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents acknowledged the efforts of volunteer resident sub-committees in organizing community events and addressing neighborhood concerns.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, buyers should verify whether there are unresolved administrative disputes or developer hand-over issues in society records.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights concerns regarding arbitrary penalty notices or inconsistent rule enforcement across different towers.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses advise buyers to speak directly with current occupants to understand active committee dynamics and planned capital assessments.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses shows that buyers should secure all required society documentation and clearances well before property handover.`
      );
      break;

    case 'noise':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, ambient noise levels vary depending on apartment orientation and proximity to external roads.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, units facing outer thoroughfares experience ongoing traffic sound, whereas interior court-facing units remain significantly quieter.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents reported that designated quiet hours during night times are generally respected by community members.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that prospective buyers should evaluate window sound insulation and inspect room noise levels during peak traffic hours.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents indicates that inter-floor sound transmission, such as footsteps or moving furniture, can occasionally be heard in adjacent units.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident responses show that acoustic satisfaction is high for units situated away from main roadways and high-activity common zones.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident feedback highlights that selecting an internally oriented unit significantly enhances acoustic comfort.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, external traffic and surrounding activity create persistent acoustic disruptions.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that ambient noise from neighboring developments or main roads affects indoor concentration during daytime hours.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that high-quality window latching and acoustic window upgrades effectively help dampen exterior sound when closed.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, buyers should investigate potential future construction on adjacent plots that could impact noise levels.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights weekend social activity near common recreational areas as an occasional source of noise for lower-floor units.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses advise noise-sensitive buyers to prioritize higher floors or interior-facing layouts within the complex.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses demonstrates the importance of testing sound levels with windows open and closed before purchase.`
      );
      break;

    case 'monsoon-issues':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, heavy rainfall tests internal drainage infrastructure and exterior building waterproofing.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, internal stormwater channels manage heavy rain effectively, though surrounding access roads may experience temporary water pooling.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents noted that basement drainage pumps and perimeter drains are inspected prior to rainy seasons to mitigate flooding risks.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses recommend that buyers inspect top-floor roof sealings and exterior window joints for signs of moisture penetration prior to closing.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents indicates that severe storms with power fluctuations can trigger temporary elevator safety holds, requiring brief stair use.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident responses suggest that society drainage preparedness is generally adequate to protect residential structures and parking areas.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident feedback confirms that inspecting window sills and balcony drainage is a prudent pre-purchase step.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, severe monsoon downpours lead to recurring drainage backups and seepage concerns.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that waterlogging near primary entrance gates impairs pedestrian and vehicular access during heavy rainfall events.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents reported that maintenance teams utilize dewatering equipment to clear accumulated water from critical access points.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, prospective buyers should examine basement parking columns and upper-floor ceilings for water stain marks.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights exterior wall seepage during prolonged rain, which can affect interior wall paint in weather-exposed rooms.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses recommend that buyers ensure necessary waterproofing repairs are completed by sellers before taking possession.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses shows that monsoon resilience requires physical structural verification before finalizing a purchase.`
      );
      break;

    case 'electricity':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, power stability and backup generator coverage are critical factors for daily living and work continuity.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, grid power supply remains stable overall, with occasional brief outages during regional utility maintenance.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents noted that automated generator backup initiates quickly following grid failures, restoring power to common areas, lifts, and key home circuits.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that buyers should verify the exact wattage load and specific appliances supported under the flat's backup generator allocation.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents indicates that generator power usage during extended grid cuts incurs higher per-unit operational charges billed through dual metering systems.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident feedback confirms that reliable backup power switchover prevents major disruption during unexpected grid interruptions.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident input shows that checking backup power load limits ensures uninterrupted daily operations for remote work and household needs.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, frequent power trips and restricted backup capacity represent significant resident concerns during peak demand periods.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that voltage fluctuations during peak seasons cause power instability and affect heavy home appliance operation.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that maintenance technicians maintain spare electrical components on site to address localized line faults.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, buyers should be aware that backup power may be restricted to basic lighting and refrigeration, excluding heavy air conditioning load.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights high recurring charges for generator fuel during extended power disruptions as a financial frustration.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses advise prospective buyers to consider installing supplementary in-flat inverter systems for delicate electronics and work continuity.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses indicates that buyers should verify backup load constraints and budget for internal power backup solutions if required.`
      );
      break;

    case 'daily-convenience':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, access to doorstep delivery services and visitor gate entry forms an integral part of daily living.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, delivery personnel access the premises smoothly using digital visitor pre-approvals managed through security gate protocols.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents highlighted the presence of designated parcel holding areas near entrance lobbies, ensuring secure package retention when residents are away.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that ride-hailing services find main entrance access straightforward, though guiding drivers to specific tower drop-offs may occasionally be required.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents notes that peak evening delivery hours can create brief queues at security gates, slightly slowing entry for resident vehicles.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident responses indicate high satisfaction with daily delivery logistics, making routine household procurement efficient.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident feedback demonstrates that digital gate authorization and package management support smooth everyday convenience.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, delivery access restrictions and gate security protocols create noticeable daily friction.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that delivery personnel are restricted to main gate areas or specific parking zones, increasing transit times to individual towers.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents appreciated that strict gate verification prevents unauthorized personnel from entering residential corridors unannounced.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, buyers should note that large parcel or furniture deliveries require advance gate pass authorization from administrative staff.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights congestion at the primary security gate during peak evening hours, causing entry delays.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses suggest that residents adapt by coordinating delivery handovers at lobby access points or designated drop zones.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses shows that security gate procedures enhance safety but require residents to accommodate minor delivery delays.`
      );
      break;

    case 'hidden-charges':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, understanding the complete recurring cost structure involves evaluating maintenance fees alongside additional society levies.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, routine monthly maintenance charges are predictable, while occasional administrative fees or community levies require advance planning.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents noted that society financial demands are formally documented in regular billing statements, providing line-item clarity.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses indicate that buyers should budget for one-time move-in or transfer fees, as well as refundable security deposits required for flat alterations.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents highlights periodic maintenance fee adjustments enacted to cover inflation in operational and utility expenditures.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident feedback indicates that overall financial transparency is maintained through documented accounting records presented to owners.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident input advises buyers to review recent maintenance bills and society financial statements before finalizing purchase terms.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, recurring ad-hoc collections and unannounced special assessments represent a notable source of resident concern.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that special fund collections for major infrastructure repairs or utility shortfalls are periodically added to quarterly bills.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that financial statements are presented during general body meetings, allowing owners to review expenditure details.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, buyers should examine the reserve fund status, as depleted reserves increase the likelihood of future per-flat capital contributions.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights delays in processing move-out deposit refunds following tenancy turnover.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses strongly advise buyers to insist on a seller-provided No Dues Certificate confirming all historical society levies are fully settled.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses shows that thorough review of historical society accounts and reserve balances is essential prior to buying.`
      );
      break;

    case 'community-culture':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, the social environment and resident demographics shape the community atmosphere.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, the community comprises working professionals, families, and senior citizens, creating a polite and peaceful neighborhood setting.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents highlighted organized community celebrations and cultural gatherings in shared spaces as positive aspects of social cohesion.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that active communication channels exist for local interest groups and recommendations, helping new residents integrate easily.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents notes that major festival events or evening gatherings in common areas can temporarily increase noise and activity levels.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident feedback indicates that a cooperative neighborly environment provides a supportive setting for families.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident input demonstrates that balanced resident demographics foster an engaging and respectful community culture.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, social friction and differing expectations between resident groups require careful navigation.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that discussions regarding amenity rules, festival budgets, or policy enforcement can lead to active debates on community forums.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that residents come together reliably during personal emergencies to support fellow community members.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, single professionals or tenants should verify specific society guidelines regarding verification procedures and rule compliance.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights overly vocal online group discussions regarding minor neighborhood disputes as a frequent annoyance.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses suggest that focusing on direct floor-level interactions while utilizing official administrative channels maintains personal peace.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses advises buyers to engage with immediate neighbors to understand real day-to-day community dynamics.`
      );
      break;

    case 'child-safety':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, child safety features and dedicated play spaces represent a key priority for family households.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, dedicated vehicle-free play zones allow children to engage in recreational activities without traffic hazards.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents appreciated protective surfacing in play areas and perimeter security monitoring that ensures children remain within designated zones.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses note that peak evening play hours see high activity, with children of various age groups sharing recreational spaces.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents indicates that during rain heavy periods, outdoor play areas remain wet, shifting recreational activity indoors.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident feedback shows that secure play environments and vehicular separation offer valuable peace of mind for parents.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident responses confirm that vehicle-free play areas and security surveillance make the society well-suited for families.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, vehicular movement near ground-level driveways requires continuous parental vigilance.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that delivery vehicles or resident cars entering driveway ramps occasionally move at speeds requiring extra caution near access gates.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted resident efforts to request additional traffic calming measures and safety mirrors around driveway corners.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, parents are advised to guide children toward elevated or designated play zones away from vehicle ramps.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights aging play equipment and delayed maintenance turnarounds as areas needing improvement.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses indicate that while dedicated play spaces exist, parental supervision remains important near driveway intersection points.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses demonstrates that buyers with young children should verify direct access paths to vehicle-free play areas.`
      );
      break;

    case 'pet-friendliness':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, society pet rules determine daily walking routines and shared space protocols.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, pet owners utilize designated walking paths around the perimeter, with leash compliance enforced in common areas.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents highlighted the presence of designated service elevators for pets and service personnel, reducing elevator crowding.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses indicate that pet owners must register their animals with society management and maintain updated vaccination records upon move-in.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents notes occasional neighbor friction regarding noise during afternoon hours or failure to clean up waste in shared spaces.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident feedback shows that adhering to designated guidelines maintains a workable balance between pet owners and other residents.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident input confirms that clear pet protocols and perimeter walking areas support comfortable co-existence.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, strict pet restrictions and active enforcement create friction between pet owners and non-pet residents.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that pet access is restricted in central lawns and main passenger lifts, directing pet walks to outer service areas.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that pet owners form informal networks to coordinate walking routines and share local pet care recommendations.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, prospective buyers should review society pet bye-laws prior to purchase to ensure compliance with size or quantity rules.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights monetary penalties for off-leash walking or noise complaints as a source of tension.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses suggest that pet owners who follow service elevator rules and designated walking paths find daily routines manageable.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses indicates that buyers should thoroughly review society pet regulations before finalizing agreements.`
      );
      break;

    case 'things-i-wish-i-knew':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, long-term occupancy reveals practical aspects of daily living that go beyond initial property tours.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, overall living satisfaction depends heavily on indoor mobile signal coverage and elevator wait times during rush hours.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents noted that location accessibility—proximity to essential markets, schools, and medical facilities—provides lasting everyday value.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses advise buyers to test mobile network reception across interior rooms during property walkthroughs.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents highlights mobile coverage dead zones in lower basement levels as a minor inconvenience when attending calls.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident feedback indicates that strong location connectivity and community security outweigh minor operational quirks.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident input demonstrates that testing mobile connectivity and peak-hour elevator availability ensures a well-informed buying decision.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, several key operational factors require independent verification before committing to a purchase.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that surrounding road drainage during heavy rains and peak-hour traffic bottlenecks at nearby junctions affect daily commute times.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents emphasized that perimeter security controls provide dependable physical safety for vacant apartments and families.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, buyers are advised to visit the society during both peak weekday morning hours and weekend evenings to observe real conditions.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights administrative gate registration delays for domestic staff during initial move-in periods.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses emphasize that thorough independent property review regarding utilities and parking allocation prevents unexpected post-move surprises.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses proves that conducting firsthand checks during peak hours is essential for a regret-free purchase.`
      );
      break;

    case 'lift-reliability':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, elevator performance and uptime directly affect daily commute convenience, particularly for upper-floor residents.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, elevators handle routine demand smoothly, though peak morning hours experience increased wait times as residents leave simultaneously.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents noted that active maintenance service contracts ensure prompt technician response during operational glitches.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that buyers considering upper-floor units should confirm the ratio of elevators to flats per tower and verify service lift availability.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents indicates that when an elevator is temporarily reserved for moving or maintenance, remaining lift wait times become noticeably longer.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident feedback confirms that dedicated backup power integration keeps elevators operational during power outages.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident input shows that checking elevator maintenance history and backup power connections ensures comfortable high-rise living.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, frequent elevator stoppages and extended peak-hour wait times represent a primary resident complaint.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that elevator maintenance holds during morning rush hours create noticeable delays for school and work commutes.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that security personnel assist senior residents with heavy items when elevators undergo scheduled servicing.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, senior buyers or families with young children should consider lower or mid-level floors to minimize disruption during outages.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights delayed component replacements during major elevator repairs, leaving single lifts in service for multi-day periods.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses recommend inspecting elevator service logs displayed in tower lobbies prior to committing to a high-floor apartment.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses demonstrates that elevator age, maintenance logs, and backup switchover speed should be thoroughly reviewed.`
      );
      break;

    case 'domestic-help':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, domestic help availability and verification procedures significantly influence household management.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, finding experienced domestic helpers for cleaning, cooking, or childcare is straightforward due to an established pool of workers.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents highlighted mandatory gate registration and identity verification as reassuring safety measures for working families.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses indicate that helper tariffs are governed by local resident consensus, making standard rates non-negotiable across the society.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents notes that holiday periods or seasonal festival leave can lead to temporary domestic help absenteeism.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident feedback confirms that domestic help availability simplifies routine household upkeep for working couples.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident responses demonstrate that digital gate authorization and established helper networks support reliable household management.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, securing reliable domestic help can be challenging due to high demand and strict local rate structures.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that domestic helper charges in the society are higher than in surrounding areas, with helpers enforcing task limits.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that gate entry apps accurately log helper entry and exit times, notifying residents directly on their phones.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, buyers should request helper references from immediate floor neighbors early, as experienced staff are often fully booked.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights sudden helper turnover without prior notice as a frustrating experience requiring trial replacements.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses suggest that leveraging neighbor recommendations and offering prevailing local rates ensures consistent domestic support.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses advises buyers to budget for prevailing helper tariffs and connect with neighbor networks upon move-in.`
      );
      break;

    case 'rent-history':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, rental market dynamics, landlord relations, and tenancy terms follow established community patterns.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, rental demand remains steady, with standard lease renewals specifying agreed annual escalation rates.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents noted that tenant onboarding is facilitated through online society documentation portals, streamlining NOC approvals.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that property investors benefit from consistent tenant demand and manageable vacancy periods between leases.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents notes that landlords occasionally apply standard deductions for painting or touch-ups upon lease completion.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident responses indicate that transparent society NOC guidelines make both renting and leasing property straightforward.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident input confirms that standardized agreements and digital NOC processes support a stable rental environment.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, aggressive rental escalation demands and rigid tenant verification rules present ongoing challenges.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that landlords frequently seek higher escalation rates during lease renewals due to localized housing demand.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that society security and facility teams treat tenant residents with equal access to common amenities.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, tenants should confirm that property owners clear society maintenance dues regularly to prevent amenity access holds.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights high move-in administrative fees charged by society management as an added expense for tenants.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses advise tenants to negotiate fixed annual escalation caps and explicit deposit refund timelines in written lease agreements.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses demonstrates that tenants and investors should carefully review lease renewal caps and deposit refund terms in writing.`
      );
      break;

    case 'would-live-again':
      // Normal Scenario
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, evaluating overall satisfaction provides a comprehensive summary for prospective home buyers.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, the combination of strategic location, secure premises, functional utilities, and active community life creates a positive living experience.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents highlighted consistent capital appreciation and strong resale interest in the area as major financial advantages.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that buyers prioritizing safety, family environment, and utility stability will find {Society_Name} a strong choice.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents notes minor annoyances such as peak-hour gate traffic or visitor parking limits, which are outweighed by overall location benefits.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident responses reflect high overall satisfaction, with long-term occupants expressing confidence in their decision to reside here.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident feedback confirms that overall satisfaction, strong resale demand, and daily convenience make this society a solid investment.`
      );

      // Critical Scenario
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, a balanced evaluation highlights key operational trade-offs that buyers must weigh carefully.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that recurring maintenance overheads, peak-hour parking congestion, and seasonal utility issues require realistic compromise.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that convenient access to employment centers, schools, and essential services remains the primary reason residents choose to stay.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, prospective buyers should compare society pricing against neighboring options before paying premium resale rates.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights ongoing facility maintenance costs and committee decision delays as factors affecting overall satisfaction.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses indicate that purchasing here is recommended if buyers secure a favorable purchase price and designated parking slot.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses advises buyers to weigh location benefits against recurring maintenance outlays before finalizing their decision.`
      );
      break;

    default:
      // Generic Fallback for Custom Topics
      addTmpl(`TMPL_${idUpper}_NORM_OPENING`, 'SEC_OPENING', defaultScenarioId, 'Conversational',
        `Based on resident responses in {Society_Name}, evaluating ${topicTitle.toLowerCase()} provides practical evidence-based insight before finalizing your property decision.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_DAILY`, 'SEC_DAILY_EXP', defaultScenarioId, 'Direct',
        `According to available resident feedback, ${topicTitle.toLowerCase()} directly impacts daily routines. Understanding operational patterns helps set realistic expectations.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_LIKES`, 'SEC_LIKES', defaultScenarioId, 'Detailed',
        `Multiple respondents appreciated clear community protocols and management oversight regarding ${topicTitle.toLowerCase()}, which help maintain orderly living conditions.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_BUYER`, 'SEC_BUYER_KNOW', defaultScenarioId, 'Detailed',
        `Resident responses suggest that prospective buyers should inspect ${topicTitle.toLowerCase()} conditions during peak hours and speak with long-term occupants.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_FRUST`, 'SEC_FRUSTRATIONS', defaultScenarioId, 'Direct',
        `Feedback from residents indicates that primary concerns regarding ${topicTitle.toLowerCase()} involve occasional maintenance delays or communication gaps during service interruptions.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_AGAIN`, 'SEC_BUY_AGAIN', defaultScenarioId, 'Neutral',
        `Current resident responses suggest that ${topicTitle.toLowerCase()} conditions are manageable when prospective buyers perform thorough pre-purchase checks.`
      );
      addTmpl(`TMPL_${idUpper}_NORM_CLOSE`, 'SEC_CLOSING', defaultScenarioId, 'Neutral',
        `In summary, resident feedback demonstrates that checking ${topicTitle.toLowerCase()} details firsthand ensures a well-informed property purchase in {Society_Name}.`
      );

      // Critical
      addTmpl(`TMPL_${idUpper}_CRIT_OPENING`, 'SEC_OPENING', criticalScenarioId, 'Conversational',
        `According to resident responses in {Society_Name}, ${topicTitle.toLowerCase()} presents recurring operational challenges that require careful buyer attention.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_DAILY`, 'SEC_DAILY_EXP', criticalScenarioId, 'Direct',
        `Resident feedback indicates that peak-hour demand and maintenance delays in ${topicTitle.toLowerCase()} can disrupt daily household schedules.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_LIKES`, 'SEC_LIKES', criticalScenarioId, 'Detailed',
        `Multiple respondents noted that facility staff attempt to mitigate ${topicTitle.toLowerCase()} issues, though long-term improvements depend on broader infrastructure upgrades.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_BUYER`, 'SEC_BUYER_KNOW', criticalScenarioId, 'Detailed',
        `Based on available responses, buyers should inquire whether upcoming special fund assessments will be needed for ${topicTitle.toLowerCase()} repairs.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_FRUST`, 'SEC_FRUSTRATIONS', criticalScenarioId, 'Direct',
        `Current resident feedback highlights slow resolution turnaround times and service interruptions as key areas of resident dissatisfaction.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_AGAIN`, 'SEC_BUY_AGAIN', criticalScenarioId, 'Neutral',
        `Resident responses advise buyers to weigh ${topicTitle.toLowerCase()} limitations against the society's location and security advantages.`
      );
      addTmpl(`TMPL_${idUpper}_CRIT_CLOSE`, 'SEC_CLOSING', criticalScenarioId, 'Neutral',
        `In summary, evidence from resident responses proves that a thorough pre-purchase inspection of ${topicTitle.toLowerCase()} is essential to avoid post-move surprises.`
      );
      break;
  }

  return templates;
}
