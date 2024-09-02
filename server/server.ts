import express from "express";
import { Express } from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";
import dotenv from "dotenv";

// make a basic express app
const app: Express = express();
dotenv.config();

// allow cross-origin requests
app.use(cors());
app.use(express.json());

// set the port
const port: Number = 8000;

const Gemini: GoogleGenerativeAI = new GoogleGenerativeAI(
  process.env.GEMINI as string
);

const imageStorage: multer.StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    // file will be stored in public directory
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // file name will be date + original file name
  },
});

const upload = multer({ storage: imageStorage }).single("file");

let filePath: string = "";

app.post("/upload", (req: Request, res: Response) => {
  upload(req, res, (err) => {
    // handles upload
    if (err) {
      // if error
      console.log("error: " + err);
      return res.send(500).json(err);
    }
    if (req.file?.path) {
      filePath = req.file.path; // record the filePath from request
      console.log(filePath);
    }
  });
});

const imageToData = (path: string, mimeType: string) => {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
};

app.post("/analyse", async (req, res) => {
  try {
    const model = Gemini.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const question: string = req.body.message; // get the question from request body
    const analysis = await model.generateContent([
      // generate the response using question and image's base64 data
      question,
      imageToData(filePath, "image/jpeg"),
    ]);
    const response = await analysis.response;
    const output = response.text();
    res.send(output);
  } catch (error) {
    console.log(error);
  }
});

// start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
