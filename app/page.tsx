"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Loader2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Trash2,
  FileCode2,
  Image as ImageIcon,
  Terminal,
} from "lucide-react";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit
const ALLOWED_MIME_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
];
const ALLOWED_EXTENSIONS: readonly string[] = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

interface UploadedImageState {
  file: File;
  name: string;
  size: number;
  mimeType: string;
  previewUrl: string;
}

interface GenerateApiResponse {
  code?: string;
  error?: string;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

function isValidFileExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

async function hasValidImageMagicBytes(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 12) return false;

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;

    // JPEG signature: FF D8 FF
    const isJpeg =
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

    // WEBP signature: "RIFF" (52 49 46 46) ... "WEBP" (57 45 42 50)
    const isWebp =
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;

    return isPng || isJpeg || isWebp;
  } catch {
    return false;
  }
}

function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Gagal membaca file sebagai string base64."));
      }
    };
    reader.onerror = () => {
      reject(new Error("Terjadi kesalahan saat membaca file gambar."));
    };
    reader.readAsDataURL(file);
  });
}

export default function FigmaToCodePage() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImageState | null>(
    null
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup Object URL on change/unmount
  useEffect(() => {
    return () => {
      if (uploadedImage?.previewUrl) {
        URL.revokeObjectURL(uploadedImage.previewUrl);
      }
    };
  }, [uploadedImage]);

  // Cleanup copy timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const validateAndProcessFile = useCallback(
    async (file: File | undefined) => {
      setErrorMessage(null);

      if (!file) {
        return;
      }

      // 1. Validate MIME type (PNG, JPG, WEBP)
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrorMessage(
          "Format file tidak didukung. Harap unggah gambar dengan format PNG, JPG, atau WEBP."
        );
        return;
      }

      // 2. Validate file extension
      if (!isValidFileExtension(file.name)) {
        setErrorMessage(
          "Ekstensi file tidak valid. Gunakan file dengan ekstensi .png, .jpg, .jpeg, atau .webp."
        );
        return;
      }

      // 3. Validate file size (max 5MB)
      if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          "Ukuran file melebihi batas maksimal 5MB atau file kosong."
        );
        return;
      }

      // 4. Validate binary magic bytes
      const isAuthenticImage = await hasValidImageMagicBytes(file);
      if (!isAuthenticImage) {
        setErrorMessage(
          "File gambar tidak valid atau rusak. Pastikan file adalah PNG, JPG, atau WEBP asli."
        );
        return;
      }

      if (uploadedImage?.previewUrl) {
        URL.revokeObjectURL(uploadedImage.previewUrl);
      }

      const safePreviewUrl = URL.createObjectURL(file);
      setUploadedImage({
        file,
        name: sanitizeFileName(file.name),
        size: file.size,
        mimeType: file.type,
        previewUrl: safePreviewUrl,
      });
    },
    [uploadedImage]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    void validateAndProcessFile(file);
    event.target.value = "";
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    void validateAndProcessFile(file);
  };

  const handleRemoveImage = () => {
    if (uploadedImage?.previewUrl) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
    }
    setUploadedImage(null);
    setGeneratedCode("");
    setErrorMessage(null);
  };

  const handleGenerateCode = async () => {
    if (!uploadedImage) {
      setErrorMessage(
        "Silakan unggah gambar desain UI terlebih dahulu sebelum membuat kode."
      );
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const base64Image = await convertFileToBase64(uploadedImage.file);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: uploadedImage.mimeType,
        }),
      });

      const data = (await response.json()) as GenerateApiResponse;

      if (!response.ok || data.error) {
        throw new Error(
          data.error || `Gagal menghasilkan kode (Status: ${response.status}).`
        );
      }

      if (!data.code) {
        throw new Error("Respons dari Gemini API kosong.");
      }

      setGeneratedCode(data.code);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan tidak terduga saat memproses gambar.";
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;

    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage("Gagal menyalin kode ke clipboard.");
    }
  };

  const statusText = isGenerating
    ? "Gemini 1.5 Flash Analyzing UI..."
    : generatedCode
    ? "Code Generated Successfully"
    : uploadedImage
    ? "Design Ready — Click Generate"
    : "System Idle — Awaiting UI Input";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col relative overflow-x-hidden">
      {/* Cyberpunk Ambient Glow Background */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Sparkles className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-zinc-100 to-fuchsia-400 bg-clip-text text-transparent">
                  FigmaToCode AI
                </h1>
                <span className="rounded-md bg-fuchsia-500/10 border border-fuchsia-500/30 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-fuchsia-300">
                  Gemini 1.5 Flash
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Cyberpunk Neural UI-to-React &amp; Tailwind CSS Synthesizer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 text-xs font-mono text-zinc-300"
              role="status"
              aria-live="polite"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isGenerating
                    ? "bg-amber-400 animate-ping"
                    : generatedCode
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : uploadedImage
                    ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                    : "bg-zinc-500"
                }`}
              />
              <span>{statusText}</span>
            </div>

            <div
              className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-cyan-950/40 border border-cyan-800/50 px-3 py-1.5 text-xs font-mono text-cyan-300"
              title="Strict MIME & Size Validation Active"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>MAX 5MB • PNG/JPG/WEBP</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 text-sm text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-300">System Alert</p>
              <p className="text-rose-200/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Left Column: Drag & Drop + Preview + Generate Button */}
          <section className="flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-zinc-900/60 backdrop-blur-sm p-5 sm:p-6 shadow-xl hover:border-cyan-500/30 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon
                    className="w-5 h-5 text-cyan-400"
                    aria-hidden="true"
                  />
                  <h2 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-wide">
                    1. Input Design Wireframe / UI
                  </h2>
                </div>
                {uploadedImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Image
                  </button>
                )}
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Upload gambar desain UI dengan klik atau drag and drop"
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 sm:p-8 transition-all cursor-pointer min-h-[280px] sm:min-h-[340px] ${
                  isDragging
                    ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.2)]"
                    : uploadedImage
                    ? "border-zinc-700 bg-zinc-950/70"
                    : "border-zinc-800 hover:border-cyan-500/50 bg-zinc-950/50 hover:bg-zinc-900/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadedImage ? (
                  <div className="w-full flex flex-col items-center space-y-4">
                    <div className="relative w-full max-h-[260px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center p-2 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadedImage.previewUrl}
                        alt={`Preview ${uploadedImage.name}`}
                        className="max-h-[240px] w-auto object-contain rounded"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-mono font-medium text-cyan-300 truncate max-w-xs sm:max-w-md">
                        {uploadedImage.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {(uploadedImage.size / 1024).toFixed(1)} KB • Klik atau
                        drop gambar lain untuk mengganti
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                      <Upload className="w-8 h-8" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm sm:text-base font-medium text-zinc-200">
                        Drag &amp; Drop screenshot desain Figma / UI di sini
                      </p>
                      <p className="text-xs sm:text-sm text-zinc-400">
                        atau klik untuk menjelajahi file dari perangkat lokal
                      </p>
                    </div>
                    <span className="inline-block rounded-md bg-zinc-900 px-3 py-1 text-[11px] font-mono text-cyan-400/90 border border-zinc-800">
                      PNG • JPG • WEBP (Max 5MB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => void handleGenerateCode()}
                disabled={isGenerating || !uploadedImage}
                className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed px-6 py-4 text-base font-semibold text-white shadow-[0_0_25px_rgba(6,182,212,0.3)] disabled:shadow-none transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2
                      className="w-5 h-5 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Synthesizing React + Tailwind Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" aria-hidden="true" />
                    <span>Generate React + Tailwind Code</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Right Column: Code Output & Copy Button */}
          <section className="flex flex-col rounded-2xl border border-zinc-800/90 bg-zinc-900/60 backdrop-blur-sm p-5 sm:p-6 shadow-xl hover:border-fuchsia-500/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCode2
                  className="w-5 h-5 text-fuchsia-400"
                  aria-hidden="true"
                />
                <h2 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-wide">
                  2. Generated Component Code
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2.5 py-0.5 rounded-md">
                <Terminal className="w-3.5 h-3.5" />
                JSX / Tailwind
              </span>
            </div>

            <div className="relative flex-1 flex flex-col min-h-[340px] sm:min-h-[400px] rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-inner">
              {/* Code Editor Top Bar */}
              <div className="flex items-center justify-between border-b border-zinc-800/90 bg-zinc-900/90 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-zinc-400">
                    GeneratedComponent.tsx
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => void handleCopyCode()}
                  disabled={!generatedCode}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:border-zinc-800 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-mono font-medium text-cyan-300 transition cursor-pointer"
                  aria-label="Copy generated code"
                >
                  {copied ? (
                    <>
                      <Check
                        className="w-3.5 h-3.5 text-emerald-400"
                        aria-hidden="true"
                      />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Editor Textarea */}
              <div className="relative flex-1 flex">
                {isGenerating && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-xs gap-3 p-6 text-center">
                    <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" />
                    <p className="text-sm font-mono font-medium text-cyan-300">
                      Menghubungi Gemini 1.5 Flash &amp; mengonversi gambar ke
                      komponen React...
                    </p>
                  </div>
                )}

                <textarea
                  value={generatedCode}
                  onChange={(e) => setGeneratedCode(e.target.value)}
                  placeholder="// Kode React + Tailwind CSS hasil konversi Gemini AI akan muncul di sini..."
                  aria-label="Generated code editor"
                  spellCheck={false}
                  className="w-full flex-1 resize-none bg-transparent p-4 font-mono text-xs sm:text-sm leading-relaxed text-cyan-100 placeholder:text-zinc-600 focus:outline-none selection:bg-fuchsia-500/30"
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
