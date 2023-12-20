import pg from 'pg';
const { Pool } = pg;

let localPoolConfig = {
	//ssl: false,
	timezone: 'Asia/Calcutta',
	// user: process.env.RDSUSERNAME,
	// password: process.env.RDSPASSWORD,
	// host: process.env.RDSHOST,
	// port: process.env.RDSPORT,
	// database: process.env.RDSDATABASE,

	user: 'postgres',
	password: '+DqY?,F|:O;RZm>',
	//host: 'letzadd-database.csmytkiw33g8.ap-south-1.rds.amazonaws.com',
	host: 'letzadddbfinal.csmytkiw33g8.ap-south-1.rds.amazonaws.com',
	port: 5432,
	database: 'postgres',

	// user: 'postgres',
	// password: 'root',
	// host: 'localhost',
	// port: 5432,
	// database: 'postgres',
};
//DATABASE_URL = postgresql://postgres:postgres@database-letzad.csmytkiw33g8.ap-south-1.rds.amazonaws.com:5432/postgres

const poolConfig = process.env.DATABASE_URL
	? {
			connectionString: process.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: false,
			},
	  }
	: localPoolConfig;

const pool = new Pool(poolConfig);

export default pool;
