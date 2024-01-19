import axios from 'axios';
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

import express, { json } from 'express';
import cors from 'cors';

import scimicsRouter from './routes/main.router.js';

import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use('/', express.static(join(__dirname, 'public')));

//const PORT = process.env.PORT;
const PORT = 8080;

//const corsOptions = { credentials: true, origin: process.env.URL || '*' };
const corsOptions = { credentials: true, origin: '*' };
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
app.use(bodyParser.json());

app.use('/scimics', scimicsRouter);

app.get('/', (req, res) => {
	res.send('Hello scimics api');
});
//////////////////////////////////////////////////////////////////////////
import { sendOtpEmail, sendSMS, sendWelcomeEmail, sendAccDetailsEmail } from './services/emailjss.js';
//emailjs check
app.post('/sendotpemail', async (req, res) => {
	const { personname, email } = req.body;
	//const emailResult = await sendOtpEmail(personname, email);
	const emailResult = await sendOtpEmail('vjmusk', 'invtechnologiesvijay2@gmail.com', 123123);
	if (emailResult.success) {
		res.status(200).json({ success: true, otp: emailResult.otp });
	} else {
		res.status(500).json({ success: false, message: 'Email sending failed' });
	}
});

app.post('/sendwelcomeemail', async (req, res) => {
	const { personname, email } = req.body;
	//const emailResult = await sendOtpEmail(personname, email);
	const emailResult = await sendWelcomeEmail('vjmusk', 'invtechnologiesvijay2@gmail.com', 123123);
	if (emailResult.success) {
		res.status(200).json({ success: true, otp: emailResult.otp });
	} else {
		res.status(500).json({ success: false, message: 'Email sending failed' });
	}
});

app.post('/sendaccdetailsemail', async (req, res) => {
	const { personname, email } = req.body;
	//const emailResult = await sendAccDetailsEmail(personname, email);
	const emailResult = await sendAccDetailsEmail('Vivek', 'vivekinv28@gmail.com', 'q1@wer4');
	if (emailResult.success) {
		res.status(200).json({ success: true, otp: emailResult.otp });
	} else {
		res.status(500).json({ success: false, message: 'Email sending failed' });
	}
});

//otp check

app.post('/api/sendotp', async (req, res) => {
	const otpResult = await sendSMS('9059108434', 'elon', '321321');
	if (otpResult.success) {
		res.status(200).json({ success: true, message: 'Otp sent successfully' });
	} else {
		res.status(500).json({ success: false, message: 'otp sending failed' });
	}
});

app.post('/getpaper', async (req, res) => {
	var values = {
		stream: 'Btech',
		course: 'CSE',
		'1Q_count': '2',
		'1Q_time': '2',
		'2Q_time': '2',
		'2Q_a_count': '2',
		'2Q_b_count': '2',
		'2Q_c_count': '2',
		'2Q_d_count': '2',
		'3Q_time': '2',
		'3Q_a_count': '2',
		'3Q_b_count': '2',
		'4Q_time': '2',
		'4Q_a_count': '2',
		'4Q_b_count': '2',
		'5Q_time': '2',
		'5Q_a_count': '2',
		'5Q_b_count': '2',
		'6Q_time': '2',
		'6Q_a_count': '2',
		'6Q_b_count': '2',
		'6Q_c_count': '2',
		'6Q_d_count': '2',
		'6Q_e_count': '2',
		'7Q_time': '2',
		'7Q_a_count': '2',
		'7Q_b_count': '2',
	};
	try {
		const apiUrl = `https://mcq-generator-xr5k.onrender.com/get_mcq`;
		// Send the HTTP GET request to the SMS service
		const response = await axios.post(apiUrl, values);

		// Check the response status from the SMS service
		if (response.status === 200) {
			return { success: true, message: response.data };
		} else {
			return { success: false, message: 'SMS sending failed' };
		}
	} catch (error) {
		///console.error("An error occurred:", error);
		return { success: false, message: 'SMS sending failed' };
	}
});

///////////////////////////////////////////////////////////////////////////////////

app.get('/upload', function (req, res) {
	res.send(`
	  <form action="/api/upload" method="POST" enctype="multipart/form-data">
		<input type="file" name="file" />
		<input type="submit" value="Upload" />
	  </form>
	`);
});

app.post('/wishper', upload.single('audio'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}

		const audio = req.file.buffer;

		const response = await axios.post(
			'https://api.openai.com/v1/audio/transcriptions',
			{
				file: audio,
				model: 'whisper-1',
			},
			{
				headers: {
					'Content-Type': 'audio/wav',
					Authorization: `Bearer ${process.env.AI}`,
				},
			}
		);

		const transcript = response.data.text;

		return res.status(200).json({ transcript });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: 'An error occurred' });
	}
});


app.listen(PORT, () => {
	console.log(`Server is listening on port: http://localhost:${PORT}`);
});

// app.listen(PORT, "192.168.0.109", () => {
// 	console.log(`Server is listening on port: http://192.168.0.109:${PORT}`);
// });
