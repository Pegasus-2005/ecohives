import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

async function generate() {
  console.log("Starting generation...");
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: 'A professional, subtle, and uncluttered eco-friendly background. Soft, blurred abstract nature elements, gentle green and teal tones. The right half of the image should be completely out of focus, heavily blurred into a smooth, bright negative space to overlay text. No humans. Clean, modern, AI-generated aesthetic.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir);
        }
        fs.writeFileSync(path.join(publicDir, 'auth-bg.png'), base64Data, 'base64');
        console.log('Image saved to public/auth-bg.png');
        return;
      }
    }
    console.log("No image data found in response.");
  } catch (error) {
    console.error("Error generating image:", error);
  }
}
generate();
