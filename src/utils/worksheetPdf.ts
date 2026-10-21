import { jsPDF } from 'jspdf';
import { Chess } from 'chess.js';
import { PuzzleRecord } from '../types/puzzle';

export interface WorksheetOptions {
  paperSize: 'a4' | 'letter';
  puzzlesPerPage: 1 | 2 | 4 | 6;
  answerMode: 'none' | 'at_end' | 'separate_pdf';
  includeQrCode: boolean;
  studentNameField: boolean;
  dateField: boolean;
  title: string;
}

// Unicode Staunton piece representations for crisp vector text output in PDF
const PIECE_UNICODE: Record<string, string> = {
  K: 'K',
  Q: 'Q',
  R: 'R',
  B: 'B',
  N: 'N',
  P: 'P',
  k: 'k',
  q: 'q',
  r: 'r',
  b: 'b',
  n: 'n',
  p: 'p',
};

/**
 * Draws a clean 8x8 chess diagram on a jsPDF document
 */
function drawBoardDiagram(
  doc: jsPDF,
  fen: string,
  x: number,
  y: number,
  size: number,
  sideToMove: 'w' | 'b'
) {
  const squareSize = size / 8;
  const chess = new Chess(fen);
  const board = chess.board();

  // White / Dark squares in calm print-friendly tones
  const lightHex = '#F7F8FC';
  const darkHex = '#DCE1EC';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      const sqX = x + c * squareSize;
      const sqY = y + r * squareSize;

      doc.setFillColor(isLight ? lightHex : darkHex);
      doc.rect(sqX, sqY, squareSize, squareSize, 'F');

      const piece = board[r][c];
      if (piece) {
        const symbol = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(squareSize * 1.5);
        if (piece.color === 'w') {
          doc.setTextColor(37, 43, 82); // brand-800
        } else {
          doc.setTextColor(17, 20, 40); // dark
        }
        // Center text in square
        doc.text(
          symbol,
          sqX + squareSize / 2,
          sqY + squareSize * 0.72,
          { align: 'center' }
        );
      }
    }
  }

  // Draw board border
  doc.setDrawColor(37, 43, 82);
  doc.setLineWidth(0.5);
  doc.rect(x, y, size, size, 'S');

  // File labels (a-h)
  doc.setFontSize(7);
  doc.setTextColor(98, 108, 130);
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  for (let c = 0; c < 8; c++) {
    doc.text(files[c], x + c * squareSize + squareSize / 2, y + size + 3, { align: 'center' });
  }

  // Rank labels (8-1)
  for (let r = 0; r < 8; r++) {
    doc.text(String(8 - r), x - 2, y + r * squareSize + squareSize / 2 + 1, { align: 'right' });
  }

  // Side to move badge below
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const turnText = sideToMove === 'w' ? 'White to move' : 'Black to move';
  doc.text(turnText, x + size / 2, y + size + 7, { align: 'center' });
}

/**
 * Generates the questions PDF (with optional answers at the end)
 */
