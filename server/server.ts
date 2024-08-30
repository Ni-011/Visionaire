import express from "express";
import { Express } from "express";
import cors from "cors";
import fs from "fs";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Request, Response } from "express";

// make a basic express app
const app: Express = express();

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
    cb(null, "public");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // file name will be date + original file name
  },
});

const upload = multer({ storage: imageStorage }).single("file");

let filePath;

app.post("/upload", (req: Request, res: Response) => {
  upload(req, res, (err) => {
    // handles upload
    if (err) {
      // if error
      return res.send(500).json(err);
    }
    filePath = req.file?.path; // record the filePath from request
  });
});

// start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
