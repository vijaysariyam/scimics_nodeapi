import axios from "axios";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import express, { json } from "express";
import cors from "cors";

import scimicsRouter from "./routes/testing3.router.js";

import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";

import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use("/", express.static(join(__dirname, "public")));

//const PORT = process.env.PORT;
const PORT = 8080;

//const corsOptions = { credentials: true, origin: process.env.URL || '*' };
const corsOptions = { credentials: true, origin: "*" };
app.use(cors(corsOptions));
//app.use(cors());
// app.use(function (req, res, next) {
// 	var allowedDomains = [
// 		'http://localhost:3001',
// 		'http://localhost:3000',
// 		'https://sp.crowdfundenergy.in',
// 		'https://consumer.crowdfundenergy.in',
// 		'https://consumer.crowdfundenergy.com',
// 	];
// 	var origin = req.headers.origin;

// 	// if (allowedDomains.indexOf(origin) > -1) {
// 	// 	res.setHeader('Access-Control-Allow-Origin', origin);
// 	// }

// 	res.setHeader('Access-Control-Allow-Origin', '*');

// 	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
// 	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Accept');
// 	res.setHeader('Access-Control-Allow-Credentials', true);
// 	next();
// });

app.use(json());
app.use(cookieParser());

app.use("/scimics", scimicsRouter);

app.get("/", (req, res) => {
  res.send("Hello scimics api");
});
//////////////////////////////////////////////////////////////////////////
import { sendEmail, sendSMS } from "./services/emailjss.js";
//emailjs check
app.post("/sendemail", async (req, res) => {
  const { personname, email } = req.body;
  //const emailResult = await sendEmail(personname, email);
  const emailResult = await sendEmail(
    "vjmusk",
    "invtechnologiesvijay2@gmail.com"
  );
  if (emailResult.success) {
    res.status(200).json({ success: true, otp: emailResult.otp });
  } else {
    res.status(500).json({ success: false, message: "Email sending failed" });
  }
});

//otp check

app.post("/api/sendotp", async (req, res) => {
  const otpResult = await sendSMS("9059108434", "elon", "321321");
  if (otpResult.success) {
    res.status(200).json({ success: true, message: "Otp sent successfully" });
  } else {
    res.status(500).json({ success: false, message: "otp sending failed" });
  }
});
///////////////////////////////////////////////////////////////////////////////////

app.get("/upload", function (req, res) {
  res.send(`
	  <form action="/api/upload" method="POST" enctype="multipart/form-data">
		<input type="file" name="file" />
		<input type="submit" value="Upload" />
	  </form>
	`);
});

app.post("/wishper", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const audio = req.file.buffer;

    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        file: audio,
        model: "whisper-1",
      },
      {
        headers: {
          "Content-Type": "audio/wav",
          Authorization: `Bearer ${process.env.AI}`,
        },
      }
    );

    const transcript = response.data.text;

    return res.status(200).json({ transcript });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port:${PORT}`);
});