export function generateWorksheetPdf(
  puzzles: PuzzleRecord[],
  options: WorksheetOptions
): void {
  const isA4 = options.paperSize === 'a4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  const puzzlesPerPage = options.puzzlesPerPage;
  let currentIdx = 0;
  let pageNum = 1;

  while (currentIdx < puzzles.length) {
    if (pageNum > 1) {
      doc.addPage();
    }

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(23, 27, 52); // brand-950
    doc.text(options.title || 'Chessbitz Tactical Worksheet', margin, margin + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(98, 108, 130);
    doc.text('chessbitz.com • Free chess tactics training', margin, margin + 9);

    // Optional student name and date fields (never uploaded)
    let headerY = margin + 14;
    if (options.studentNameField || options.dateField) {
      doc.setFontSize(9);
      doc.setTextColor(37, 43, 82);
      if (options.studentNameField) {
        doc.text('Name: _______________________________', margin, headerY);
      }
      if (options.dateField) {
        doc.text('Date: _______________', pageWidth - margin - 45, headerY);
      }
      headerY += 8;
    }

    // Layout configuration based on puzzlesPerPage
    let cols = 1;
    let rows = 1;
    let boardSize = 85;

    if (puzzlesPerPage === 1) {
      cols = 1;
      rows = 1;
      boardSize = 100;
    } else if (puzzlesPerPage === 2) {
      cols = 1;
      rows = 2;
      boardSize = 75;
    } else if (puzzlesPerPage === 4) {
      cols = 2;
      rows = 2;
      boardSize = 60;
    } else if (puzzlesPerPage === 6) {
      cols = 2;
      rows = 3;
      boardSize = 48;
    }

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - headerY - margin;
    const colWidth = availableWidth / cols;
    const rowHeight = availableHeight / rows;

    for (let r = 0; r < rows && currentIdx < puzzles.length; r++) {
      for (let c = 0; c < cols && currentIdx < puzzles.length; c++) {
        const puzzle = puzzles[currentIdx];
        const cellX = margin + c * colWidth;
        const cellY = headerY + r * rowHeight;

        // Puzzle number & title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(23, 27, 52);
        doc.text(`${currentIdx + 1}. ${puzzle.title}`, cellX, cellY + 5);

        // Objective (NO SPOILERS)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(70, 88, 201); // brand-600
        doc.text(puzzle.objective, cellX, cellY + 10);

        // Draw Board
        const boardY = cellY + 14;
        const boardX = cellX + Math.max(0, (colWidth - boardSize) / 2);
        drawBoardDiagram(doc, puzzle.solverFen, boardX, boardY, boardSize, puzzle.sideToMove);

        // Space for solver answer line
        doc.setFontSize(8);
        doc.setTextColor(98, 108, 130);
        doc.text('Solution: _________________________________', cellX, boardY + boardSize + 16);

        currentIdx++;
      }
    }

    // Page footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 6, { align: 'center' });

    pageNum++;
  }

  // Answer Key Page at End (if selected)
  if (options.answerMode === 'at_end') {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(23, 27, 52);
    doc.text('Answer Key', margin, margin + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(98, 108, 130);
    doc.text('Verified solution lines for this worksheet', margin, margin + 9);

    let ansY = margin + 18;
    puzzles.forEach((puzzle, idx) => {
      // Print puzzle title and solution
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(23, 27, 52);
      doc.text(`${idx + 1}. ${puzzle.title} (${puzzle.objective})`, margin, ansY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(70, 88, 201);
      // Format solution in UCI/SAN
      const solverMoves = puzzle.moves.slice(1).join(' ');
      doc.text(`Move sequence: ${solverMoves}`, margin + 5, ansY + 5);

      doc.setFontSize(8.5);
      doc.setTextColor(98, 108, 130);
      doc.text(`Note: ${puzzle.explanation}`, margin + 5, ansY + 9);

      ansY += 15;
      if (ansY > pageHeight - margin - 15) {
        doc.addPage();
        ansY = margin + 10;
      }
    });
  }

  // Save the PDF
  const filename = `Chessbitz_Worksheet_${options.paperSize}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Generates a separate Answer Key PDF
 */
export function generateAnswerKeyPdf(puzzles: PuzzleRecord[], options: WorksheetOptions): void {
  const isA4 = options.paperSize === 'a4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : 'letter',
  });

  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(23, 27, 52);
  doc.text('Chessbitz - Answer Key', margin, margin + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(98, 108, 130);
  doc.text(`Generated on ${new Date().toLocaleDateString()} • Verified solution lines`, margin, margin + 11);

  let ansY = margin + 22;
  puzzles.forEach((puzzle, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(23, 27, 52);
    doc.text(`${idx + 1}. ${puzzle.title}`, margin, ansY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(70, 88, 201);
    const solverMoves = puzzle.moves.slice(1).join(' ');
    doc.text(`Solution: ${solverMoves}`, margin + 5, ansY + 5);

    doc.setFontSize(8.5);
    doc.setTextColor(98, 108, 130);
    doc.text(`Tactic: ${puzzle.explanation}`, margin + 5, ansY + 9);

    ansY += 16;
    if (ansY > pageHeight - margin - 15) {
      doc.addPage();
      ansY = margin + 10;
    }
  });

  const filename = `Chessbitz_AnswerKey_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
