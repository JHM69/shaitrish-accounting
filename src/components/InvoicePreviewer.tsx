import React from 'react';
import { X, ExternalLink, Copy, Check, Download, AlertCircle, FileText } from 'lucide-react';

interface InvoicePreviewerProps {
  isOpen: boolean;
  fileLink: string;
  title: string;
  amountLabel?: string;
  onClose: () => void;
}

export function getDriveEmbedUrl(url: string): string | null {
  if (!url) return null;

  // 1. Google Drive view/edit file link
  // Matches .../file/d/[ID]/view... or .../file/d/[ID]/edit... or /open?id=[ID]
  const driveFileRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9-_]+)/i;
  const driveFileMatch = url.match(driveFileRegex);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }

  // 2. Google Docs
  const docsRegex = /docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/i;
  const docsMatch = url.match(docsRegex);
  if (docsMatch && docsMatch[1]) {
    return `https://docs.google.com/document/d/${docsMatch[1]}/preview`;
  }

  // 3. Google Sheets
  const sheetsRegex = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i;
  const sheetsMatch = url.match(sheetsRegex);
  if (sheetsMatch && sheetsMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/preview`;
  }

  // 4. Google Slides
  const slidesRegex = /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9-_]+)/i;
  const slidesMatch = url.match(slidesRegex);
  if (slidesMatch && slidesMatch[1]) {
    return `https://docs.google.com/presentation/d/${slidesMatch[1]}/preview`;
  }

  // If it's already an https/http link, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return null;
}

export default function InvoicePreviewer({
  isOpen,
  fileLink,
  title,
  amountLabel,
  onClose,
}: InvoicePreviewerProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !fileLink) return null;

  const embedUrl = getDriveEmbedUrl(fileLink);
  const isGoogleDrive = fileLink.includes('drive.google.com') || fileLink.includes('docs.google.com');

  const handleCopy = () => {
    navigator.clipboard.writeText(fileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-end font-sans" id="invoice-preview-portal">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h2>
              <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5 max-w-[250px] sm:max-w-md truncate" title={fileLink}>
                <span>Invoice URL:</span>
                <span className="underline hover:text-indigo-600">{fileLink}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {amountLabel && (
              <span className="hidden sm:inline-block px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold font-mono rounded-xl border border-indigo-100/40 mr-2">
                {amountLabel}
              </span>
            )}

            {/* Copy Link Button */}
            <button
              onClick={handleCopy}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Copy original file URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Open Original Link */}
            <a
              href={fileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors inline-flex cursor-pointer"
              title="Open full document in Google Drive / new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Panel */}
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100 ml-1"
              title="Close Preview Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info notice about Google Drive permission if embed fails */}
        {isGoogleDrive && (
          <div className="px-6 py-2 bg-indigo-50 text-indigo-800 text-[11px] font-medium border-b border-indigo-100/30 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Make sure the file in Google Drive has <strong>"Anyone with the link can view"</strong> permission for inline preview to load.</span>
            </span>
            <a
              href={fileLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-bold font-mono shrink-0"
            >
              Open Directly ↗
            </a>
          </div>
        )}

        {/* Embed Body */}
        <div className="grow bg-slate-100 p-4 flex flex-col justify-center items-center overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-xl border border-slate-200 bg-white shadow-inner"
              allow="autoplay"
              title="Google Drive Document Preview"
              id="google-drive-invoice-iframe"
            />
          ) : (
            <div className="max-w-md text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Unsupported Document Source</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We couldn't generate an interactive iframe preview for this link. You can open the file link directly in Google Drive to view.
              </p>
              <a
                href={fileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>Open Document Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
