import { sendOtpEmail, sendSMS, sendWelcomeEmail } from '../services/emailjss.js';
import { getOTP } from '../utils/globalfunc.js';

import pool from '../utils/db.js';
import express from 'express';
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

router.post('/signuporlogin', async (req, res) => {
	const client = await pool.connect();
	const { firstname, lastname, email, signin_source, pic } = req.body;
	try {
		if (!firstname || !lastname || !email || !signin_source || !pic) {
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
			values = [firstname, lastname, email, pic, signin_source, true];
		}
		var { rows } = await client.query(query, values);
		if (rows.length == 1) {
			return sendOkResponse(res, rows[0]);
		} else {
			return sendErrorMessage(res, 'Invalid singup');
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
			delete userData.hashed_password;
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
		scimic_exam_reports 
		where user_id = $1`;
		var { rows } = await client.query(query, [id]);

		return sendOkResponse(res, rows);
	} catch (error) {
		return sendInternalServerErrorResponse(res, error.message);
	} finally {
		client.release();
	}
});

export default router;
