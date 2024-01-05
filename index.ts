import express from "express";
import multer from "multer";
import bodyParser from "body-parser";
import uploadFileRouter from "./routes/uploadFile";
import cors from 'cors';
import { mongoSetup } from "./config/mongodb";
import path from 'path';

// dotenv.config();
const currentDate = new Date();
const timestamp = currentDate.toISOString().replace(/:/g, '-');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const currentDate = new Date();
    const timestamp = currentDate.toISOString().replace(/:/g, '-');
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const fileName = path.basename(originalName, extension);
    const modifiedFileName = `${fileName}_${timestamp}${extension}`;
    cb(null, modifiedFileName);
  },
});

const upload = multer({ storage });

const app = express();
const port = process.env.APP_PORT || 3000;

app.use(cors());

app.get('/uploads/:filename', (req, res) => {

  const filename = req.params.filename;

  const filePath = path.join(__dirname, 'uploads', filename); // Specify the path to your files
  // Set the appropriate headers for the download

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  res.setHeader('Content-Type', 'application/octet-stream');
  // Send the file to the client

  res.sendFile(filePath);
});


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(upload.single("file"));
app.use("/api/v1/uploadFile", uploadFileRouter);

console.log('|| environment ||', process.env.NODE_ENV ?? 'local');



mongoSetup()
  .then(() => {
    const server = app.listen(port, () => {
      server.timeout = 240000; // 240 seconds (4 minutes)
      console.log(`StepZero Api listening on port ${port}`)
    });
   console.log(`mongo connected boss.`)
  })
  .catch((err: Error) => {
    console.error(`Error setting up MongoDB connection:`, err);
  });

