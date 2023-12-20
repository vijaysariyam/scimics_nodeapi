import pool from "../utils/db.js";
import express from "express";
import {
  sendErrorMessage,
  sendInternalServerErrorResponse,
  sendOkResponse,
} from "../utils/response.js";

const router = express.Router();

// async function checkEmailExists(client, email) {
// 	const isFoundQuery = `
// 	  WITH email_check AS (
// 		SELECT EXISTS (SELECT 1 FROM scimic_user WHERE email = $1) AS "exists"
// 	  )
// 	  SELECT "exists" AS result FROM email_check`;

// 	const values = [email];
// 	const { rows } = await client.query(isFoundQuery, values);
// 	return rows[0].result;
// }

async function getUserByEmail(client, email) {
  const userQuery = `
	  SELECT * FROM scimic_user WHERE email = $1`;

  const { rows } = await client.query(userQuery, [email]);
  return rows;
}

router.post("/getcolleges", async (req, res) => {
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

router.post("/getcourses/:id", async (req, res) => {
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

router.post("/signup", async (req, res) => {
  const client = await pool.connect();
  const { firstname, lastname, email, password, signin_source } = req.body;
  try {
    if (!firstname || !lastname || !email || !signin_source) {
      return sendErrorMessage(res, "Bad Request");
    }
    var rows = await getUserByEmail(client, email);

    if (rows.length > 0) return sendErrorMessage(res, "Email Already exists");

    const query = `INSERT INTO scimic_user 
		(firstname, lastname, email, hashed_password, signin_source)VALUES 
		($1, $2, $3, $4, $5)
		RETURNING *`;
    var values = [firstname, lastname, email, password, signin_source];
    var { rows } = await client.query(query, values);
    if (rows.length == 1) {
      return sendOkResponse(res, []);
    } else {
      return sendErrorMessage(res, "Invalid singup");
    }
  } catch (error) {
    return sendInternalServerErrorResponse(res, error.message);
  } finally {
    client.release();
  }
});

router.post("/sendotp", async (req, res) => {
  const client = await pool.connect();
  const { email } = req.body;
  try {
    if (!email) {
      return sendErrorMessage(res, "Bad Request");
    }

    var rows = await getUserByEmail(client, email);
    if (rows.length == 0)
      return sendErrorMessage(res, "Couldn't find your account");

    var otp = "654321";
    const query = `
		UPDATE scimic_user 
		SET otp = $2 
		WHERE email = $1
		RETURNING *`;
    var values = [email, otp];
    var { rows } = await client.query(query, values);
    if (rows.length == 1) {
      return sendOkResponse(res, []);
    } else {
      return sendErrorMessage(res, "Invalid singup");
    }
  } catch (error) {
    return sendInternalServerErrorResponse(res, error.message);
  } finally {
    client.release();
  }
});

router.post("/verifyotp", async (req, res) => {
  const client = await pool.connect();
  const { email, received_otp } = req.body;
  try {
    if (!email || !received_otp) {
      return sendErrorMessage(res, "Bad Request");
    }

    var rows = await getUserByEmail(client, email);
    if (rows.length == 0)
      return sendErrorMessage(res, "Couldn't find your account");
    const userData = rows[0];
    if (received_otp != userData.otp)
      return sendErrorMessage(res, "Invalid otp");

    const query = `
		UPDATE scimic_user
		SET is_account_verified = true 
		WHERE email = $1
		RETURNING *`;
    var values = [email];
    var { rows } = await client.query(query, values);
    if (rows.length == 1) {
      return sendOkResponse(res, []);
    } else {
      return sendErrorMessage(res, "Invalid singup");
    }
  } catch (error) {
    return sendInternalServerErrorResponse(res, error.message);
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const client = await pool.connect();
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return sendErrorMessage(res, "Bad Request");
    }
    var rows = await getUserByEmail(client, email);
    if (rows.length == 0)
      return sendErrorMessage(res, "Couldn't find your account");

    const userData = rows[0];
    if (password != userData.hashed_password) {
      return sendErrorMessage(res, "Invalid credentials");
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

router.post("/updateuser", async (req, res) => {
  const client = await pool.connect();
  const {
    email,
    firstname,
    lastname,
    country_code,
    country,
    education,
    branch,
  } = req.body;
  try {
    if (
      !firstname ||
      !lastname ||
      !country_code ||
      !country ||
      !education ||
      !branch
    ) {
      return sendErrorMessage(res, "Bad Request");
    }

    var rows = await getUserByEmail(client, email);
    if (rows.length == 0)
      return sendErrorMessage(res, "Couldn't find your account");

    const query = `
		UPDATE scimic_user
		SET 
		firstname = $2,
		lastname = $3,
		country_code = $4,
		country = $5,
		education = $6,
		branch = $7
		
		WHERE email = $1
		RETURNING *`;
    var values = [
      email,
      firstname,
      lastname,
      country_code,
      country,
      education,
      branch,
    ];
    var { rows } = await client.query(query, values);
    if (rows.length == 1) {
      return sendOkResponse(res, []);
    } else {
      return sendErrorMessage(res, "Invalid update operation");
    }
  } catch (error) {
    return sendInternalServerErrorResponse(res, error.message);
  } finally {
    client.release();
  }
});

router.post("/updatepassword", async (req, res) => {
  const client = await pool.connect();
  const { email, hashed_password } = req.body;
  try {
    if (!email || !hashed_password) {
      return sendErrorMessage(res, "Bad Request");
    }

    var rows = await getUserByEmail(client, email);
    if (rows.length == 0)
      return sendErrorMessage(res, "Couldn't find your account");

    const query = `
		UPDATE scimic_user
		SET 
		hashed_password = $2,
		WHERE email = $1
		RETURNING *`;
    var values = [email, hashed_password];
    var { rows } = await client.query(query, values);
    if (rows.length == 1) {
      return sendOkResponse(res, []);
    } else {
      return sendErrorMessage(res, "Invalid update operation");
    }
  } catch (error) {
    return sendInternalServerErrorResponse(res, error.message);
  } finally {
    client.release();
  }
});

export default router;
