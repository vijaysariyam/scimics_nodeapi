import emailjs from '@emailjs/nodejs';

// Initialize emailjs with your credentials
emailjs.init({
	publicKey: 'ufswNKmMHakam6OC1',
	privateKey: '77T8dAuakNxQvm0JvQPxF',
});

import axios from 'axios';

// Function to send an email

export const sendEmail = async (personname, to_email) => {
	function generateOtp() {
		const min = 100000;
		const max = 999999;
		return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
	}
	try {
		const genOtp = generateOtp();
		const response = await emailjs.send('service_70jsihm', 'template_b20b5vg', {
			from_name: 'Toivotek Registration',
			personname: personname,
			your_otp: genOtp,
			to_email: to_email,
		});
		//console.log('SUCCESS!', response.status, response.text);
		return { success: true, otp: genOtp };
	} catch (err) {
		console.log('FAILED...', err);
		return { success: false, message: 'Email sending failed' };
	}
};

export const sendSMS = async (mobile, username, otp) => {
	try {
		const apiUrl = `http://colourmoontraining.com/otp_sms/sendsms?user_id=invtechnologies&mobile=${mobile}&message=Dear ${username} your one time password (OTP) ${otp} Regards CMTOTP`;
		// Send the HTTP GET request to the SMS service
		const response = await axios.post(apiUrl);

		// Check the response status from the SMS service
		if (response.status === 200) {
			return { success: true, message: 'SMS sent successfully' };
		} else {
			return { success: false, message: 'SMS sending failed' };
		}
	} catch (error) {
		console.error('An error occurred:', error);
		return { success: false, message: 'SMS sending failed' };
	}
};
