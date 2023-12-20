import jwt from 'jsonwebtoken';

//Generate an access token and a refresh token for this database user
function jwtTokens({ uuid, user_email, user_name, user_phone }) {
	const user = { uuid, user_email, user_name, user_phone };
	const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
	const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
	return { accessToken, refreshToken };
}

export { jwtTokens };
