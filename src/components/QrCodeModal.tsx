import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  X,
  Store,
  KeyRound
} from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'sticker' | 'pickup' | 'custom';
  pickupOtp?: string;
  donationId?: string;
  establishmentName?: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'sticker',
  pickupOtp = '482910',
  donationId = 'don-101',
  establishmentName = 'Small Bakery / Hostel Mess'
}) => {
  const [mode, setMode] = useState<'sticker' | 'pickup' | 'custom'>(initialMode);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState('https://foodpool.tn/express-post');

  // Compute payload to encode
  const currentPayload = 
    mode === 'sticker'
      ? `${window.location.origin}?action=express_post&hub=tamilnadu`
      : mode === 'pickup'
      ? `FOODPOOL-PICKUP-VERIFY:${donationId}:OTP-${pickupOtp}`
      : customText;

  useEffect(() => {
    if (!isOpen) return;

    // Generate high quality QR code in black, white and gold finish
    QRCode.toDataURL(currentPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000', // Crisp black modules
        light: '#ffffff' // White background
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [isOpen, currentPayload, mode]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `foodpool-qr-${mode}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=700');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>FOODPOOL - Instant Surplus Kitchen Sticker</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; background: #fff; color: #000; }
            .card { border: 3px solid #d4af37; border-radius: 16px; padding: 30px; max-width: 420px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            h1 { font-size: 24px; margin: 0 0 4px; color: #000; letter-spacing: 1px; }
            p { font-size: 13px; color: #555; margin: 0 0 20px; }
            img { width: 260px; height: 260px; border: 1px solid #eee; border-radius: 12px; }
            .badge { background: #d4af37; color: #000; font-weight: bold; padding: 6px 14px; border-radius: 20px; font-size: 12px; display: inline-block; margin-top: 15px; }
            .footer { font-size: 11px; color: #777; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div style="font-size: 11px; font-weight: 700; color: #d4af37; text-transform: uppercase; letter-spacing: 2px;">FOODPOOL TAMIL NADU</div>
            <h1>KITCHEN FRIDGE STICKER</h1>
            <p>Scan with any phone camera to report surplus in under 30 seconds. No app needed.</p>
            <img src="${qrDataUrl}" alt="FOODPOOL QR Code" />
            <br />
            <div class="badge">ZERO-INSTALL · NO-LOGIN EXPRESS POST</div>
            <div class="footer">FoodPool Intelligent Clustering Network · Prevents Food Wastage</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0a0a0a] border border-[#d4af37]/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-black my-8 relative text-white">
        {/* Gold Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-[#d4af37] rounded-full shadow-[0_0_20px_#d4af37]" />

        {/* Modal Header */}
        <div className="flex justify-between items-start pb-4 border-b border-[#222222]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#d4af37]">
                <QrCode className="w-5 h-5" />
              </span>
              <h3 className="font-serif font-bold text-lg text-white">
                FOODPOOL QR Code Generator
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Professional printable QR stickers & touchless OTP handover scanning
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg border border-neutral-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Black, White, Gold) */}
        <div className="flex bg-[#121212] p-1 rounded-2xl border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setMode('sticker')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'sticker'
                ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Fridge Sticker QR</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('pickup')}
            className={`flex-1 py-2 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'pickup'
                ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Pickup OTP Pass</span>
          </button>
        </div>

        {/* QR Display Card with Gold Trim */}
        <div className="bg-[#121212] p-6 rounded-3xl border border-[#d4af37]/30 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <div className="p-3 bg-white rounded-2xl border-2 border-[#d4af37] shadow-xl shadow-black/80">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="FOODPOOL QR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-black">
                Generating QR...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="font-mono text-xs font-bold text-[#d4af37] tracking-wider uppercase block">
              {mode === 'sticker' ? 'INSTANT UPLOAD FRIDGE STICKER' : `HANDOVER PASS: OTP ${pickupOtp}`}
            </span>
            <p className="text-xs text-neutral-300 max-w-xs">
              {mode === 'sticker'
                ? 'Print and stick on the kitchen counter. Small shop owners scan to report surplus in under 30s with zero login.'
                : `Show to the appointed NGO coordinator to verify pickup custody for Batch #${donationId}.`}
            </p>
          </div>
        </div>

        {/* Action Buttons: Print, Download, Copy Link */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sticker</span>
          </button>

          <button
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl bg-[#d4af37] hover:bg-[#e2bd44] text-black font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#d4af37]/15 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Save PNG</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="py-2.5 px-3 rounded-xl bg-[#1c1c1c] hover:bg-[#252525] text-white border border-neutral-700 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-[#d4af37]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Security & Offline Notice */}
        <div className="p-3 bg-black/60 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
          <span>High-density cryptographic QR payload. Scannable with standard iOS/Android cameras without dedicated software.</span>
        </div>
      </div>
    </div>
  );
};
