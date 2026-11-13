export type GradeLevel = 'K' | '1' | '2' | '3' | '4' | '5';

export type FastAssessedGrade = '3' | '4' | '5';

export type StrandCode = 'EE' | 'F' | 'R' | 'C' | 'V';

export type ReportingCategoryId =
  | 'reading-prose-poetry'
  | 'reading-informational-text'
  | 'reading-across-genres-vocabulary'
  | 'foundational-skills'
  | 'communication-writing'
  | 'ela-expectations';

export interface FloridaBenchmark {
  code: string;
  grade: GradeLevel | 'K12';
  strand: StrandCode;
  strandName: string;
  standardGroup: string;
  benchmarkTitle: string;
  reportingCategory: ReportingCategoryId;
  reportingCategoryLabel: string;
  officialText: string;
  clarifications: string[];
  fastAssessed: boolean;
  keywords: string[];
  requiredCognitiveSkills: string[];
  suggestedItemTypes: FastItemType[];
  sourceTitle: string;
  sourceUrl: string;
  localPdfUrl: string;
  pdfPage: number;
}

export type PassageTextType = 'literary' | 'informational' | 'paired';

export type PassageLengthOption = 'short' | 'standard' | 'extended';

export type VocabularyComplexityOption = 'foundational' | 'on-grade' | 'stretch';

export type CognitiveRigor = 'Foundational' | 'On-Grade-Level' | 'Advanced';

export type FastItemType =
  | 'multiple_choice'
  | 'multiselect'
  | 'ebsr'
  | 'hot_text'
  | 'table_match';

export interface VocabularyWord {
  id: string;
  word: string;
  partOfSpeech: string;
  definition: string;
  passageContextSentence: string;
  paragraphRef: number;
  morphologyOrClueNote: string;
  benchmarkCode: string;
  benchmarkAlignmentNote: string;
}

export interface QualitativeComplexityAnalysis {
  complexityTier: 'Low' | 'Mid' | 'High';
  meaningAndPurpose: string;
  languageClarityAndVocabulary: string;
  sentenceStructureAndOrganization: string;
  knowledgeDemands: string;
  instructionalRecommendation: string;
}

