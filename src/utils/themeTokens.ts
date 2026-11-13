export interface SubjectBadgeStyle {
  label: 'ELA & Reading' | 'Math' | 'Science & Social Studies';
  className: string;
}

export const SUBJECT_BADGES: Record<
  'ela' | 'math' | 'science_ss',
  SubjectBadgeStyle
> = {
  ela: {
    label: 'ELA & Reading',
    className:
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3EBF5] text-[#5C2D68] border border-[#DFCBE4] whitespace-nowrap',
  },
  math: {
    label: 'Math',
    className:
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F2FA] text-[#19547B] border border-[#BFE0F5] whitespace-nowrap',
  },
  science_ss: {
    label: 'Science & Social Studies',
    className:
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E9F3EC] text-[#245436] border border-[#C3DFCB] whitespace-nowrap',
  },
};

export function inferSubjectBadge(text: string): SubjectBadgeStyle {
  const lower = text.toLowerCase();
  if (
    /\b(math|fraction|geometry|equation|number|graph|measure|perimeter|area|ratio|algebra)\b/.test(
      lower
    )
  ) {
    return SUBJECT_BADGES.math;
  }
  if (
    /\b(spring|aquifer|everglades|sawgrass|manatee|coral|reef|butterfly|weather|balloon|science|tree|canop|ecosystem|habitat|lighthouse|atlantic|fortress|history|seminole|st\. augustine|solar|planet|habitat|marshes|water)\b/.test(
      lower
    )
  ) {
    return SUBJECT_BADGES.science_ss;
  }
  return SUBJECT_BADGES.ela;
}

export const STANDARD_CODE_PILL =
  'inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-xs font-medium bg-[#EEF0F8] text-[#434D7B] border border-[#D0D6EA] whitespace-nowrap';

export const STANDARD_CODE_PILL_INTERACTIVE =
  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-xs font-medium bg-[#EEF0F8] text-[#434D7B] border border-[#D0D6EA] hover:bg-[#E1E5F5] transition-colors whitespace-nowrap cursor-pointer';
