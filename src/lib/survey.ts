export type QuestionType = "text" | "number" | "single" | "multi" | "scale";

export type Question = {
  id: string;
  number: number;
  text: string;
  type: QuestionType;
  options?: string[];
  note?: string;
  dependsOn?: { id: string; value: string };
};

export type SurveySection = {
  id: string;
  shortTitle: string;
  title: string;
  questions: Question[];
};

const yesNo = ["Yes", "No"];
const likert = ["SD", "D", "N", "A", "SA"];
const q = (number: number, text: string, type: QuestionType, options?: string[], extra: Partial<Question> = {}): Question => ({
  id: `q${number}`,
  number,
  text,
  type,
  options,
  ...extra,
});

export const surveySections: SurveySection[] = [
  {
    id: "a",
    shortTitle: "Background",
    title: "Socio-demographic characteristics",
    questions: [
      q(1, "Age of mother (in completed years)", "number"),
      q(2, "What is your marital status?", "single", ["Single", "Married", "Cohabiting", "Divorced/Separated", "Widowed"]),
      q(3, "What is your highest level of education completed?", "single", ["No formal education", "Primary", "Junior High School (JHS)", "Senior High School (SHS)", "Tertiary (Diploma/Degree/Postgraduate)"]),
      q(4, "What is your current occupation?", "single", ["Unemployed / Homemaker", "Self-employed (informal)", "Self-employed (formal/business owner)", "Public sector employee", "Private sector employee", "Student", "Other"]),
      q(5, "What is your monthly household income level?", "single", ["Below GHS 500", "GHS 500 to GHS 999", "GHS 1,000 to GHS 1,999", "GHS 2,000 to GHS 2,999", "GHS 3,000 and above", "Prefer not to say"], { note: "Interviewer: show income bands." }),
      q(6, "What is your religion?", "single", ["Christianity", "Islam", "Traditional/African religion", "No religion", "Other"]),
      q(7, "Which ethnic group do you belong to?", "single", ["Akan", "Ga/Dangme", "Ewe", "Mole-Dagbani", "Other"]),
      q(8, "What is the nature of your place of residence?", "single", ["Urban", "Peri-urban", "Rural"]),
      q(9, "What is your pre-pregnancy body weight status as recorded in your antenatal card?", "single", ["Underweight (BMI < 18.5)", "Normal weight (BMI 18.5 to 24.9)", "Overweight (BMI 25.0 to 29.9)", "Obese (BMI ≥ 30)", "Not recorded / Don’t know"], { note: "Check ANC card if available." }),
      q(10, "How many pregnancies have you had in total, including this one?", "number"),
      q(11, "How many times have you given birth before this delivery (para)?", "single", ["0 (This is my first birth, Primiparous)", "1", "2", "3", "4 or more"]),
      q(12, "Have you breastfed a baby before?", "single", yesNo),
      q(13, "If yes, for how long did you breastfeed your last baby?", "single", ["Less than 1 month", "1 to 3 months", "4 to 6 months", "More than 6 months"], { dependsOn: { id: "q12", value: "Yes" } }),
      q(14, "Did you plan to breastfeed this baby before delivery?", "single", yesNo),
      q(15, "Did you attend any breastfeeding education session during antenatal care?", "single", yesNo),
    ],
  },
  {
    id: "b",
    shortTitle: "Clinical",
    title: "Obstetric and clinical history",
    questions: [
      q(16, "What was the gestational age of the baby at delivery?", "single", ["Less than 34 weeks (Very preterm)", "34 to 36 weeks (Late preterm)", "37 to 40 weeks (Term)", "More than 40 weeks (Post-term)", "Not recorded / Don’t know"], { note: "Confirm from ANC card or clinical records." }),
      q(17, "What was the nature of this delivery?", "single", ["Singleton (one baby)", "Twins", "Triplets or more"]),
      q(18, "Was the caesarean section elective or emergency?", "single", ["Elective (planned before labour)", "Emergency (performed during or after onset of labour)", "Don’t know"]),
      q(19, "What was the main reason for the caesarean section?", "multi", ["Previous caesarean section (repeat CS)", "Cephalopelvic disproportion / Obstructed labour", "Foetal distress", "Placenta praevia / Placental abruption", "Pre-eclampsia / Eclampsia", "Breech or other malpresentation", "Prolonged/arrested labour", "Maternal request (no medical indication)", "Other"]),
      q(20, "How many previous caesarean sections have you had?", "single", ["None (first CS)", "One previous CS", "Two previous CS", "Three or more previous CS"]),
      q(21, "If this was an emergency CS, approximately how many hours were you in labour before the operation?", "single", ["Less than 4 hours", "4 to 8 hours", "9 to 12 hours", "More than 12 hours", "Not applicable (elective CS)"]),
      q(22, "Was your labour augmented with an oxytocin drip before the caesarean section?", "single", ["Yes", "No", "Not applicable (elective CS)", "Don’t know"]),
      q(23, "What type of anaesthesia did you receive for the caesarean section?", "single", ["Spinal anaesthesia", "Epidural anaesthesia", "General anaesthesia", "Don’t know"]),
      q(24, "Approximately how many litres of IV fluid did you receive during and immediately after surgery?", "single", ["Less than 1 litre (fewer than 2 bags)", "1 to 2 litres (2 to 4 bags)", "More than 2 litres (more than 4 bags)", "Don’t know / not recorded"]),
      q(25, "What was your baby’s birth weight?", "single", ["Less than 2,500 g (Low birth weight)", "2,500 to 3,999 g (Normal birth weight)", "4,000 g and above (Macrosomia)", "Not recorded"]),
      q(26, "What was your baby’s APGAR score at 5 minutes?", "single", ["7 to 10 (Normal)", "4 to 6 (Moderate concern)", "0 to 3 (Severe concern)", "Not recorded / Don’t know"]),
      q(27, "Was your baby admitted to NICU or SCBU after birth?", "single", yesNo),
      q(28, "If yes, for how long was your baby in NICU/SCBU?", "single", ["Less than 24 hours", "24 to 48 hours", "49 to 72 hours", "More than 72 hours"], { dependsOn: { id: "q27", value: "Yes" } }),
      q(29, "Were you diagnosed with any of the following conditions during this pregnancy?", "multi", ["Gestational diabetes mellitus (GDM)", "Pre-eclampsia or Eclampsia", "Anaemia (low blood count)", "Thyroid disease", "HIV/AIDS", "None of the above", "Other"]),
      q(30, "Were you on any long-term medication during pregnancy?", "single", yesNo, { note: "Excluding routine supplements. Record medication in notes when applicable." }),
    ],
  },
  {
    id: "c",
    shortTitle: "Early care",
    title: "Early postoperative care and breastfeeding initiation",
    questions: [
      q(31, "Did you have skin-to-skin contact after the caesarean section?", "single", yesNo),
      q(32, "If yes, how soon after the operation did skin-to-skin contact happen?", "single", ["Within 30 minutes", "31 minutes to 1 hour", "1 to 2 hours", "More than 2 hours after surgery"], { dependsOn: { id: "q31", value: "Yes" } }),
      q(33, "If you did not have skin-to-skin contact, what was the main reason?", "single", ["Baby was taken to NICU/SCBU", "I was not well enough", "Hospital staff did not facilitate it", "I was not aware it was possible after CS", "Not applicable", "Other"]),
      q(34, "How soon after delivery did you first put your baby to the breast?", "single", ["Within 1 hour", "1 to 6 hours", "7 to 24 hours", "After 24 hours", "Have not breastfed yet / Did not breastfeed"]),
      q(35, "Before breastfeeding started, was your baby given anything else to feed on?", "single", yesNo),
      q(36, "If yes, what was given before breastfeeding started?", "multi", ["Infant formula", "Plain water", "Glucose water / sugar water", "Herbal preparation", "Other"], { dependsOn: { id: "q35", value: "Yes" } }),
      q(37, "Who decided to give the baby something other than breast milk?", "single", ["Nurse/Midwife", "Doctor", "Mother herself", "Relative/Family member", "Partner/Husband", "Not applicable"]),
      q(38, "Did you receive breastfeeding counselling or support from a health worker after the caesarean section?", "single", yesNo),
      q(39, "Were you helped to position your baby correctly for breastfeeding after the operation?", "single", yesNo),
      q(40, "Did hospital staff encourage you to breastfeed frequently (at least 8 to 12 times per day)?", "single", yesNo),
      q(41, "How much pain did you experience in the first 72 hours after surgery?", "single", ["No pain", "Mild pain", "Moderate pain", "Severe pain"]),
    ],
  },
  {
    id: "d",
    shortTitle: "Milk onset",
    title: "Onset of lactogenesis II (milk coming in)",
    questions: [
      q(42, "When did you first notice that your breasts felt full, heavy, or engorged with milk?", "single", ["Within 24 hours after delivery", "25 to 48 hours after delivery", "49 to 72 hours after delivery", "More than 72 hours after delivery", "I have not noticed my milk coming in yet", "I cannot remember"]),
      q(43, "Do you feel that your breast milk was delayed in coming in?", "single", yesNo),
      q(44, "Which signs of milk coming in occurred within the first 72 hours?", "multi", ["Breast fullness or heaviness", "Breast engorgement", "Leaking of milk", "Sensation of milk flowing", "None of the above"]),
      q(45, "Did you worry that your baby was not getting enough breast milk in the first 3 days?", "single", yesNo),
      q(46, "Because milk had not come in sufficiently, did you give additional feeds in the first 72 hours?", "single", yesNo),
      q(47, "If yes, what additional feeds did you give?", "multi", ["Infant formula", "Plain water", "Glucose water", "Expressed breast milk from another mother", "Other"], { dependsOn: { id: "q46", value: "Yes" } }),
      q(48, "In the first 72 hours, were you able to breastfeed as often as you wanted?", "single", yesNo),
      q(49, "If no, what prevented you from breastfeeding as often as you wanted?", "multi", ["Baby was in NICU / separated from me", "Too much pain from surgery", "I was too tired or weak", "I felt I did not have enough milk", "Difficulty positioning the baby", "No one helped me breastfeed", "Not applicable"]),
    ],
  },
  {
    id: "e",
    shortTitle: "Influences",
    title: "Clinical and psychological factors",
    questions: [
      q(50, "During pregnancy, did sadness, anxiety, or worry persist for more than two weeks?", "single", yesNo),
      q(51, "After delivery, have you felt persistently sad, hopeless, or anxious?", "single", yesNo),
      q(52, "How would you describe the support received at home to help you breastfeed?", "single", ["Very supportive", "Supportive", "Neutral", "Unsupportive", "No support at all"]),
      q(53, "Did anyone discourage breastfeeding or encourage formula milk?", "single", yesNo),
      q(54, "If yes, what reason did they give?", "multi", ["Breast milk was insufficient", "Formula is more convenient after surgery", "Cultural belief that colostrum is harmful", "Concern about baby’s weight loss", "Other"], { dependsOn: { id: "q53", value: "Yes" } }),
      q(55, "Which breast-related problems affected breastfeeding in the first 72 hours?", "multi", ["Flat or inverted nipples", "Sore or cracked nipples", "Breast engorgement with difficulty latching", "Breast oedema / swelling", "No breast problems", "Other"]),
      q(56, "Did you use a breast pump in the first 72 hours after surgery?", "single", yesNo),
      q(57, "If yes, when did you first use the breast pump?", "single", ["Within 6 hours", "7 to 12 hours", "13 to 24 hours", "After 24 hours"], { dependsOn: { id: "q56", value: "Yes" } }),
      q(58, "Are you currently breastfeeding?", "single", yesNo, { note: "Ask at 72 to 96 hours postpartum." }),
    ],
  },
  {
    id: "f",
    shortTitle: "Barriers",
    title: "Perceived barriers to timely onset of milk",
    questions: [
      q(59, "Pain from the caesarean wound made breastfeeding difficult.", "scale", likert),
      q(60, "Fatigue and weakness delayed my ability to put the baby to the breast.", "scale", likert),
      q(61, "Separation from my baby delayed my milk from coming in.", "scale", likert),
      q(62, "IV fluids caused breast swelling and made breastfeeding harder.", "scale", likert),
      q(63, "Anxiety or stress affected my milk coming in.", "scale", likert),
      q(64, "Lack of immediate skin-to-skin contact delayed my milk.", "scale", likert),
      q(65, "Lack of staff help with positioning and latch affected milk onset.", "scale", likert),
      q(66, "Family advice or pressure led me to give formula before milk came in.", "scale", likert),
      q(67, "Not knowing delayed onset is common made me worried and give up.", "scale", likert),
      q(68, "The type of anaesthesia affected my ability to breastfeed early.", "scale", likert),
    ],
  },
  {
    id: "g",
    shortTitle: "Infant data",
    title: "Infant data",
    questions: [
      q(69, "Sex of the baby", "single", ["Male", "Female"]),
      q(70, "Birth weight of the baby (exact, from records)", "number"),
      q(71, "APGAR score at 1 minute", "number"),
      q(72, "APGAR score at 5 minutes", "number"),
      q(73, "Baby’s weight at 72 hours postpartum", "number"),
      q(74, "Percentage weight loss from birth weight to 72-hour weight", "number"),
      q(75, "Was the baby admitted to NICU/SCBU?", "single", yesNo, { note: "Record reason and duration in notes." }),
    ],
  },
];

export const allQuestions = surveySections.flatMap((section) => section.questions);

export const sheetHeaders = [
  "Research ID",
  "Status",
  "Hospital",
  "Researcher email",
  "Created at",
  "Updated at",
  ...allQuestions.map((question) => `Q${question.number}: ${question.text}`),
  "Research notes",
];