export interface TextComplexityAnalysis {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  syllableCount: number;
  avgWordsPerSentence: number;
  avgSyllablesPerWord: number;
  longWordPercentage: number;
  fleschKincaidGrade: number;
  estimatedLexile: number;
  estimatedLexileLabel: string;
  officialBandLabel: string;
  officialLexileRange: string;
  officialFkRange: string;
  gradeAppropriateStatus: 'Within Grade Band' | 'Approaching Band (Accessible)' | 'Stretch Above Band';
  gradeAppropriatenessExplanation: string;
  qualitative: QualitativeComplexityAnalysis;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface PassageSection {
  id: string;
  label: string;
  title: string;
  genre: 'literary' | 'informational';
  authorByline?: string;
  sourceNote?: string;
  paragraphs: string[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  grade: GradeLevel;
  textType: PassageTextType;
  topic: string;
  targetLength: PassageLengthOption;
  vocabularyComplexity: VocabularyComplexityOption;
  alignedBenchmarks: string[];
  sections: PassageSection[];
  glossary: GlossaryEntry[];
  vocabularyGuide: VocabularyWord[];
  complexity: TextComplexityAnalysis;
  practiceDisclaimer: string;
  createdAt: string;
  sourceMode: 'verified-seed' | 'ai-generated' | 'teacher-custom';
}

export interface ItemOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
  rationale: string;
  paragraphRef?: number;
}

export interface HotTextSegment {
  id: string;
  paragraphRef: number;
  text: string;
  isCorrect: boolean;
  rationale: string;
}

export interface TableMatchRow {
  id: string;
  statement: string;
  correctColumnIds: string[];
  rationale: string;
}

export interface TableMatchConfig {
  columns: { id: string; label: string }[];
  rows: TableMatchRow[];
}

export interface AssessmentItem {
  id: string;
  passageId: string;
  grade: GradeLevel;
  itemType: FastItemType;
  benchmarkCode: string;
  officialBenchmarkText: string;
  reportingCategory: ReportingCategoryId;
  reportingCategoryLabel: string;
  cognitiveSkill: string;
  cognitiveRigor: CognitiveRigor;
  dok: 1 | 2 | 3;
  prompt: string;
  selectionCount?: number;
  options?: ItemOption[];
  partAPrompt?: string;
  partAOptions?: ItemOption[];
  partBPrompt?: string;
  partBOptions?: ItemOption[];
  hotTextSegments?: HotTextSegment[];
  tableMatch?: TableMatchConfig;
  correctAnswerSummary: string;
  correctRationale: string;
  textualEvidenceQuote: string;
  evidenceParagraphRef: number;
  sourceCitation: string;
  practiceDisclaimer: string;
}

export interface SavedAssessment {
  id: string;
  title: string;
  unitTag: string;
  grade: GradeLevel;
  passage: ReadingPassage;
  items: AssessmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentItemResponse {
  selectedOptionIds?: string[];
  partASelectedIds?: string[];
  partBSelectedIds?: string[];
  hotTextSelectedIds?: string[];
  tableMatchSelections?: Record<string, string[]>;
}

export interface ScoredItemResult {
  itemId: string;
  benchmarkCode: string;
  reportingCategory: ReportingCategoryId;
  itemType: FastItemType;
  score: number; // 0 to 1
  isCorrect: boolean;
  selectedLabels: string[];
  correctLabels: string[];
}

export interface StudentAttempt {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  grade: GradeLevel;
  studentName: string;
  submittedAt: string;
  totalPoints: number;
  maxPoints: number;
  percentScore: number;
  responses: Record<string, StudentItemResponse>;
  itemResults: ScoredItemResult[];
}

export interface WorkspaceState {
  passages: ReadingPassage[];
  items: AssessmentItem[];
  assessments: SavedAssessment[];
  attempts: StudentAttempt[];
}

export type BellringerPurpose = 'review' | 'activate' | 'introduce' | 'reinforce';

export type BellringerQuestionType =
  | 'multiple_choice'
  | 'grammar_editing'
  | 'short_response'
  | 'mixed';

export type BellringerQuestionFormat = 'multiple_choice' | 'grammar_editing' | 'short_response';

export interface BellringerOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
  rationale?: string;
}

export interface BellringerQuestion {
  id: string;
  number: number;
  format: BellringerQuestionFormat;
  prompt: string;
  targetSentence?: string;
  options?: BellringerOption[];
  correctAnswer: string;
  explanation: string;
  textualEvidence?: string;
  maxSentences?: number;
}

export interface BellringerTimeAudit {
  estimatedMinutes: number;
  estimatedSeconds: number;
  passageWordCount: number;
  wasAutoTrimmed: boolean;
  trimNotes: string[];
}

export interface BellringerActivity {
  id: string;
  title: string;
  grade: GradeLevel;
  benchmarkCode: string;
  officialBenchmarkText: string;
  benchmarkTitle: string;
  sourceCitation: string;
  priorKnowledgeBenchmarkCode?: string;
  priorKnowledgeBenchmarkTitle?: string;
  priorKnowledgeBenchmarkText?: string;
  priorKnowledgeSourceCitation?: string;
  priorKnowledgeBridgeNote?: string;
  purpose: BellringerPurpose;
  purposeLabel: string;
  questionType: BellringerQuestionType;
  questionTypeLabel: string;
  estimatedTimeLabel: string;
  directions: string;
  sourceText?: string;
  sourceTextLabel?: string;
  questions: BellringerQuestion[];
  timeAudit: BellringerTimeAudit;
  practiceDisclaimer: string;
  createdAt: string;
  sourceMode: 'ai-generated' | 'verified-fallback';
}
