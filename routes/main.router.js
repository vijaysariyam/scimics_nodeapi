import { sendOtpEmail, sendSMS, sendWelcomeEmail, sendAccDetailsEmail } from '../services/emailjss.js';
import { getOTP } from '../utils/globalfunc.js';

import pool from '../utils/db.js';
import express, { response } from 'express';
import axios from 'axios';

const fetch = (...args) =>
	import("node-fetch").then(({ default: fetch }) => fetch(...args));

import { sendErrorMessage, sendInternalServerErrorResponse, sendOkResponse, sendBadRequestResponse } from '../utils/response.js';

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
		c.comprehension_pk,
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
		if (rows.length > 0 && rows[0].is_blocked) {
			return sendErrorMessage(res, 'User is blocked by the admin');
		}
		if (rows.length > 0) {
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
		if (rows.length > 0 && rows[0].is_blocked) {
			return sendErrorMessage(res, 'User is blocked by the admin');
		}
		if (rows.length > 0) {
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
	const { email, password, user_type } = req.body;
	try {
		if (!email || !password) {
			return sendErrorMessage(res, 'Bad Request');
		}
		var rows = await getUserByEmail(client, email);
		if (rows.length == 0) return sendErrorMessage(res, "Couldn't find your account");

		const userData = rows[0];
		console.log(userData);
		if (userData.is_blocked) {
			return sendErrorMessage(res, 'User is blocked by the admin');
		}
		if (password != userData.hashed_password) {
			return sendErrorMessage(res, 'Invalid credentials');
		} else {

			if (user_type == userData.user_type) {
				return sendOkResponse(res, userData);
			} else {
				return sendErrorMessage(res, 'Invalid credentials');
			}
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
            SELECT 
                ir.*, su.firstname, su.lastname
            FROM 
                icap_reports ir
            JOIN
                scimic_user su ON ir.user_id = su.user_pk
            AND
                ir.user_id = $1`;
		var { rows } = await client.query(query, [id]);

		// console.log(rows);

		return sendOkResponse(res, rows);
	} catch (error) {
		// console.log(error);
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});


const githubClientSecret = '016c4fedd4f952e32f4433ec78a1a0e65fbbb3f2';
const githubClientId = '2e63a9cb2528d488121b';


router.get('/gitUserData', async (req, res) => {
	const params = `?client_id=${githubClientId}&client_secret=${githubClientSecret}&code=${req.query.code}`;

	try {
		const response = await fetch(`https://github.com/login/oauth/access_token${params}`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
			},
		});

		const data = await response.json();

		if (data.access_token) {

			const userDataResponse = await fetch('https://api.github.com/user', {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${data.access_token}`,
				},
			});

			const userData = await userDataResponse.json();


			res.status(200).json({
				access_token: data.access_token,
				user_data: userData,
			});
		} else {

			return sendErrorMessage(res, 'Failed to fetch GitHub access token');
		}
	} catch (error) {
		console.error(error);
		return sendInternalServerErrorResponse(res, 'Internal Server Error');
	}
});



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
			const {
				ca_qa_total,
				ca_lr_total,
				ca_time,
				tp_dsk_total,
				tp_hc_total,
				tp_time,
				cs_s_total,
				cs_w_total,
				cs_l_total,
				cs_r_total,
				cs_time,
				pb_itws_total,
				pb_acl_total,
				pb_pmtm_total,
				pb_peip_total,
				pb_time,
			} = config;
			// console.log(config);

			var Quantitative_Aptitude = await getQuestionsByCategory(client, ca_qa_total, 1, 1);
			var Logical_Reasoning = await getQuestionsByCategory(client, ca_lr_total, 1, 2);
			var Cognitive_Abilities = Quantitative_Aptitude.concat(Logical_Reasoning);

			var Domain_Specific_Knowledge = await getQuestionsByCategory(client, tp_dsk_total, 2, 3);
			var Hands_on_Coding = await getQuestionsByCategory(client, tp_hc_total, 2, 4);
			var Technical_Proficiency = Domain_Specific_Knowledge.concat(Hands_on_Coding);

			var English_Speaking = await getCompQuestionsByCategory(client, cs_s_total, 3, 5);
			var English_Listening = await getCompQuestionsByCategory(client, cs_l_total, 3, 6);
			var English_Reading = await getCompQuestionsByCategory(client, cs_r_total, 3, 7);
			var English_Writing = await getCompQuestionsByCategory(client, cs_w_total, 3, 8);
			var Communication_Skills = English_Speaking.concat(English_Listening)
				.concat(English_Reading)
				.concat(English_Writing);
			//Communication_Skills.sort((a, b) => a.comprehension_id - b.comprehension_id);

			var Interpersonal_and_Team_work_Skills = await getQuestionsByCategory(client, pb_itws_total, 4, 10);
			var Adaptability_and_Continuous_Learning = await getQuestionsByCategory(client, pb_acl_total, 4, 11);
			var Project_Management_and_Time_Management = await getQuestionsByCategory(client, pb_pmtm_total, 4, 12);
			var Professional_Etiquette_and_Interview_Preparedness = await getQuestionsByCategory(
				client,
				pb_peip_total,
				4,
				13
			);

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
					duration: ca_time * 60,
				},
				{
					totalquestions: Technical_Proficiency.length,
					questions: Technical_Proficiency,
					testname: 'Technical Proficiency',
					duration: tp_time * 60,
				},
				{
					totalquestions: Communication_Skills.length,
					questions: Communication_Skills,
					testname: 'Communication Skills',
					duration: cs_time * 60,
				},
				{
					totalquestions: Personality_and_Behavioral.length,
					questions: Personality_and_Behavioral,
					testname: 'Personality and Behavioral',
					duration: pb_time * 60,
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


router.post('/getcognitiveq', async (req, res) => {
	try {
		const jsonUrl = 'https://parametr-1.onrender.com/parameter1';
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

router.post('/approveq', async (req, res) => {
	const client = await pool.connect();
	const {
		question,
		option1,
		option2,
		option3,
		option4,
		answer,
		icap_category_id,
		icap_subcategory_id,
		icap_qscategory_id,
		comprehension_id,
		domain_id,
	} = req.body;
	try {
		if (
			!question ||
			!option1 ||
			!option2 ||
			!option3 ||
			!option4 ||
			!answer ||
			!icap_category_id ||
			!icap_subcategory_id ||
			!icap_qscategory_id
		) {
			return sendErrorMessage(res, 'Bad Request');
		}

		console.log(req.body);

		var query = `INSERT INTO scimic_questions 
		(question, option1, option2, option3, option4, answer, icap_category_id, icap_subcategory_id, icap_qscategory_id, comprehension_id, domain_id)
		VALUES 
		($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING *`;
		var values = [
			question,
			option1,
			option2,
			option3,
			option4,
			answer,
			icap_category_id,
			icap_subcategory_id,
			icap_qscategory_id,
			comprehension_id,
			domain_id,
		];
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			console.log(rows);
			return sendOkResponse(res, []);
		} else {
			return sendErrorMessage(res, 'Invalid question');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/updateq/:id', async (req, res) => {
	const client = await pool.connect();
	const { question, option1, option2, option3, option4, answer, icap_category_id, icap_subcategory_id } = req.body;
	try {
		if (
			(!req.params.id,
				!question ||
				!option1 ||
				!option2 ||
				!option3 ||
				!option4 ||
				!answer ||
				!icap_category_id ||
				!icap_subcategory_id)
		) {
			return sendErrorMessage(res, 'Bad Request');
		}

		var query = `
		UPDATE 
		scimic_questions 
		SET 
		question = $1, 
		option1 = $2, 
		option2 = $3, 
		option3 = $4, 
		option4 = $5, 
		answer = $6,
		icap_category_id = $8,
		icap_subcategory_id = $9

		WHERE scimic_question_pk = $7
		RETURNING *`;
		var values = [
			question,
			option1,
			option2,
			option3,
			option4,
			answer,
			req.params.id,
			icap_category_id,
			icap_subcategory_id,
		];
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			return sendOkResponse(res, []);
		} else {
			return sendErrorMessage(res, 'Invalid question');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/deleteq/:id', async (req, res) => {
	const client = await pool.connect();
	try {
		if (!req.params.id) {
			return sendErrorMessage(res, 'Bad Request');
		}

		var query = `
		DELETE FROM
		scimic_questions
		
		WHERE scimic_question_pk = $1
		RETURNING *`;
		var values = [req.params.id];
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			return sendOkResponse(res, []);
		} else {
			return sendErrorMessage(res, 'Invalid question');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/updateconfig', async (req, res) => {
	const client = await pool.connect();
	const {
		ca_qa_total,
		ca_lr_total,
		ca_time,
		tp_dsk_total,
		tp_hc_total,
		tp_time,
		cs_s_total,
		cs_w_total,
		cs_l_total,
		cs_r_total,
		cs_time,
		pb_itws_total,
		pb_acl_total,
		pb_pmtm_total,
		pb_peip_total,
		pb_time,
	} = req.body;

	try {
		if (
			ca_qa_total == null ||
			ca_lr_total == null ||
			ca_time == null ||
			tp_dsk_total == null ||
			tp_hc_total == null ||
			tp_time == null ||
			cs_s_total == null ||
			cs_w_total == null ||
			cs_l_total == null ||
			cs_r_total == null ||
			cs_time == null ||
			pb_itws_total == null ||
			pb_acl_total == null ||
			pb_pmtm_total == null ||
			pb_peip_total == null ||
			pb_time == null ||
			ca_qa_total === '' ||
			ca_lr_total === '' ||
			ca_time === '' ||
			tp_dsk_total === '' ||
			tp_hc_total === '' ||
			tp_time === '' ||
			cs_s_total === '' ||
			cs_w_total === '' ||
			cs_l_total === '' ||
			cs_r_total === '' ||
			cs_time === '' ||
			pb_itws_total === '' ||
			pb_acl_total === '' ||
			pb_pmtm_total === '' ||
			pb_peip_total === '' ||
			pb_time === ''
		) {
			return sendErrorMessage(res, 'Bad Configuration Request');
		}

		// console.log(req.body);

		var query = `UPDATE icap_config SET 
		    ca_qa_total = $1,
		    ca_lr_total = $2,
		    ca_time = $3,
		    tp_dsk_total = $4,
		    tp_hc_total = $5,
		    tp_time = $6,
		    cs_s_total = $7,
		    cs_w_total = $8,
		    cs_l_total = $9,
		    cs_r_total = $10,
		    cs_time = $11,
		    pb_itws_total = $12,
		    pb_acl_total = $13,
		    pb_pmtm_total = $14,
		    pb_peip_total = $15,
		    pb_time = $16
		WHERE icap_config_pk = 1
		RETURNING *`;

		var values = [
			ca_qa_total,
			ca_lr_total,
			ca_time,
			tp_dsk_total,
			tp_hc_total,
			tp_time,
			cs_s_total,
			cs_w_total,
			cs_l_total,
			cs_r_total,
			cs_time,
			pb_itws_total,
			pb_acl_total,
			pb_pmtm_total,
			pb_peip_total,
			pb_time,
		];

		var { rows } = await client.query(query, values);

		if (rows.length === 1) {
			return sendOkResponse(res, rows[0]);
		} else {
			return sendErrorMessage(res, 'Invalid configuration');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.get('/getconfig', async (req, res) => {
	const client = await pool.connect();

	try {
		const query = 'SELECT * FROM icap_config WHERE icap_config_pk = 1';
		const { rows } = await client.query(query);

		if (rows.length === 1) {
			// console.log(rows[0])
			return sendOkResponse(res, rows[0]);
		} else {
			return sendErrorMessage(res, 'Question Configuration not found');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.get('/questioncount', async (req, res) => {
	const client = await pool.connect();

	try {
		const query = `
            SELECT 
                icap_subcategory_id,
                COUNT(*) AS question_count
            FROM 
                scimic_questions 
            GROUP BY 
                icap_subcategory_id
			ORDER BY 
				icap_subcategory_id ASC;
        `;

		const { rows } = await client.query(query);

		if (rows.length > 0) {
			return sendOkResponse(res, rows);
		} else {
			return sendErrorMessage(res, 'No question counts found');
		}
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/getallquestionsbycategory', async (req, res) => {
	const client = await pool.connect();
	const { catid, subcatid } = req.body;
	try {
		const query = `
		SELECT * FROM scimic_questions q
		LEFT JOIN comprehension c
		ON c.comprehension_pk = q.comprehension_id
		WHERE q.icap_category_id = $1 AND q.icap_subcategory_id = $2
		`;
		const { rows } = await client.query(query, [catid, subcatid]);

		return sendOkResponse(res, rows);
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/getcategoryandsubcategory', async (req, res) => {
	const client = await pool.connect();
	try {
		const query = `
	   SELECT c.icap_category_pk,
       c.icap_category_name,
       json_agg(json_build_object('sub_category_pk', s.icap_subcategory_pk, 'sub_category_name', s.icap_subcategory_name)) AS subcategories
       FROM icap_categories c
       LEFT JOIN icap_subcategories s ON c.icap_category_pk = s.icap_category_id
       GROUP BY c.icap_category_pk, c.icap_category_name
		`;
		const { rows } = await client.query(query);

		return sendOkResponse(res, rows);
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});


function getPassword(length) {
	const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&?';
	let password = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		password += charset[randomIndex];
	}

	return password;
}

async function getCollegeByName(client, collegeName) {
	const { rows } = await client.query('SELECT * FROM scimic_college WHERE college_name = $1', [collegeName]);
	return rows[0];
}

async function getDepartmentByNameAndCollege(client, departmentName, college_id) {
	const { rows } = await client.query('SELECT * FROM scimic_department WHERE department_name = $1 AND college_id = $2', [
		departmentName,
		college_id,
	]);
	return rows[0];
}

async function getCourseByNameAndDepartmentAndCollege(client, courseName, department_id, college_id) {
	const { rows } = await client.query(
		'SELECT * FROM scimic_course WHERE course_name = $1 AND department_id = $2 AND college_pk = $3',
		[courseName, department_id, college_id]
	);
	return rows[0];
}


function isValidName(name) {
	const validNameRegex = /^[a-zA-Z0-9\s-]+$/;
	return validNameRegex.test(name);
}



async function getOrCreateCollege(client, collegeName) {
	if (!isValidName(collegeName)) {
		console.log(`Invalid college name: ${collegeName}. Skipping user.`);
		return null;
	}

	const existingCollege = await getCollegeByName(client, collegeName);

	if (existingCollege) {
		console.log(`College "${collegeName}" already exists. Returning existing college_id: ${existingCollege.college_pk}`);
		return existingCollege.college_pk;
	} else {
		console.log(`College "${collegeName}" not found. Creating a new college.`);
		const { rows } = await client.query('INSERT INTO scimic_college (college_name) VALUES ($1) RETURNING college_pk', [collegeName]);

		if (rows.length === 1) {
			console.log(`New college "${collegeName}" created with college_id: ${rows[0].college_pk}`);
			return rows[0].college_pk;
		} else {
			console.error(`Error creating college "${collegeName}"`);
			return null;
		}
	}
}

async function getOrCreateDepartment(client, departmentName, college_id) {
	if (!isValidName(departmentName)) {
		console.log(`Invalid department name: ${departmentName}. Skipping user.`);
		return null;
	}

	const existingDepartment = await getDepartmentByNameAndCollege(client, departmentName, college_id);

	if (existingDepartment) {
		console.log(`Department "${departmentName}" already exists. Returning existing department_id: ${existingDepartment.department_pk}`);
		return existingDepartment.department_pk;
	} else {
		console.log(`Department "${departmentName}" not found. Creating a new department.`);
		const { rows } = await client.query(
			'INSERT INTO scimic_department (department_name, college_id) VALUES ($1, $2) RETURNING department_pk',
			[departmentName, college_id]
		);

		if (rows.length === 1) {
			console.log(`New department "${departmentName}" created with department_id: ${rows[0].department_pk}`);
			return rows[0].department_pk;
		} else {
			console.error(`Error creating department "${departmentName}"`);
			return null;
		}
	}
}

async function getOrCreateCourse(client, courseName, department_id, college_id) {
	if (!isValidName(courseName)) {
		console.log(`Invalid course name: ${courseName}. Skipping user.`);
		return null;
	}

	const existingCourse = await getCourseByNameAndDepartment(client, courseName, department_id);

	if (existingCourse) {
		console.log(`Course "${courseName}" already exists. Returning existing course_id: ${existingCourse.course_pk}`);
		return existingCourse.course_pk;
	} else {
		console.log(`Course "${courseName}" not found. Creating a new course.`);

		const { rows } = await client.query(
			'INSERT INTO scimic_course (college_pk, course_name, department_id) VALUES ($1, $2, $3) RETURNING course_pk',
			[college_id, courseName, department_id]
		);

		if (rows.length === 1) {
			console.log(`New course "${courseName}" created with course_id: ${rows[0].course_pk}`);
			return rows[0].course_pk;
		} else {
			console.error(`Error creating course "${courseName}"`);
			return null;
		}
	}
}



router.post('/bulkuserupload', async (req, res) => {
	const client = await pool.connect();
	const request = req.body;
	const array = request.excelData;
	let count = 0;

	try {
		for (let i = 0; i < array.length; i++) {
			const {
				FirstName: firstname,
				LastName: lastname,
				Email: email,
				Phone: phone,
				College: collegeName,
				Department: departmentName,
				Course: courseName,
			} = array[i];

			if (![firstname, lastname, email, phone, collegeName, departmentName, courseName].every(Boolean)) {
				console.log('Skipping user due to missing or undefined data:', array[i]);
				continue;
			}

			const existingUser = await getUserByEmail(client, email);

			if (existingUser.length > 0) {
				console.log(`User with email ${email} already exists. Skipping.`);
				continue;
			}

			const college_id = await getOrCreateCollege(client, collegeName);
			const department_id = await getOrCreateDepartment(client, departmentName, college_id);
			const course_id = await getOrCreateCourse(client, courseName, department_id, college_id);

			if (!college_id || !department_id || !course_id) {
				throw new Error('Error fetching or creating IDs');
			}

			const randomPassword = getPassword(8);

			const query = `
                INSERT INTO scimic_user 
                (firstname, lastname, email, phone, hashed_password, country_code, signin_source, is_account_verified, college_id, department_id, course_id) 
                VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;

			const values = [
				firstname,
				lastname,
				email,
				phone,
				randomPassword,
				'+91',
				'EMAIL',
				false,
				college_id,
				department_id,
				course_id,
			];

			const { rows } = await client.query(query, values);

			if (rows.length === 1) {
				count++;
				const emailResult = await sendAccDetailsEmail(firstname, email, randomPassword);
				console.log(`User created: ${firstname} (${email})`);
			}
		}

		return sendOkResponse(res, `Users created: ${count}/${array.length}`);
	} catch (error) {
		console.error(error);
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});






router.get('/getusersbycollege', async (req, res) => {
	const client = await pool.connect();

	try {
		const collegesQuery = 'SELECT * FROM scimic_college';
		const collegesData = await client.query(collegesQuery);

		const collegesResult = await Promise.all(
			collegesData.rows.map(async (college) => {
				const departmentsQuery = 'SELECT * FROM scimic_department WHERE college_id = $1';
				const departmentsData = await client.query(departmentsQuery, [college.college_pk]);

				const departmentsResult = await Promise.all(
					departmentsData.rows.map(async (department) => {
						const coursesQuery = 'SELECT * FROM scimic_course WHERE department_id = $1';
						const coursesData = await client.query(coursesQuery, [department.department_pk]);

						const coursesResult = await Promise.all(
							coursesData.rows.map(async (course) => {
								const usersQuery = 'SELECT * FROM scimic_user WHERE course_id = $1';
								const usersData = await client.query(usersQuery, [course.course_pk]);

								const uData = usersData.rows.map((user) => ({
									user_id: user.user_pk,
									first_name: user.firstname,
									last_name: user.lastname,
									email: user.email,
									is_blocked: user.is_blocked,
								}));

								return {
									course_id: course.course_pk,
									course_name: course.course_name,
									u_data: uData,
								};
							})
						);

						return {
							department_id: department.department_pk,
							department_name: department.department_name,
							c_data: coursesResult,
						};
					})
				);

				return {
					college_id: college.college_pk,
					college_name: college.college_name,
					d_data: departmentsResult,
				};
			})
		);

		const finalResponse = collegesResult.map((collegeResult) => ({
			college_id: collegeResult.college_id,
			college_name: collegeResult.college_name,
			d_data: collegeResult.d_data.map((departmentResult) => ({
				department_id: departmentResult.department_id,
				department_name: departmentResult.department_name,
				c_data: departmentResult.c_data.map((courseResult) => ({
					course_id: courseResult.course_id,
					course_name: courseResult.course_name,
					u_data: courseResult.u_data.map((userData) => ({
						user_id: userData.user_id,
						first_name: userData.first_name,
						last_name: userData.last_name,
						email: userData.email,
						is_blocked: userData.is_blocked,
					})),
				})),
			})),
		}));

		return res.json(finalResponse);
	} catch (error) {
		console.error(error);
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

router.post('/updateuserblockedstatus', async (req, res) => {
	const client = await pool.connect();

	try {
		const { user_id, is_blocked } = req.body;

		if (user_id === undefined || is_blocked === undefined) {
			return sendBadRequestResponse(res, error.message);;
		}

		const updateUserQuery = `
		UPDATE scimic_user
		SET is_blocked = $1
		WHERE user_pk = $2
		RETURNING *;
	  `;

		const { rows } = await client.query(updateUserQuery, [is_blocked, user_id]);

		if (rows.length === 0) {
			return res.status(404).json({ error: 'User not found' });
		}

		const updatedUser = {
			is_blocked: rows[0].is_blocked,
			user_id: rows[0].user_pk,
		};

		return sendOkResponse(res, updatedUser);
	} catch (error) {
		console.error(error);
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

export default router;
