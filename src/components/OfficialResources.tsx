import { useMemo, useState } from 'react';
import { BookOpen, ExternalLink, FileText, Search } from 'lucide-react';
import {
  APPENDIX_D_GREEK_LATIN_ROOTS_3_5,
  ELEMENTARY_FIGURATIVE_LANGUAGE,
  FAST_ITEM_TYPE_INFO,
  FAST_READING_BLUEPRINTS,
  FDOE_SOURCES,
  FOUNDATIONAL_STANDARDS_PROGRESSION,
  OFFICIAL_TEXT_STRUCTURES,
} from '../data/floridaStandards.ts';
import { OFFICIAL_COMPLEXITY_BANDS } from '../utils/textComplexity.ts';
import { STANDARD_CODE_PILL } from '../utils/themeTokens.ts';
import type { FastAssessedGrade } from '../types/ela.ts';

export function OfficialResources() {
  const [blueprintGrade, setBlueprintGrade] = useState<FastAssessedGrade>('4');
  const [rootSearch, setRootSearch] = useState('');

  const filteredRoots = useMemo(() => {
    const q = rootSearch.trim().toLowerCase();
    if (!q) return APPENDIX_D_GREEK_LATIN_ROOTS_3_5;
    return APPENDIX_D_GREEK_LATIN_ROOTS_3_5.filter(
      (r) =>
        r.root.toLowerCase().includes(q) ||
        r.meaning.toLowerCase().includes(q) ||
        r.examples.toLowerCase().includes(q)
    );
  }, [rootSearch]);

  const sourcesList = Object.values(FDOE_SOURCES);

  return (
    <div className="space-y-6">
      {/* Authoritative FDOE Documents Directory */}
      <section className="studio-card p-6 space-y-4">
        <div>
          <div className="text-xs font-mono text-[#434D7B] font-medium">
            Verified Primary Sources · Florida Department of Education (FDOE)
          </div>
          <h2 className="text-2xl font-bold text-[#2D2A26] mt-1">
            Official FDOE &amp; FAST ELA Reference Library
          </h2>
          <p className="text-sm text-[#625D56] mt-1 max-w-3xl">
            Every benchmark, complexity band, test blueprint weight, and instructional next step in this studio comes exclusively from these official Florida Department of Education documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sourcesList.map((src) => (
            <article
              key={src.localPdfUrl}
              className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#434D7B] font-semibold">
                  Official FDOE Document
                </div>
                <h3 className="text-sm font-semibold text-[#2D2A26] leading-snug">
                  {src.title}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <a
                  href={src.localPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#155E63] underline hover:text-[#E05A47]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Open Local Official PDF
                </a>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#625D56] underline hover:text-[#155E63]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Official Portal ({src.url.includes('fldoe') ? 'fldoe.org' : 'flfast.org'})
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAST Grades 3-5 Blueprint & K-2 Star Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 studio-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE1D2] pb-3">
            <div>
              <div className="text-xs font-mono text-[#434D7B] font-medium">
                FAST ELA Reading Test Design Summary (June 2024, pp. 4–10)
              </div>
              <h3 className="text-lg font-semibold text-[#2D2A26]">
                Grades 3–5 Test Blueprint &amp; Category Weights
              </h3>
            </div>
            <div className="flex items-center gap-1.5" role="group" aria-label="Blueprint grade">
              {(['3', '4', '5'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBlueprintGrade(g)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                    blueprintGrade === g
                      ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                      : 'bg-[#F5EFE6] text-[#625D56] border-[#DFD5C5] hover:bg-[#EAE1D2] hover:text-[#2D2A26]'
                  }`}
                >
                  Grade {g}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] text-[#625D56]">
                  <th className="py-2 pr-3 font-semibold">Reporting Category</th>
                  <th className="py-2 pr-3 font-semibold">Assessed B.E.S.T. Benchmarks</th>
                  <th className="py-2 font-semibold text-right">Blueprint Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE1D2]">
                {FAST_READING_BLUEPRINTS[blueprintGrade].map((row) => (
                  <tr key={row.reportingCategoryId}>
                    <td className="py-2.5 pr-3 font-medium text-[#2D2A26] align-top">
                      {row.reportingCategoryLabel}
                    </td>
                    <td className="py-2.5 pr-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        {row.benchmarks.map((code) => (
                          <span key={code} className={STANDARD_CODE_PILL}>
                            {code}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 font-mono font-semibold text-[#155E63] text-right tabular-nums align-top whitespace-nowrap">
                      {row.weight}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#EEF0F8] border border-[#D0D6EA] rounded-xl p-4 text-xs text-[#2D2A26] space-y-1.5">
            <div>
              <span className="font-semibold text-[#434D7B]">Item Count &amp; Timing: </span>
              36–40 operational items (+5 field test items on PM3); PM1 &amp; PM2 up to 90 minutes, PM3 up to 120 minutes.
            </div>
            <div>
              <span className="font-semibold text-[#434D7B]">Genre Balance: </span>
              50% Fiction / 50% Informational text across Grades 3–5.
            </div>
            <div>
              <span className="font-semibold text-[#434D7B]">ELA Expectations Embedded: </span>
              ELA.K12.EE.1.1 (Cite Evidence), ELA.K12.EE.2.1 (Comprehend Complex Texts), and ELA.K12.EE.3.1 (Make Inferences) are assessed alongside R and V benchmarks.
            </div>
          </div>
        </section>

        {/* Grades K-2 Star & Appendix B Complexity Bands */}
        <section className="lg:col-span-5 space-y-6">
          <div className="studio-card p-6 space-y-3">
            <div className="text-xs font-mono text-[#434D7B] font-medium">
              2026–2027 FAST Grades K–2 Fact Sheet
            </div>
            <h3 className="text-lg font-semibold text-[#2D2A26]">
              Grades K–2 Star Screening Overview
            </h3>
            <ul className="space-y-2 text-xs text-[#625D56] leading-relaxed list-disc pl-4">
              <li>
                <span className="font-semibold text-[#2D2A26]">Star Early Literacy (K–1): </span>
                27 computer-adaptive items (~10–15 minutes); transitions to Star Reading once students reach a scaled score of <span className="font-mono font-semibold text-[#155E63]">852</span> (Probable Reader).
              </li>
              <li>
                <span className="font-semibold text-[#2D2A26]">Star Reading (Grades 1–2): </span>
                34 computer-adaptive items (~15–20 minutes) administered during PM1, PM2, and PM3 progress monitoring windows.
              </li>
              <li>
                <span className="font-semibold text-[#2D2A26]">Studio Alignment: </span>
                Grades K–2 items in this studio emphasize foundational comprehension and teacher-guided checks rather than Grades 3–5 FAST computer TEIs.
              </li>
            </ul>
          </div>

          <div className="studio-card p-6 space-y-3">
            <div className="text-xs font-mono text-[#434D7B] font-medium">
              Florida B.E.S.T. Standards (2025), Appendix B, p. 148
            </div>
            <h3 className="text-lg font-semibold text-[#2D2A26]">
              Quantitative Text Complexity Bands
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5DDD0] text-[#625D56]">
                  <th className="py-1.5 pr-2 font-semibold">Grade Band</th>
                  <th className="py-1.5 font-semibold text-right">Lexile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE1D2]">
                {[
                  OFFICIAL_COMPLEXITY_BANDS['1'],
                  OFFICIAL_COMPLEXITY_BANDS['3'],
                  OFFICIAL_COMPLEXITY_BANDS['5'],
                ].map((band) => (
                  <tr key={band.bandId}>
                    <td className="py-2 pr-2 font-medium text-[#2D2A26]">{band.label}</td>
                    <td className="py-2 font-mono font-semibold text-[#155E63] text-right tabular-nums">
                      {band.lexileDisplay}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Foundational Reading Standards Progression (Grades K-5) */}
      <section className="studio-card p-6 space-y-4">
        <div>
          <div className="text-xs font-mono text-[#434D7B] font-medium">
            Florida B.E.S.T. Standards: ELA (2025), Strand F (pp. 12–13, 27–70)
          </div>
          <h3 className="text-lg font-semibold text-[#2D2A26]">
            Foundational Reading Standards Progression (Grades K–5)
          </h3>
          <p className="text-xs text-[#625D56] mt-1 max-w-3xl">
            Official Strand F progression across Kindergarten through Grade 5. Print Concepts (F.1.1) and Phonological Awareness (F.1.2) apply to Kindergarten and Grade 1; Phonics and Word Analysis (F.1.3) and Fluency (F.1.4) continue through Grade 5.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FOUNDATIONAL_STANDARDS_PROGRESSION.map((item) => (
            <article key={item.codeGroup} className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-mono text-[#E05A47] font-semibold">
                {item.grades}
              </div>
              <h4 className="text-sm font-semibold text-[#2D2A26]">{item.codeGroup}</h4>
              <p className="text-xs text-[#625D56] leading-relaxed">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      {/* FAST Technology-Enhanced Item Types */}
      <section className="studio-card p-6 space-y-4">
        <div>
          <div className="text-xs font-mono text-[#434D7B] font-medium">
            FAST ELA Reading Test Design Summary (June 2024), p. 10
          </div>
          <h3 className="text-lg font-semibold text-[#2D2A26]">
            Official FAST Assessment Item Formats (Grades 3–5)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(FAST_ITEM_TYPE_INFO).map(([key, info]) => (
            <article key={key} className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-2xl p-4 space-y-1.5">
              <div className="text-xs font-mono text-[#155E63] font-semibold">
                {info.shortLabel}
              </div>
              <h4 className="text-sm font-semibold text-[#2D2A26]">{info.label}</h4>
              <p className="text-xs text-[#625D56] leading-relaxed">{info.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Appendix B Text Structures & Figurative Language */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="studio-card p-6 space-y-3">
          <div className="text-xs font-mono text-[#434D7B] font-medium">
            Florida B.E.S.T. Standards Appendix B
          </div>
          <h3 className="text-lg font-semibold text-[#2D2A26] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#155E63]" />
            Official Elementary Text Structures
          </h3>
          <div className="divide-y divide-[#EAE1D2]">
            {OFFICIAL_TEXT_STRUCTURES.map((ts) => (
              <div key={ts.name} className="py-2.5 first:pt-1 last:pb-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#2D2A26]">{ts.name}</span>
                  <span className="text-[11px] font-mono text-[#434D7B] font-medium">{ts.gradeIntroduced}</span>
                </div>
                <p className="text-xs text-[#625D56] mt-0.5">{ts.definition}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="studio-card p-6 space-y-3">
          <div className="text-xs font-mono text-[#434D7B] font-medium">
            Florida B.E.S.T. Standards Appendix B
          </div>
          <h3 className="text-lg font-semibold text-[#2D2A26]">
            Elementary Figurative Language Types
          </h3>
          <div className="divide-y divide-[#EAE1D2]">
            {ELEMENTARY_FIGURATIVE_LANGUAGE.map((fig) => (
              <div key={fig.term} className="py-2 first:pt-1 last:pb-1">
                <div className="text-sm font-semibold text-[#2D2A26]">{fig.term}</div>
                <p className="text-xs text-[#625D56] mt-0.5">{fig.definition}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Appendix D Greek & Latin Roots (Grades 3-5) */}
      <section className="studio-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-[#434D7B] mb-1">
              <span>Florida B.E.S.T. Standards Appendix D</span>
              <span className={STANDARD_CODE_PILL}>ELA.3.V.1.2</span>
              <span className={STANDARD_CODE_PILL}>ELA.4.V.1.2</span>
              <span className={STANDARD_CODE_PILL}>ELA.5.V.1.2</span>
            </div>
            <h3 className="text-lg font-semibold text-[#2D2A26]">
              Grades 3–5 Greek &amp; Latin Roots Reference
            </h3>
          </div>
          <div className="relative w-full sm:w-64">
            <label htmlFor="roots-search" className="sr-only">
              Filter Greek and Latin roots
            </label>
            <Search className="w-3.5 h-3.5 text-[#625D56] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="roots-search"
              type="search"
              value={rootSearch}
              onChange={(e) => setRootSearch(e.target.value)}
              placeholder="Filter roots or examples..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155E63]/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5DDD0] text-[#625D56]">
                <th className="py-2 pr-4 font-semibold">Root</th>
                <th className="py-2 pr-4 font-semibold">Meaning</th>
                <th className="py-2 font-semibold">Sample Words</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE1D2]">
              {filteredRoots.map((entry) => (
                <tr key={entry.root}>
                  <td className="py-2 pr-4 font-mono font-semibold text-[#155E63]">
                    {entry.root}
                  </td>
                  <td className="py-2 pr-4 text-[#2D2A26]">{entry.meaning}</td>
                  <td className="py-2 text-[#625D56]">{entry.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

