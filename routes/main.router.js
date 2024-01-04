import { sendOtpEmail, sendSMS, sendWelcomeEmail } from '../services/emailjss.js';
import { getOTP } from '../utils/globalfunc.js';

import pool from '../utils/db.js';
import express, { response } from 'express';
import axios from 'axios';

const fetch = (...args) =>
	import("node-fetch").then(({ default: fetch }) => fetch(...args));

import { sendErrorMessage, sendInternalServerErrorResponse, sendOkResponse } from '../utils/response.js';

const router = express.Router();

async function getUserByEmail(client, email) {
	const userQuery = `
	  SELECT * 
	  FROM scimic_user
	  WHERE email = $1`;
	const { rows } = await client.query(userQuery, [email]);
	return rows;
}

async function getUserByGithubId(client, githubid) {
	const userQuery = `
	  SELECT * 
	  FROM scimic_user
	  WHERE github_id = $1`;
	const { rows } = await client.query(userQuery, [githubid]);
	return rows;
}

async function getQuestionsByCategory(client, noofquestions, catid, subcatid) {
	const userQuery = `
	  SELECT 
	    null as user_answer,
	    sq.domain_id,
		c.comprehension,
		sq.scimic_question_pk,
		sq.question,
		json_build_array(sq.option1, sq.option2, sq.option3, sq.option4) AS options, 
	    i.icap_subcategory_name AS category
		
		
	  FROM scimic_questions sq
	  JOIN icap_subcategories i
	  on sq.icap_subcategory_id = i.icap_subcategory_pk
	  LEFT JOIN comprehension c
	  on sq.comprehension_id = c.comprehension_pk
	  WHERE 
		 sq.icap_category_id = $2
		AND sq.icap_subcategory_id = $3
		AND sq.icap_qscategory_id = 1
	  ORDER BY RANDOM()
	  LIMIT $1;
	`;

	const { rows } = await client.query(userQuery, [noofquestions, catid, subcatid]);
	return rows;
}

