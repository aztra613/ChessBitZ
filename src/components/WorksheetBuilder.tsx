import React, { useState, useMemo, useEffect } from 'react';
import { Download, FileText, CheckSquare, Square, Printer, Eye, Sliders, ShieldCheck, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { PuzzleRecord } from '../types/puzzle';
import { WorksheetOptions, generateWorksheetPdf, generateAnswerKeyPdf } from '../utils/worksheetPdf';
import { MONETAG_DIRECT_LINK, openDirectLink } from '../utils/monetag';
import { usePuzzleManifest, usePuzzles } from './PuzzleProvider';
import { searchIndex, PuzzleIndexEntry } from '../utils/puzzleStore';
import { ChessBoard } from './ChessBoard';

/** Puzzles listed per page while browsing. */
const PAGE_SIZE = 24;

interface WorksheetBuilderProps {
  initialSelectedPuzzleId?: string;
  onNavigatePuzzle?: (id: string) => void;
}

export const WorksheetBuilder: React.FC<WorksheetBuilderProps> = ({
  initialSelectedPuzzleId,
  onNavigatePuzzle,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedPuzzleId ? [initialSelectedPuzzleId] : []
  );

  const [options, setOptions] = useState<WorksheetOptions>({
    paperSize: 'a4',
    puzzlesPerPage: 4,
    answerMode: 'at_end',
    includeQrCode: false,
    studentNameField: true,
    dateField: true,
    title: 'PlyQuest Tactical Training Worksheet',
  });

  const [filterTheme, setFilterTheme] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [page, setPage] = useState(0);

  const { ready } = usePuzzleManifest();

  // Browsing runs off the manifest index; only selected puzzles are hydrated.
  const filteredEntries: PuzzleIndexEntry[] = useMemo(
    () => searchIndex('', { theme: filterTheme }),
    [filterTheme, ready]
  );

  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageEntries = useMemo(
    () => filteredEntries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE),
    [filteredEntries, safePage]
  );

  useEffect(() => {
    setPage(0);
  }, [filterTheme]);

  // Seed a default selection once the index becomes available.
  useEffect(() => {
    if (!ready || initialSelectedPuzzleId) return;
    setSelectedIds((prev) =>
      prev.length > 0 ? prev : searchIndex('').slice(0, 4).map((entry) => entry.id)
    );
  }, [ready, initialSelectedPuzzleId]);

  const { puzzles: selectedPuzzles } = usePuzzles(selectedIds);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bounded to the visible page: a worksheet is never thousands of puzzles, and
  // this keeps the number of hydrated records small.
  const selectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const entry of pageEntries) next.add(entry.id);
      return [...next];
    });
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleDownload = () => {
    if (selectedPuzzles.length === 0) return;
    openDirectLink();
    setIsExporting(true);
    try {
      generateWorksheetPdf(selectedPuzzles, options);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadAnswerKey = () => {
    if (selectedPuzzles.length === 0) return;
    generateAnswerKeyPdf(selectedPuzzles, options);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4658C9]/10 dark:bg-[#4658C9]/25 text-[#4658C9] dark:text-[#A5B4FC] text-xs font-bold border border-[#4658C9]/20 mb-3">
          <Printer className="w-3.5 h-3.5" />
          <span>In-Browser PDF Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
          Printable Chess Puzzle Worksheets
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mt-2 max-w-2xl leading-relaxed">
          Create high-resolution, printable chess tactical worksheets for students, clubs, or personal study.
          PDFs are rendered 100% in your browser without uploading any data.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Configuration Controls & Puzzle Selector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Options Card */}
          <div className="p-5 bg-white dark:bg-[#1A2032] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-[#4658C9] dark:text-[#818CF8]" />
              <span>Worksheet Layout & Options</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Paper Format */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Paper Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['a4', 'letter'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setOptions({ ...options, paperSize: fmt })}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        options.paperSize === fmt
                          ? 'border-[#4658C9] dark:border-[#818CF8] bg-[#4658C9]/10 dark:bg-[#4658C9]/30 text-[#4658C9] dark:text-[#C7D2FE]'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#101321] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Puzzles per page */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Puzzles per Page
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([1, 2, 4, 6] as const).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setOptions({ ...options, puzzlesPerPage: count })}
                      className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        options.puzzlesPerPage === count
                          ? 'border-[#4658C9] dark:border-[#818CF8] bg-[#4658C9]/10 dark:bg-[#4658C9]/30 text-[#4658C9] dark:text-[#C7D2FE]'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#101321] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Answer Key Delivery */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Answer Key Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'at_end', label: 'Answers at End' },
                    { id: 'none', label: 'Questions Only' },
                    { id: 'separate_pdf', label: 'Separate Key' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setOptions({ ...options, answerMode: mode.id as any })}
                      className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all truncate cursor-pointer ${
                        options.answerMode === mode.id
                          ? 'border-[#4658C9] dark:border-[#818CF8] bg-[#4658C9]/10 dark:bg-[#4658C9]/30 text-[#4658C9] dark:text-[#C7D2FE]'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#101321] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Worksheet Header Title
                </label>
                <input
                  type="text"
                  value={options.title}
                  onChange={(e) => setOptions({ ...options, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-950 dark:text-white focus:outline-[#4658C9]"
                  placeholder="e.g. Club Tactics Practice - Set 1"
                />
              </div>

              {/* Checkbox fields: Name & Date */}
              <div className="sm:col-span-2 flex flex-wrap items-center gap-5 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.studentNameField}
                    onChange={(e) => setOptions({ ...options, studentNameField: e.target.checked })}
                    className="accent-[#4658C9] rounded w-4 h-4 cursor-pointer"
                  />
                  <span>Include "Name" line</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.dateField}
                    onChange={(e) => setOptions({ ...options, dateField: e.target.checked })}
                    className="accent-[#4658C9] rounded w-4 h-4 cursor-pointer"
                  />
                  <span>Include "Date" line</span>
                </label>
              </div>
            </div>

            {/* Privacy callout */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Zero student profiling: Name and date lines are printed blank for handwriting. No roster data is ever collected or transmitted.
              </span>
            </div>
          </div>

          {/* Puzzle Selection List */}
          <div className="p-5 bg-white dark:bg-[#1A2032] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Select Puzzles ({selectedIds.length} chosen)
                </h2>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Pick puzzles to include in this worksheet.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[#4658C9] dark:text-[#818CF8] hover:underline cursor-pointer"
                >
                  Select Page
                </button>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">|</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Theme filter tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
              {[
                { id: 'all', label: 'All' },
                { id: 'mateIn1', label: 'Mate in 1' },
                { id: 'mateIn2', label: 'Mate in 2' },
                { id: 'fork', label: 'Forks' },
                { id: 'pin', label: 'Pins' },
                { id: 'skewer', label: 'Skewers' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterTheme(t.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    filterTheme === t.id
                      ? 'bg-[#4658C9] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Puzzle item checkboxes */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {pageEntries.map((p) => {
                const isChecked = selectedIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelect(p.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-[#4658C9] dark:border-[#818CF8] bg-[#4658C9]/10 dark:bg-[#4658C9]/25'
                        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-[#1A2032]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#4658C9] dark:text-[#818CF8] shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-slate-950 dark:text-white truncate">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold truncate">
                          Rating {p.rating} • {p.sideToMove === 'w' ? 'White' : 'Black'} to move
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      {p.difficultyBand}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pagination — records load per page, not for the whole corpus */}
            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  disabled={safePage === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2032] text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {safePage + 1} / {pageCount}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(pageCount - 1, prev + 1))}
                  disabled={safePage >= pageCount - 1}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2032] text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Sheet Preview & Export Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky top-6">
          <div className="p-5 bg-white dark:bg-[#1A2032] border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#4658C9] dark:text-[#818CF8]" />
                <span>Worksheet Preview</span>
              </h2>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                {Math.ceil(selectedPuzzles.length / options.puzzlesPerPage)} Page(s)
              </span>
            </div>

            {/* Scaled Visual Paper Sheet Preview */}
            <div className="w-full aspect-[1/1.3] bg-white border-2 border-slate-300 rounded-lg shadow-inner p-4 overflow-hidden flex flex-col text-slate-950">
              {/* Sheet header */}
              <div className="border-b border-slate-200 pb-2 mb-3">
                <div className="text-[11px] font-black truncate">{options.title}</div>
                <div className="text-[8px] text-slate-500 font-semibold">plyquest.pages.dev • Free chess worksheets</div>
                {(options.studentNameField || options.dateField) && (
                  <div className="flex justify-between text-[8px] mt-1 text-slate-700 font-bold">
                    {options.studentNameField && <span>Name: _______________</span>}
                    {options.dateField && <span>Date: _________</span>}
                  </div>
                )}
              </div>

              {/* Grid of preview diagrams */}
              {selectedPuzzles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <FileText className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    No puzzles selected yet. Choose at least one puzzle from the list to preview.
                  </p>
                </div>
              ) : (
                <div
                  className={`flex-1 grid gap-2 ${
                    options.puzzlesPerPage === 1
                      ? 'grid-cols-1 grid-rows-1'
                      : options.puzzlesPerPage === 2
                      ? 'grid-cols-1 grid-rows-2'
                      : options.puzzlesPerPage === 4
                      ? 'grid-cols-2 grid-rows-2'
                      : 'grid-cols-2 grid-rows-3'
                  }`}
                >
                  {selectedPuzzles.slice(0, options.puzzlesPerPage).map((pz, i) => (
                    <div
                      key={pz.id}
                      className="border border-slate-200 rounded p-1.5 flex flex-col justify-between bg-slate-50"
                    >
                      <div className="text-[9px] font-bold text-slate-900 truncate">
                        {i + 1}. {pz.title}
                      </div>
                      <div className="text-[8px] text-[#4658C9] font-bold truncate">
                        {pz.objective}
                      </div>
                      <div className="w-full aspect-square max-w-[85px] mx-auto my-0.5">
                        <ChessBoard
                          fen={pz.solverFen}
                          orientation={pz.sideToMove}
                          interactive={false}
                          showCoordinates={false}
                          className="w-full h-full rounded shadow-none"
                        />
                      </div>
                      <div className="text-[7px] text-slate-500 font-bold">Solution: ____________</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Buttons */}
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handleDownload}
                disabled={selectedPuzzles.length === 0 || isExporting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#4658C9] text-white text-sm font-bold hover:bg-[#3548C5] shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting ? 'Generating PDF...' : `Download Worksheet PDF (${selectedPuzzles.length} Puzzles)`}
                </span>
              </button>

              {options.answerMode === 'separate_pdf' && (
                <button
                  type="button"
                  onClick={handleDownloadAnswerKey}
                  disabled={selectedPuzzles.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white bg-white dark:bg-[#1A2032] text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileText className="w-4 h-4 text-[#4658C9] dark:text-[#818CF8]" />
                  <span>Download Separate Answer Key PDF</span>
                </button>
              )}

              <a
                href={MONETAG_DIRECT_LINK}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>
                  <span className="uppercase text-[10px] font-black tracking-wider text-slate-500 dark:text-slate-400 mr-1.5">
                    Sponsored
                  </span>
                  Offers from our partners
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
