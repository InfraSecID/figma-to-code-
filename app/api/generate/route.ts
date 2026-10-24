import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Gambar kosong" }, { status: 400 });
    }

    const base64Data = imageBase64.split(",")[1] || imageBase64;

    // PAKE MODEL TERBARU SESUAI DOKUMENTASI
    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash", 
      input: [
        {
          type: "text",
          text: "You are an expert frontend developer. Convert this UI design image into a clean, responsive React component using Tailwind CSS. Use semantic HTML. Output ONLY the code, no markdown formatting."
        },
        {
          type: "image",
          data: base64Data,
          mime_type: mimeType || "image/png"
        }
      ]
    });

    // Ambil teks dari response
    const outputText = interaction.output_text;

    // Bersihin kalau ada format markdown ```tsx
    const cleanedCode = outputText
      .replace(/^```(?:tsx|jsx|typescript|javascript|react|html)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();

    return NextResponse.json({ code: cleanedCode });
  } catch (error: any) {
    console.error("Error Gemini:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menghubungi Gemini API" },
      { status: 500 }
    );
  }
}