async function getCompQuestionsByCategory(client, noofcomquestions, catid, subcatid) {
	const userQuery = `
	  SELECT 
	    null as user_answer,
	    sq.domain_id,
		c.comprehension,
		sq.scimic_question_pk,
		sq.question,
		json_build_array(sq.option1, sq.option2, sq.option3, sq.option4) AS options, 
	    i.icap_subcategory_name AS category
		
		
	  FROM scimic_questions sq
	  JOIN icap_subcategories i
	  on sq.icap_subcategory_id = i.icap_subcategory_pk
	  LEFT JOIN comprehension c
	  on sq.comprehension_id = c.comprehension_pk
	  WHERE sq.comprehension_id 
	  in(
		select comprehension_id from scimic_questions 
			WHERE 
			comprehension_id IS NOT NULL and
			icap_category_id = $2
		    AND icap_subcategory_id = $3
		    AND icap_qscategory_id = 1
			
			GROUP BY comprehension_id
		order by random()
		limit $1
		)
	`;

	const { rows } = await client.query(userQuery, [noofcomquestions, catid, subcatid]);
	return rows;
}
router.post('/getcolleges', async (req, res) => {
	const client = await pool.connect();
	try {
		const query = `SELECT * FROM scimic_college`;
		var { rows } = await client.query(query, []);

		return sendOkResponse(res, rows);
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/getcourses/:id', async (req, res) => {
	const client = await pool.connect();
	try {
		const id = req.params.id;
		const query = `
		SELECT * 
		FROM 
		scimic_course 
		where college_pk = $1`;
		var { rows } = await client.query(query, [id]);

		return sendOkResponse(res, rows);
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/signup', async (req, res) => {
	const client = await pool.connect();
	const { firstname, lastname, email, password, signin_source } = req.body;
	try {
		if (!firstname || !lastname || !email || !signin_source) {
			return sendErrorMessage(res, 'Bad Request');
		}
		var rows = await getUserByEmail(client, email);

		if (rows.length > 0) return sendErrorMessage(res, 'Email Already exists');

		const query = `INSERT INTO scimic_user 
		(firstname, lastname, email, hashed_password, signin_source)VALUES 
		($1, $2, $3, $4, $5)
		RETURNING *`;
		var values = [firstname, lastname, email, password, signin_source];
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			return sendOkResponse(res, []);
		} else {
			return sendErrorMessage(res, 'Invalid singup');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/googlesignuporlogin', async (req, res) => {
	const client = await pool.connect();
	const { firstname, lastname, email, pic } = req.body;
	try {
		if (!firstname || !lastname || !email || !pic) {
			return sendErrorMessage(res, 'Bad Request');
		}
		var values = [];
		var rows;
		var query;

		rows = await getUserByEmail(client, email);
		if (rows.length > 0) {
			//Email Already exists retrive data
			query = `SELECT * FROM scimic_user 
		   WHERE email = $1`;
			values = [email];
		} else {
			query = `INSERT INTO scimic_user 
		(firstname, lastname, email, pic, signin_source , is_account_verified) VALUES 
		($1, $2, $3, $4, $5 , $6)
		RETURNING *`;
			values = [firstname, lastname, email, pic, 'GOOGLE', true];
		}
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			return sendOkResponse(res, rows[0]);
		} else {
			return sendErrorMessage(res, 'Invalid google singup');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/githubsignuporlogin', async (req, res) => {
	const client = await pool.connect();
	const { avatar_url, github_id, name } = req.body;
	try {
		if (!name || !avatar_url || !github_id) {
			return sendErrorMessage(res, 'Bad Request');
		}
		var values = [];
		var rows;
		var query;

		rows = await getUserByGithubId(client, github_id);
		if (rows.length > 0) {
			//github_id Already exists retrive data
			query = `SELECT * FROM scimic_user 
		   WHERE github_id = $1`;
			values = [github_id];
		} else {
			query = `INSERT INTO scimic_user 
		(firstname, lastname,  pic, signin_source , is_account_verified , github_id ) VALUES 
		($1, $2, $3, $4, $5 , $6)
		RETURNING *`;
			values = [name, ' ', avatar_url, 'GITHUB', true, github_id];
		}
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			return sendOkResponse(res, rows[0]);
		} else {
			return sendErrorMessage(res, 'Invalid github singup');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/sendotp', async (req, res) => {
	const client = await pool.connect();
	const { email } = req.body;
	try {
		if (!email) {
			return sendErrorMessage(res, 'Bad Request');
		}

		var rows = await getUserByEmail(client, email);
		if (rows.length == 0) return sendErrorMessage(res, "Couldn't find your account");

		var otp = getOTP(6);
		const query = `
		UPDATE scimic_user 
		SET otp = $2 
		WHERE email = $1
		RETURNING *`;
		var values = [email, otp];
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			const emailResult = await sendOtpEmail('User', email, otp);
			if (emailResult.success) {
				return sendOkResponse(res, []);
			} else {
				return sendErrorMessage(res, 'OTP Service down');
			}
		} else {
			return sendErrorMessage(res, 'Invalid singup');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/verifyotp', async (req, res) => {
	const client = await pool.connect();
	const { email, received_otp } = req.body;
	try {
		if (!email || !received_otp) {
			return sendErrorMessage(res, 'Bad Request');
		}

		var rows = await getUserByEmail(client, email);
		if (rows.length == 0) return sendErrorMessage(res, "Couldn't find your account");
		const userData = rows[0];
		if (received_otp != userData.otp) return sendErrorMessage(res, 'Invalid otp');

		const query = `
		UPDATE scimic_user
		SET is_account_verified = true 
		WHERE email = $1
		RETURNING *`;
		var values = [email];
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			const emailResult = await sendWelcomeEmail('User', email);
			const userData = rows[0];
			return sendOkResponse(res, userData);
		} else {
			return sendErrorMessage(res, 'Invalid singup');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/login', async (req, res) => {
	const client = await pool.connect();
	const { email, password } = req.body;
	try {
		if (!email || !password) {
			return sendErrorMessage(res, 'Bad Request');
		}
		var rows = await getUserByEmail(client, email);
		if (rows.length == 0) return sendErrorMessage(res, "Couldn't find your account");

		const userData = rows[0];
		if (password != userData.hashed_password) {
			return sendErrorMessage(res, 'Invalid credentials');
		} else {
			//delete userData.hashed_password;
			return sendOkResponse(res, userData);
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});
router.post('/updateuser', async (req, res) => {
	const client = await pool.connect();
	const { email, firstname, lastname, country_code, college_id, course_id, phone } = req.body;
	try {
		if (!firstname || !lastname || !country_code || !college_id || !course_id || !phone) {
			return sendErrorMessage(res, 'Bad Request');
		}

		var rows = await getUserByEmail(client, email);
		if (rows.length == 0) return sendErrorMessage(res, "Couldn't find your account");

		const query = `
		UPDATE scimic_user
		SET 
		firstname = $2,
		lastname = $3,
		country_code = $4,
		college_id = $5,
		course_id = $6,
		phone = $7

		WHERE email = $1
		RETURNING *`;
		var values = [email, firstname, lastname, country_code, college_id, course_id, phone];
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			return sendOkResponse(res, []);
		} else {
			return sendErrorMessage(res, 'Invalid update operation');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/updatepassword', async (req, res) => {
	const client = await pool.connect();
	const { email, hashed_password } = req.body;
	try {
		if (!email || !hashed_password) {
			return sendErrorMessage(res, 'Bad Request');
		}

		var rows = await getUserByEmail(client, email);
		if (rows.length == 0) return sendErrorMessage(res, "Couldn't find your account");

		const query = `
		UPDATE scimic_user
		SET 
		hashed_password = $2
		WHERE email = $1
		RETURNING *`;
		var values = [email, hashed_password];
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			return sendOkResponse(res, []);
		} else {
			return sendErrorMessage(res, 'Invalid update operation');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/addreport', async (req, res) => {
	const client = await pool.connect();
	const {
		user_id,
		total,
		won,
		technical_proficiency,
		tp_total,
		tp_won,
		communication_skills,
		cs_total,
		cs_won,
		cognitive_abilities,
		ca_total,
		ca_won,
		interpersonal_and_teamwork_skills,
		iats_total,
		iats_won,
		adaptability_and_continuous_learning,
		aacl_total,
		aacl_won,
		project_management_and_time_management,
		pmatm_total,
		pmatm_won,
		professional_etiquette_and_interview_preparedness,
		peaip_total,
		peiap_won,
	} = req.body;
	try {
		if (
			user_id == null ||
			total == null ||
			won == null ||
			technical_proficiency == null ||
			tp_total == null ||
			tp_won == null ||
			communication_skills == null ||
			cs_total == null ||
			cs_won == null ||
			cognitive_abilities == null ||
			ca_total == null ||
			ca_won == null ||
			interpersonal_and_teamwork_skills == null ||
			iats_total == null ||
			iats_won == null ||
			adaptability_and_continuous_learning == null ||
			aacl_total == null ||
			aacl_won == null ||
			project_management_and_time_management == null ||
			pmatm_total == null ||
			pmatm_won == null ||
			professional_etiquette_and_interview_preparedness == null ||
			peaip_total == null ||
			peiap_won == null
		) {
			return sendErrorMessage(res, 'Bad Request');
		}

		const query = `INSERT 
    INTO scimic_exam_reports 
		(user_id, total, won, technical_proficiency, tp_total, tp_won, communication_skills, cs_total, cs_won, cognitive_abilities, ca_total, ca_won, interpersonal_and_teamwork_skills, iats_total, iats_won, adaptability_and_continuous_learning, aacl_total, aacl_won, project_management_and_time_management, pmatm_total, pmatm_won, professional_etiquette_and_interview_preparedness, peaip_total, peiap_won)
    VALUES 
		($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
    $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
    $21,$22,$23,$24)
		RETURNING *`;
		var values = [
			user_id,
			total,
			won,
			technical_proficiency,
			tp_total,
			tp_won,
			communication_skills,
			cs_total,
			cs_won,
			cognitive_abilities,
			ca_total,
			ca_won,
			interpersonal_and_teamwork_skills,
			iats_total,
			iats_won,
			adaptability_and_continuous_learning,
			aacl_total,
			aacl_won,
			project_management_and_time_management,
			pmatm_total,
			pmatm_won,
			professional_etiquette_and_interview_preparedness,
			peaip_total,
			peiap_won,
		];
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			return sendOkResponse(res, []);
		} else {
			return sendErrorMessage(res, 'Invalid report');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/getreports/:id', async (req, res) => {
	const client = await pool.connect();
	try {
		const id = req.params.id;
		const query = `
		SELECT * 
		FROM 
		icap_reports 
		where user_id = $1`;
		var { rows } = await client.query(query, [id]);

		return sendOkResponse(res, rows);
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});


const githubClientSecret = '016c4fedd4f952e32f4433ec78a1a0e65fbbb3f2';
const githubClientId = '2e63a9cb2528d488121b';

router.get('/gitAccessToken', async (req, res) => {
	const params = `?client_id=${githubClientId}&client_secret=${githubClientSecret}&code=${req.query.code}`;

	try {
		const response = await fetch(`https://github.com/login/oauth/access_token${params}`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
			},
		});

		const data = await response.json();
		res.status(200).json(data);
		console.log(data);
		// sendOkResponse(res, data);
	} catch (error) {
		console.error(error);
		sendInternalServerErrorResponse(res, 'Internal Server Error');
	}
});

router.get('/gitUserData', async (req, res) => {
	const authorizationHeader = req.headers.authorization;

	// Check if the Authorization header is present
	if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
		return sendErrorResponse(res, 'Unauthorized - Missing or invalid token');
	}

	const accessToken = authorizationHeader.substring(7); // Remove 'Bearer ' from the token
	console.log('Received Authorization Header:', accessToken);

	const githubApiUrl = 'https://api.github.com/user';

	try {
		const response = await fetch(githubApiUrl, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		const data = await response.json();

		if (response.ok) {
			return sendOkResponse(res, data);
		} else {
			return sendErrorMessage(res, 'Failed to fetch GitHub user data');
		}
	} catch (error) {
		console.error(error);
		return sendInternalServerErrorResponse(res, 'Internal Server Error');
	}
});





// Change callback URL in Github OAuth accordingly.
// router.get('/github/callback', async (req, res) => {
// 	try {
// 		const response = await axios.post(
// 			'https://github.com/login/oauth/access_token',
// 			{
// 				client_id: githubClientId,
// 				client_secret: githubClientSecret,
// 				code: req.query.code,
// 			},
// 			{
// 				headers: {
// 					Accept: 'application/json',
// 				},
// 			}
// 		);

// 		const accessToken = response.data.access_token;

// 		// Use access token to fetch user info
// 		const userProfile = await axios.get('https://api.github.com/user', {
// 			headers: {
// 				Authorization: `Bearer ${accessToken}`,
// 				'User-Agent': 'Scimics',
// 			},
// 		});

// 		const userData = {
// 			github_id: userProfile.data.github_id,
// 			avatarUrl: userProfile.data.avatar_url,
// 			name: userProfile.data.name,
// 			// Add more fields as needed
// 		};

// 		// You can now use the 'userData' object as per your requirements
// 		//console.log(userProfile);
// 		res.send(userData);
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).send('Internal Server Error');
// 	}
// });

router.post('/generatepaper', async (req, res) => {
	const client = await pool.connect();
	try {
		const query = `
		SELECT * 
		FROM 
		icap_config 
		`;
		var { rows } = await client.query(query);

		if (rows.length == 1) {
			const config = rows[0];
			var Quantitative_Aptitude = await getQuestionsByCategory(client, 10, 1, 1);
			var Logical_Reasoning = await getQuestionsByCategory(client, 10, 1, 2);
			var Cognitive_Abilities = Quantitative_Aptitude.concat(Logical_Reasoning);

			var Domain_Specific_Knowledge = await getQuestionsByCategory(client, 10, 2, 3);
			var Hands_on_Coding = await getQuestionsByCategory(client, 10, 2, 4);
			var Technical_Proficiency = Domain_Specific_Knowledge.concat(Hands_on_Coding);

			var English_Speaking = await getCompQuestionsByCategory(client, 0, 3, 5);
			var English_Listening = await getCompQuestionsByCategory(client, 1, 3, 6);
			var English_Reading = await getCompQuestionsByCategory(client, 2, 3, 7);
			var English_Writing = await getCompQuestionsByCategory(client, 0, 3, 8);
			var Communication_Skills = English_Speaking.concat(English_Listening)
				.concat(English_Reading)
				.concat(English_Writing);
			//Communication_Skills.sort((a, b) => a.comprehension_id - b.comprehension_id);

			var Interpersonal_and_Team_work_Skills = await getQuestionsByCategory(client, 5, 4, 10);
			var Adaptability_and_Continuous_Learning = await getQuestionsByCategory(client, 5, 4, 11);
			var Project_Management_and_Time_Management = await getQuestionsByCategory(client, 5, 4, 12);
			var Professional_Etiquette_and_Interview_Preparedness = await getQuestionsByCategory(client, 5, 4, 13);

			var Personality_and_Behavioral = Interpersonal_and_Team_work_Skills.concat(
				Adaptability_and_Continuous_Learning
			)
				.concat(Project_Management_and_Time_Management)
				.concat(Professional_Etiquette_and_Interview_Preparedness);

			var paper = [
				{
					totalquestions: Cognitive_Abilities.length,
					questions: Cognitive_Abilities,
					testname: 'Cognitive Abilities',
					duration: 30 * 60,
				},
				{
					totalquestions: Technical_Proficiency.length,
					questions: Technical_Proficiency,
					testname: 'Technical Proficiency',
					duration: 30 * 60,
				},
				{
					totalquestions: Communication_Skills.length,
					questions: Communication_Skills,
					testname: 'Communication Skills',
					duration: 45 * 60,
				},
				{
					totalquestions: Personality_and_Behavioral.length,
					questions: Personality_and_Behavioral,
					testname: 'Personality and Behavioral',
					duration: 30 * 60,
				},
			];
			return sendOkResponse(res, paper);
		} else {
			return sendErrorMessage(res, 'Invalid configuration');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/validatepaper/:userid', async (req, res) => {
	const client = await pool.connect();
	try {
		var user_id = req.params.userid;

		const userData = req.body.data;
		var result = {
			user_id: parseInt(user_id),

			total: 0,
			won: 0,

			ca_total: 0,
			ca_won: 0,
			ca_time: 0,

			tp_total: 0,
			tp_won: 0,
			tp_time: 0,

			cs_total: 0,
			cs_won: 0,
			cs_time: 0,

			pb_total: 0,
			pb_won: 0,
			pb_time: 0,
		};

		for (let i = 0; i < userData.length; i++) {
			var won = 0;
			var qsinfo = userData[i];
			var testqs = qsinfo['questions'];
			for (let j = 0; j < testqs.length; j++) {
				var qs = testqs[j];
				var id = qs.scimic_question_pk;
				var query = `
				SELECT answer
				FROM 
				scimic_questions 
				where scimic_question_pk = $1`;
				var { rows } = await client.query(query, [id]);
				const orgial_answer = rows[0].answer;

				if (qs.user_answer == orgial_answer) {
					won = won + 1;
				}
			}

			if (i == 0) {
				result.ca_total = testqs.length;
				result.ca_won = won;
				result.ca_time = qsinfo.duration;
			} else if (i == 1) {
				result.tp_total = testqs.length;
				result.tp_won = won;
				result.tp_time = qsinfo.duration;
			} else if (i == 2) {
				result.cs_total = testqs.length;
				result.cs_won = won;
				result.cs_time = qsinfo.duration;
			} else if (i == 3) {
				result.pb_total = testqs.length;
				result.pb_won = won;
				result.pb_time = qsinfo.duration;
			}

			won = 0;
		}

		result.total = result.ca_total + result.tp_total + result.cs_total + result.pb_total;
		result.won = result.ca_won + result.tp_won + result.cs_won + result.pb_won;
		var {
			user_id,

			total,
			won,

			ca_total,
			ca_won,
			ca_time,

			tp_total,
			tp_won,
			tp_time,

			cs_total,
			cs_won,
			cs_time,

			pb_total,
			pb_won,
			pb_time,
		} = result;

		//save report
		var query = `INSERT INTO 
		icap_reports(
		user_id, 
		total, won, 
		ca_total, ca_won, ca_time, 
		tp_total, tp_won, tp_time, 
		cs_total, cs_won, cs_time, 
		pb_total, pb_won, pb_time
		)
		VALUES (
		$1,$2,$3,$4,$5,$6,$7,$8,$9, $10,$11,$12,$13,$14,$15)
		RETURNING *`;
		var { rows } = await client.query(query, [
			user_id,
			total,
			won,
			ca_total,
			ca_won,
			ca_time,
			tp_total,
			tp_won,
			tp_time,
			cs_total,
			cs_won,
			cs_time,
			pb_total,
			pb_won,
			pb_time,
		]);

		if (rows.length == 1) {
			return sendOkResponse(res, result);
		} else {
			return sendErrorMessage(res, 'Exam submission failed');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

// function isValidJson(str) {
// 	try {
// 		JSON.parse(str);
// 		return true;
// 	} catch (error) {
// 		return false;
// 	}
// }


router.post('/getcognitiveq', async (req, res) => {
	try {
		const jsonUrl = 'https://parametr-1.onrender.com/parameter1';
		const { data } = await axios.post(jsonUrl, req.body); // Assuming this API endpoint expects POST requests

		console.log('Received data:', data);

		if (data) {
			// Check if data is present
			return sendOkResponse(res, data);
		} else {
			return sendErrorResponse(res, 'No data received');
		}
	} catch (error) {
		console.error('Error:', error.message);
		return sendInternalServerErrorResponse(res, error.message);
	}
});

router.post('/gettechnicalq', async (req, res) => {
	try {
		const jsonUrl = 'https://scimics.onrender.com/parameter2';
		const { data } = await axios.post(jsonUrl, req.body);

		console.log('Received data:', data);

		if (data) {
			return sendOkResponse(res, data);
		} else {
			return sendErrorResponse(res, 'No data received');
		}
	} catch (error) {
		console.error('Error:', error.message);
		return sendInternalServerErrorResponse(res, error.message);
	}
});

router.post('/getcommunicationq', async (req, res) => {
	try {
		const jsonUrl = 'https://scimics-3.onrender.com/parameter3';
		const { data } = await axios.post(jsonUrl, req.body);
		console.log('Received data:', data);

		if (data) {
			return sendOkResponse(res, data);
		} else {
			return sendErrorResponse(res, 'No data received');
		}
	} catch (error) {
		console.error('Error:', error.message);
		return sendInternalServerErrorResponse(res, error.message);
	}
});

router.post('/getpersonalityq', async (req, res) => {
	try {
		const jsonUrl = 'https://scimics-4.onrender.com/parameter4';
		const { data } = await axios.post(jsonUrl, req.body);
		console.log('Received data:', data);

		if (data) {
			return sendOkResponse(res, data);
		} else {
			return sendErrorResponse(res, 'No data received');
		}
	} catch (error) {
		console.error('Error:', error.message);
		return sendInternalServerErrorResponse(res, error.message);
	}
});

router.post('/get4parameterq', async (req, res) => {
	try {
		const jsonUrl = 'https://mcq4.onrender.com/get_mcq4';
		const { data } = await axios.post(jsonUrl, req.body);
		console.log('Received data:', data);

		if (data) {
			return sendOkResponse(res, data);
		} else {
			return sendErrorResponse(res, 'No data received');
		}
	} catch (error) {
		console.error('Error:', error.message);
		return sendInternalServerErrorResponse(res, error.message);
	}
});


export default router;
