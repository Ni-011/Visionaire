"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { error } from "console";
import { setUncaughtExceptionCaptureCallback } from "process";
import { ChangeEvent, useState } from "react";
import pdfParse from "pdf-parse";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function Home() {
  const [image, setImage] = useState<Blob | MediaSource | null>(null);
  const [prompt, setPrompt] = useState<string>(""); // user input question
  const [analysis, setAnalysis] = useState(""); // response from the AI
  const [error, setError] = useState<string>("");
  const [fileText, setFileText] = useState<string>("");

  // get the file, read buffer, parse buffer, get text
  const readPDF = async (
    event: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file: File = event.target.files![0];
    const reader = new FileReader(); // create a new FileReader
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const contentArray: Uint8Array = new Uint8Array( // convert the ArrayBuffer to a uint8 array
        event.target?.result as ArrayBuffer
      );
      const pdf = await pdfjs.getDocument(contentArray).promise; // get the contentArray as doc
      let finalText: string = ""; // final text to return

      for (let i = 1; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const pageContent = await page.getTextContent();
        const pageText = pageContent.items
          .map((item) => {
            if ("str" in item) {
              return item.str;
            } else if ("items" in item && Array.isArray(item.items)) {
              return (item.items as any[]).map((item) => item.str).join(" ");
            }
          })
          .join(" ");

        finalText += pageText + "\n";
      }

      setFileText(finalText);
    };
    reader.readAsArrayBuffer(file);
  };

  // send user prompt to the server and get the response
  const analyseImage = async () => {
    if (!image) {
      setError("No image available");
      return;
    }

    try {
      const analyseResponse = await fetch("http://localhost:8000/analyse", {
        method: "POST",
        body: JSON.stringify({
          message: prompt,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const analyseData = await analyseResponse.text();
      setAnalysis(analyseData);
    } catch (error) {
      setError(error as string);
      throw new Error(error as string);
    }
  };

  return (
    <div>
      <section>
        <div>
          {image && <img src={URL.createObjectURL(image)} />}
          <p>
            <label htmlFor="file">Upload an image</label>
            <Input id="file" type="file" name="file" onChange={readPDF} />
          </p>
          <div>
            <Input
              value={prompt}
              placeholder="Ask about the image......"
              onChange={(e) => setPrompt(e.target.value)}
            />
            {!analysis && !error && <Button onClick={analyseImage}>Ask</Button>}
          </div>
          {error && <p>Error: {error}</p>}
          {analysis && <p>{analysis}</p>}
        </div>
      </section>
    </div>
  );
}
