import request from 'supertest';

describe('Email API Tests', () => {
	const server = 'http://localhost:8080/api/email';

	describe('registerMail', () => {
		const validEmail = 'srinucnu467@gmail.com';
		const invalidEmail = 'invalid_email';

		it('should return a 200 for a valid email', (done) => {
			request(server)
				.get(`/registermail/${validEmail}`)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err);
					// Add more assertions based on the response data as needed
					done();
				});
		});

		it('should return a 500 for an invalid email', (done) => {
			request(server)
				.get(`/registermail/${invalidEmail}`)
				.expect(500)
				.end((err, res) => {
					if (err) return done(err);
					// Add more assertions based on the response data as needed
					done();
				});
		});
	});
	describe('verifyAndsendMail', () => {
		const validInput = {
			email: 'invtechnologiesvijay2@gmail.com',
			subject: 'qwerty',
			body: 'body',
		};

		const invalidInput = {
			email: 'invtechnologiesvijay2@gmail.com',
			subject: 'qwerty',
		};

		it('should return a 404 for a missing fields/invalid url', (done) => {
			request(server)
				.post(`/verifyanndsendmail/`)
				.send(invalidInput)
				.expect(404)
				.end((err, res) => {
					if (err) return done(err);
					// Add more assertions based on the response data as needed
					done();
				});
		});

		it('should return a 200 for email sent for verfied emails', (done) => {
			request(server)
				.post(`/verifyanndsendmail/`)
				.send(validInput)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err);
					// Add more assertions based on the response data as needed
					done();
				});
		});

		it('should return a 500 for an unverified emails', (done) => {
			request(server)
				.post(`/verifyanndsendmail/`)
				.expect(500)
				.send(validInput)
				.end((err, res) => {
					if (err)
						if (err.code == 'MessageRejected') {
							return done(err);
						}
					// Add more assertions based on the response data as needed
					done();
				});
		});
	});
});

/*


import axios from 'axios';

import MockAdapter from 'axios-mock-adapter';
import {
	createAppointment,
	getUserAppointments,
	getVendorAppointments,
	getAppointmentById,
	updateAppointment,
	acceptRejectAppointment,
	deleteAppointment,
} from '../controllers/appointment.controller.js';

const mock = new MockAdapter(axios);

// Set the base URL for Axios requests
axios.defaults.baseURL = 'http://localhost:8080/api/appointments';
const authToken =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoicXdlcnR5IiwidXNlcl9lbWFpbCI6InZpamF5QGdtYWlsLmNvbSIsInVzZXJfbmFtZSI6InZpamF5IHNhcml5YW0iLCJ1c2VyX3Bob25lIjoiNzk4OTEwODQzNCIsImlhdCI6MTY4NzQzNzA0MX0.PTPmuhYjhtBG3Dstkg--Ogsnk5kCrzAN3mWp_jpMig0';

// Create an appointment
describe('createAppointment', () => {
	it('should create a new appointment', async () => {
		const appointmentData = {
			vendor_uuid: 'vendor-uuid',
			appointment_from: '2023-07-19',
			appointment_to: '2023-07-20',
			user_note: 'User note',
			vendor_note: 'Vendor note',
		};

		// Mock the API response
		mock.onPost('/', appointmentData).reply(200, { data: 'created' });
		const response = await createAppointment({ body: appointmentData, user: { uuid: 'user-uuid' } });
		expect(response.data).toEqual('created');
	});
});

*/
