import React, { useState } from 'react';
import {
  Shield,
  Lock,
  FileText,
  AlertTriangle,
  Scale,
  Eye,
  Mail,
  Trash2,
  Download,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { clearAllLocalProgress, exportLocalDataJson, getCookieConsent, setCookieConsent } from '../utils/storage';

interface LegalPagesProps {
  page:
    | 'about'
    | 'privacy'
    | 'cookies'
    | 'terms'
    | 'disclaimer'
    | 'copyright'
    | 'licenses'
    | 'security'
    | 'accessibility'
    | 'contact';
  onNavigate: (route: string) => void;
}

export const LegalPages: React.FC<LegalPagesProps> = ({ page, onNavigate }) => {
  const [dataCleared, setDataCleared] = useState(false);
  const [consentStatus, setConsentStatusState] = useState(getCookieConsent().status);

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear your local puzzle solve streak and progress? This cannot be undone.')) {
      clearAllLocalProgress();
      setDataCleared(true);
      setTimeout(() => setDataCleared(false), 4000);
    }
  };

  const handleExportData = () => {
    const json = exportLocalDataJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plyquest_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateConsent = (status: 'accepted' | 'rejected') => {
    setCookieConsent(status);
    setConsentStatusState(status);
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-10">
      {/* 1. ABOUT PAGE */}
      {page === 'about' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4658C9]/10 text-[#4658C9] text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            Product Mission & Architecture
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            About PlyQuest
          </h1>
          <p className="text-base text-[#626C82] dark:text-[#8E9BB5] leading-relaxed">
            PlyQuest is a free, fast, static-first chess tactics training platform. Our vision is to make high-quality, short-form chess tactical practice effortless on any device.
          </p>

          <div className="p-6 bg-white dark:bg-[#1A2032] border border-[#DCE1EC] dark:border-[#2B334D] rounded-xl space-y-4">
            <h2 className="text-lg font-bold text-[#171B34] dark:text-[#F3F5FC]">
              Core Principles
            </h2>
            <ul className="space-y-2.5 text-sm text-[#626C82] dark:text-[#8E9BB5]">
              <li className="flex items-start gap-2">
                <span className="text-[#4658C9] font-bold">•</span>
                <span><strong>No Forced Accounts:</strong> Solve puzzles instantly without signing up, passwords, or subscriptions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4658C9] font-bold">•</span>
                <span><strong>Static-First Delivery:</strong> Move legality, progressive hints, and board validation run directly in your browser.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4658C9] font-bold">•</span>
                <span><strong>Teacher & Coach Friendly:</strong> Generate clean PDF worksheets with optional separate answer keys in seconds.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4658C9] font-bold">•</span>
                <span><strong>Calm, Respectful Design:</strong> Clear Staunton pieces, non-glare Midnight Indigo + Blue-Gray palette, and no deceptive ads.</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-[#F7F8FC] dark:bg-[#101321] border border-[#DCE1EC] dark:border-[#2B334D] rounded-lg text-xs text-[#626C82] dark:text-[#8E9BB5]">
            <strong>Notice of Non-Affiliation:</strong> PlyQuest is an independent educational product. It is not affiliated with, endorsed by, or connected to Lichess, Chess.com, or the International Chess Federation (FIDE).
          </div>
        </div>
      )}

      {/* 2. PRIVACY POLICY */}
      {page === 'privacy' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#087F79]/10 text-[#087F79] text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            Privacy & Data Inventory
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#626C82] dark:text-[#8E9BB5]">
            Last updated: 20 October 2026 • Baseline compliant with India DPDP Act 2023 & global data protection frameworks.
          </p>

          <div className="space-y-4 text-sm text-[#626C82] dark:text-[#8E9BB5] leading-relaxed">
            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              1. Our Data Commitment
            </h2>
            <p>
              PlyQuest is built on a <em>data-minimisation baseline</em>. We do not require registration, passwords, email addresses, phone numbers, or social media logins.
            </p>

            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              2. Data Inventory & Processing Activities
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#DCE1EC] dark:border-[#2B334D] rounded-lg">
                <thead className="bg-[#F7F8FC] dark:bg-[#101321] text-[#171B34] dark:text-[#F3F5FC]">
                  <tr>
                    <th className="p-2.5 border-b">Category</th>
                    <th className="p-2.5 border-b">Storage Location</th>
                    <th className="p-2.5 border-b">Transmission</th>
                    <th className="p-2.5 border-b">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE1EC] dark:divide-[#2B334D]">
                  <tr>
                    <td className="p-2.5 font-semibold">Streak & Solved Puzzles</td>
                    <td className="p-2.5">Browser LocalStorage</td>
                    <td className="p-2.5">None (0 bytes sent to server)</td>
                    <td className="p-2.5">Save your solving progress locally</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Board Theme & UI Mode</td>
                    <td className="p-2.5">Browser LocalStorage</td>
                    <td className="p-2.5">None</td>
                    <td className="p-2.5">Retain your preferred contrast/theme</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Hosting & CDN Logs</td>
                    <td className="p-2.5">Cloudflare / Static Host</td>
                    <td className="p-2.5">Standard HTTP(S) request headers</td>
                    <td className="p-2.5">Security, DDoS protection, edge routing</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold">Worksheet Student Fields</td>
                    <td className="p-2.5">Browser Memory Only</td>
                    <td className="p-2.5">None (0 bytes sent to server)</td>
                    <td className="p-2.5">Print blank Name/Date line on PDF</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              3. Children and Family Safety
            </h2>
            <p>
              PlyQuest does not collect personal identifiers from minors, does not operate user chatrooms, and does not conduct behavioral profiling on children. Optional classroom worksheet features print blank fields locally for handwriting.
            </p>

            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              4. Your Data Rights & Controls
            </h2>
            <p>
              You maintain absolute control over all data stored by PlyQuest in your browser. You can export or delete your local solving streak at any time.
            </p>
          </div>

          {/* Local Data Controls Box */}
          <div className="p-5 bg-white dark:bg-[#1A2032] border border-[#DCE1EC] dark:border-[#2B334D] rounded-xl">
            <h3 className="text-sm font-bold text-[#171B34] dark:text-[#F3F5FC] mb-2">
              Manage Your Local Browser Data
            </h3>
            <p className="text-xs text-[#626C82] dark:text-[#8E9BB5] mb-4">
              All progress is kept only on this device. You can download a backup copy or erase all records.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#4658C9] text-[#4658C9] hover:bg-[#4658C9]/5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export My Data (.json)
              </button>
              <button
                type="button"
                onClick={handleClearData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#B83D50] text-[#B83D50] hover:bg-[#B83D50]/5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Local Data
              </button>
              {dataCleared && (
                <span className="text-xs text-[#087F79] font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Local storage successfully wiped!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. COOKIES & STORAGE */}
      {page === 'cookies' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4658C9]/10 text-[#4658C9] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Cookie & Device Storage Inventory
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            Cookie & Local Storage Policy
          </h1>
          <p className="text-sm text-[#626C82] dark:text-[#8E9BB5]">
            Transparent accounting of all device storage used by PlyQuest.
          </p>

          <div className="space-y-4 text-sm text-[#626C82] dark:text-[#8E9BB5] leading-relaxed">
            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              Essential Local Storage Keys
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[#DCE1EC] dark:border-[#2B334D] rounded-lg">
                <thead className="bg-[#F7F8FC] dark:bg-[#101321] text-[#171B34] dark:text-[#F3F5FC]">
                  <tr>
                    <th className="p-2.5 border-b">Key Name</th>
                    <th className="p-2.5 border-b">Type</th>
                    <th className="p-2.5 border-b">Duration</th>
                    <th className="p-2.5 border-b">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE1EC] dark:divide-[#2B334D]">
                  <tr>
                    <td className="p-2.5 font-mono text-[11px]">cb_board_theme</td>
                    <td className="p-2.5">localStorage</td>
                    <td className="p-2.5">Persistent</td>
                    <td className="p-2.5">Stores selected board theme (Ocean Slate, Classic, etc.)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-[11px]">cb_ui_mode</td>
                    <td className="p-2.5">localStorage</td>
                    <td className="p-2.5">Persistent</td>
                    <td className="p-2.5">Stores light/dark UI shell preference</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-[11px]">cb_user_stats</td>
                    <td className="p-2.5">localStorage</td>
                    <td className="p-2.5">Persistent</td>
                    <td className="p-2.5">Tracks your daily streak and solved puzzle IDs locally</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-mono text-[11px]">cb_cookie_consent</td>
                    <td className="p-2.5">localStorage</td>
                    <td className="p-2.5">Persistent</td>
                    <td className="p-2.5">Remembers your preference selection</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Consent Controls */}
            <div className="p-5 bg-white dark:bg-[#1A2032] border border-[#DCE1EC] dark:border-[#2B334D] rounded-xl mt-6">
              <h3 className="text-sm font-bold text-[#171B34] dark:text-[#F3F5FC] mb-2">
                Your Advertising & Storage Preferences
              </h3>
              <p className="text-xs text-[#626C82] dark:text-[#8E9BB5] mb-4">
                Current Status:{' '}
                <span className="font-semibold text-[#4658C9] uppercase">
                  {consentStatus}
                </span>
                . In this build, zero third-party advertising tags or tracking cookies are executed.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateConsent('accepted')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#4658C9] text-white hover:bg-[#3548C5] transition-colors"
                >
                  Accept Essential Storage
                </button>
                <button
                  type="button"
                  onClick={() => updateConsent('rejected')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#DCE1EC] dark:border-[#2B334D] text-[#171B34] dark:text-[#F3F5FC] hover:bg-gray-100 dark:hover:bg-[#252B52] transition-colors"
                >
                  Reject Non-Essential
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TERMS OF SERVICE */}
      {page === 'terms' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4658C9]/10 text-[#4658C9] text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            Terms of Service
          </h1>
          <p className="text-sm text-[#626C82] dark:text-[#8E9BB5]">
            Please read these terms carefully before using PlyQuest.
          </p>

          <div className="space-y-4 text-sm text-[#626C82] dark:text-[#8E9BB5] leading-relaxed">
            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              1. Educational Use Only
            </h2>
            <p>
              PlyQuest provides tactical chess puzzles and worksheet generation tools for recreational, learning, and instructional purposes only. We do not provide official chess rating certifications, FIDE ratings, or commercial warranties.
            </p>

            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              2. Permitted and Prohibited Conduct
            </h2>
            <p>
              You may solve puzzles, generate worksheets for personal or educational classroom use, and share puzzle links. You agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Engage in automated scraping or bulk scraping of the site in a manner that degrades service.</li>
              <li>Inject malicious scripts, exploit vulnerabilities, or bypass rate limits.</li>
              <li>Attempt fraudulent ad-clicking or generate artificial traffic.</li>
            </ul>

            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              3. Service Availability & Changes
            </h2>
            <p>
              PlyQuest is provided on an "as is" and "as available" basis without warranties of any kind. We reserve the right to update, modify, or remove puzzle content to correct tactical defects or comply with intellectual property requirements.
            </p>
          </div>
        </div>
      )}

      {/* 5. DISCLAIMER */}
      {page === 'disclaimer' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2A65A]/20 text-[#171B34] text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-[#F2A65A]" />
            Educational Disclaimer
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            Disclaimer
          </h1>
          <div className="space-y-4 text-sm text-[#626C82] dark:text-[#8E9BB5] leading-relaxed">
            <p>
              All tactical puzzles on PlyQuest are provided strictly for educational practice and enjoyment. While all puzzle positions and solutions undergo rules-engine verification with <code>chess.js</code>, historical chess positions may occasionally have alternative winning defenses or dual lines.
            </p>
            <p>
              Ratings shown for puzzles represent approximate historical difficulty classifications and do not constitute an official FIDE, USCF, or national federation rating.
            </p>
          </div>
        </div>
      )}

      {/* 6. COPYRIGHT & TAKEDOWN */}
      {page === 'copyright' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B83D50]/10 text-[#B83D50] text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            Content Rights & Takedown Procedure
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            Copyright & Takedown
          </h1>
          <p className="text-sm text-[#626C82] dark:text-[#8E9BB5]">
            PlyQuest respects all intellectual property rights and maintains a responsive removal and correction procedure.
          </p>

          <div className="space-y-4 text-sm text-[#626C82] dark:text-[#8E9BB5] leading-relaxed">
            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              Notice & Takedown Protocol
            </h2>
            <p>
              If you believe any content or tactical record on PlyQuest infringes your rights or contains defective source data, please email our designated content agent at:
            </p>
            <div className="p-4 bg-white dark:bg-[#1A2032] border border-[#DCE1EC] dark:border-[#2B334D] rounded-lg font-mono text-xs text-[#4658C9]">
              austinthambi85@gmail.com
            </div>
            <p>
              Please include: (1) your name and contact details, (2) the exact puzzle ID or URL, (3) a clear description of the alleged infringement or source issue, and (4) your good-faith statement. Disputed records are suppressed via our build denylist pending verification.
            </p>
          </div>
        </div>
      )}

      {/* 7. LICENCES & PROVENANCE */}
      {page === 'licenses' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4658C9]/10 text-[#4658C9] text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            Software Bill of Materials & Provenance
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            Licences & Provenance
          </h1>

          <div className="space-y-6 text-sm text-[#626C82] dark:text-[#8E9BB5] leading-relaxed">
            {/* Lichess CC0 Dataset notice */}
            <div className="p-5 bg-white dark:bg-[#1A2032] border border-[#DCE1EC] dark:border-[#2B334D] rounded-xl">
              <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC] mb-2">
                1. Chess Puzzle Corpus Provenance
              </h2>
              <p className="text-xs leading-relaxed mb-3">
                Tactical chess positions on PlyQuest originate from the open chess puzzle dataset published by Lichess.org, dedicated to the public domain under the Creative Commons Zero (CC0 1.0 Universal) license. The dataset permits free commercial use, modification, and redistribution.
              </p>
              <div className="text-xs space-y-1 font-mono text-[#626C82]">
                <p>Dataset: Lichess Open Puzzles (CC0)</p>
                <p>Transform: Setup move applied; rank-reflected symmetric variants validated through rules replay.</p>
                <p>Website Attribution Notice: Included as transparent good-faith citation.</p>
              </div>
            </div>

            {/* Piece artwork notice */}
            <div className="p-5 bg-white dark:bg-[#1A2032] border border-[#DCE1EC] dark:border-[#2B334D] rounded-xl">
              <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC] mb-2">
                2. Staunton Piece Vector Assets
              </h2>
              <p className="text-xs leading-relaxed mb-3">
                All 12 Staunton chess piece vectors are local, self-contained SVG assets complying with PRD v2.2 color specifications (#FFFFFF fills, #252B52 outlines for White; #252B52 fills, #FFFFFF outlines for Black).
              </p>
              <p className="text-xs">
                Zero remote fonts or third-party image CDNs are queried for piece rendering. Full documentation is stored in <code>src/components/pieces/PIECE_MANIFEST.md</code>.
              </p>
            </div>

            {/* Open-Source Dependencies (SBOM) */}
            <div className="p-5 bg-white dark:bg-[#1A2032] border border-[#DCE1EC] dark:border-[#2B334D] rounded-xl">
              <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC] mb-3">
                3. Open Source Software Bill of Materials (SBOM)
              </h2>
              <ul className="space-y-2 text-xs">
                <li className="flex justify-between border-b pb-1.5 border-[#DCE1EC] dark:border-[#2B334D]">
                  <span className="font-semibold text-[#171B34] dark:text-[#F3F5FC]">chess.js (v1.0.0-beta.9)</span>
                  <span className="font-mono text-[#4658C9]">BSD-2-Clause</span>
                </li>
                <li className="flex justify-between border-b pb-1.5 border-[#DCE1EC] dark:border-[#2B334D]">
                  <span className="font-semibold text-[#171B34] dark:text-[#F3F5FC]">jspdf (v2.5.2)</span>
                  <span className="font-mono text-[#4658C9]">MIT</span>
                </li>
                <li className="flex justify-between border-b pb-1.5 border-[#DCE1EC] dark:border-[#2B334D]">
                  <span className="font-semibold text-[#171B34] dark:text-[#F3F5FC]">lucide-react (v0.546.0)</span>
                  <span className="font-mono text-[#4658C9]">ISC</span>
                </li>
                <li className="flex justify-between border-b pb-1.5 border-[#DCE1EC] dark:border-[#2B334D]">
                  <span className="font-semibold text-[#171B34] dark:text-[#F3F5FC]">react & react-dom (v19.0.1)</span>
                  <span className="font-mono text-[#4658C9]">MIT</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 8. SECURITY */}
      {page === 'security' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#087F79]/10 text-[#087F79] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Security & Responsible Disclosure
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            Security Disclosures
          </h1>
          <div className="space-y-4 text-sm text-[#626C82] dark:text-[#8E9BB5] leading-relaxed">
            <p>
              PlyQuest employs a static-first, zero-backend attack surface:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>No database containing user credentials, passwords, or emails.</li>
              <li>Strict Content Security Policy (CSP) and HSTS transport security headers.</li>
              <li>All puzzle parsing and move inputs are strictly sanitised and validated using deterministic rules.</li>
            </ul>
            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              Vulnerability Reporting
            </h2>
            <p>
              If you identify a security issue, please contact us promptly at <code>austinthambi85@gmail.com</code>. We acknowledge receipt within 24 hours.
            </p>
          </div>
        </div>
      )}

      {/* 9. ACCESSIBILITY */}
      {page === 'accessibility' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4658C9]/10 text-[#4658C9] text-xs font-semibold">
            <Eye className="w-3.5 h-3.5" />
            WCAG 2.2 AA Accessibility Statement
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            Accessibility
          </h1>
          <div className="space-y-4 text-sm text-[#626C82] dark:text-[#8E9BB5] leading-relaxed">
            <p>
              PlyQuest targets full compliance with Web Content Accessibility Guidelines (WCAG) 2.2 Level AA.
            </p>
            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              Key Accessibility Features
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Keyboard Operable:</strong> Every chessboard square can be navigated via Tab and activated with Enter/Space.
              </li>
              <li>
                <strong>High Contrast Theme:</strong> In addition to the default Ocean Slate theme, a pure Black & White High Contrast board theme is selectable in one click.
              </li>
              <li>
                <strong>Non-Colour-Only Feedback:</strong> Moves, errors, and checks are always accompanied by distinct icons and explicit textual announcements for screen readers.
              </li>
              <li>
                <strong>Reduced Motion:</strong> Full support for <code>prefers-reduced-motion</code> disables animations.
              </li>
              <li>
                <strong>Touch Target Sizing:</strong> Primary interactive controls are sized at or above 48x48 CSS pixels.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 10. CONTACT */}
      {page === 'contact' && (
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4658C9]/10 text-[#4658C9] text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            Get in Touch
          </div>
          <h1 className="text-3xl font-extrabold text-[#171B34] dark:text-[#F3F5FC]">
            Contact PlyQuest
          </h1>
          <p className="text-sm text-[#626C82] dark:text-[#8E9BB5]">
            Have feedback, noticed an incorrect puzzle solution, or want to suggest a new tactical feature?
          </p>

          <div className="p-6 bg-white dark:bg-[#1A2032] border border-[#DCE1EC] dark:border-[#2B334D] rounded-xl space-y-3">
            <h2 className="text-base font-bold text-[#171B34] dark:text-[#F3F5FC]">
              Primary Contact Email
            </h2>
            <p className="text-sm text-[#4658C9] font-mono font-semibold">
              austinthambi85@gmail.com
            </p>
            <p className="text-xs text-[#626C82] dark:text-[#8E9BB5]">
              Responses typically sent within 1-2 business days.
            </p>
          </div>
        </div>
      )}
    </article>
  );
};
