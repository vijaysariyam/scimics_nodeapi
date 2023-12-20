import request from 'supertest';
import { expect } from 'chai';

describe('Branch API Tests', () => {
	var createRoute = `/`;
	var id = 0;
	const server = 'http://localhost:8080/api/branch';
	const authToken =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoicXdlcnR5IiwidXNlcl9lbWFpbCI6InZpamF5QGdtYWlsLmNvbSIsInVzZXJfbmFtZSI6InZpamF5IHNhcml5YW0iLCJ1c2VyX3Bob25lIjoiNzk4OTEwODQzNCIsImlhdCI6MTY4NzQzNzA0MX0.PTPmuhYjhtBG3Dstkg--Ogsnk5kCrzAN3mWp_jpMig0';
	const authTokenInvalid =
		'xeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoicXdlcnR5IiwidXNlcl9lbWFpbCI6InZpamF5QGdtYWlsLmNvbSIsInVzZXJfbmFtZSI6InZpamF5IHNhcml5YW0iLCJ1c2VyX3Bob25lIjoiNzk4OTEwODQzNCIsImlhdCI6MTY4NzQzNzA0MX0.PTPmuhYjhtBG3Dstkg--Ogsnk5kCrzAN3mWp_jpMig0';

	const validData = {
		branch_name: 'Test Branch from unit',
		branch_address:
			'47-7-24, B-3, Seshu Apartments, 4th Lane, Beside Gruhapriya Sweet, Pincode:, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530016',
		branch_city: 'DWARAKANAGAR',
		branch_district: 'VISAKHAPATNAM',
		branch_lat: 80.123456789,
		branch_long: 90.123456789,
		branch_location_id: 'xq12w3e4r5t6y7u8i9o0p',

		is_mon_open: true,
		timing_mon_from: '09:00:00',
		timing_mon_to: '10:00:00',
		is_tue_open: true,
		timing_tue_from: '09:00:00',
		timing_tue_to: '10:00:00',
		is_wed_open: true,
		timing_wed_from: '09:00:00',
		timing_wed_to: '10:00:00',
		is_thr_open: true,
		timing_thr_from: '09:00:00',
		timing_thr_to: '10:00:00',
		is_fri_open: true,
		timing_fri_from: '09:00:00',
		timing_fri_to: '10:00:00',
		is_sat_open: true,
		timing_sat_from: '09:00:00',
		timing_sat_to: '10:00:00',
		is_sun_open: true,
		timing_sun_from: '09:00:00',
		timing_sun_to: '10:00:00',
	};

	const validUpdatedData = {
		branch_name: 'updated Test Branch from unit',
		branch_address:
			'47-7-24, B-3, Seshu Apartments, 4th Lane, Beside Gruhapriya Sweet, Pincode:, Dwaraka Nagar, Visakhapatnam, Andhra Pradesh 530016',
		branch_city: 'DWARAKANAGAR',
		branch_district: 'VISAKHAPATNAM',
		branch_lat: 80.123456789,
		branch_long: 90.123456789,
		branch_location_id: 'xq12w3e4r5t6y7u8i9o0p',

		is_mon_open: true,
		timing_mon_from: '09:00:00',
		timing_mon_to: '10:00:00',
		is_tue_open: true,
		timing_tue_from: '09:00:00',
		timing_tue_to: '10:00:00',
		is_wed_open: true,
		timing_wed_from: '09:00:00',
		timing_wed_to: '10:00:00',
		is_thr_open: true,
		timing_thr_from: '09:00:00',
		timing_thr_to: '10:00:00',
		is_fri_open: true,
		timing_fri_from: '09:00:00',
		timing_fri_to: '10:00:00',
		is_sat_open: true,
		timing_sat_from: '09:00:00',
		timing_sat_to: '10:00:00',
		is_sun_open: false,
		timing_sun_from: '09:30:00',
		timing_sun_to: '10:00:00',
	};

	const missingData = {
		// Missing some required data
		is_sat_open: true,
		timing_sat_from: '09:00:00',
		timing_sat_to: '10:00:00',
		is_sun_open: false,
		timing_sun_from: '09:30:00',
		timing_sun_to: '10:00:00',
	};

	describe('create new Branch', () => {
		it('should return 401 for Unauthorized user', (done) => {
			request(server)
				.post(createRoute)
				.send(validData)
				.expect(401)
				.end((err, res) => {
					if (err) return done(err);
					// Add more assertions based on the response data as needed
					done();
				});
		});

		it('should return 403 for Unauthorized Token', (done) => {
			request(server)
				.post(createRoute)
				.set('Authorization', `Bearer ${authTokenInvalid}`)
				.send(validData)
				.expect(403)
				.end((err, res) => {
					if (err) return done(err);
					// Add more assertions based on the response data as needed
					done();
				});
		});

		it('should return a 404 for invalid input/invalid url', (done) => {
			request(server)
				.post(createRoute)
				.set('Authorization', `Bearer ${authToken}`)
				.send(missingData)
				.expect(404)
				.end((err, res) => {
					if (err) return done(err);
					// Add more assertions based on the response data as needed
					done();
				});
		});

		it('should return a 200 for valid data and valid Authorization', (done) => {
			request(server)
				.post(createRoute)
				.set('Authorization', `Bearer ${authToken}`)
				.send(validData)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err);
					const { branch_id } = res.body.data;
					id = branch_id;
					done();
				});
		});

		describe('update created Branch', () => {
			it('should return 401 for Unauthorized user', (done) => {
				request(server)
					.put(`${createRoute}${id}`)
					.send(validUpdatedData)
					.expect(401)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return 403 for Unauthorized Token', (done) => {
				request(server)
					.put(`${createRoute}${id}`)
					.set('Authorization', `Bearer ${authTokenInvalid}`)
					.send(validUpdatedData)
					.expect(403)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return a 404 for invalid input/invalid url', (done) => {
				request(server)
					.put(`${createRoute}${id}`)
					.set('Authorization', `Bearer ${authToken}`)
					.send(missingData)
					.expect(404)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return a 200 for valid data and valid Authorization', (done) => {
				request(server)
					.put(`${createRoute}${id}`)
					.set('Authorization', `Bearer ${authToken}`)
					.send(validUpdatedData)
					.expect(200)
					.end((err, res) => {
						if (err) return done(err);
						done();
					});
			});
		});

		describe('get created Branch info by id', () => {
			it('should return 401 for Unauthorized user', (done) => {
				request(server)
					.get(`${createRoute}${id}`)
					.expect(401)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return 403 for Unauthorized Token', (done) => {
				request(server)
					.get(`${createRoute}${id}`)
					.set('Authorization', `Bearer ${authTokenInvalid}`)
					.expect(403)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return a 404 for invalid input/invalid url', (done) => {
				request(server)
					.get(`${createRoute}`)
					.set('Authorization', `Bearer ${authToken}`)
					.expect(404)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return a 200 for valid data and valid Authorization', (done) => {
				request(server)
					.get(`${createRoute}${id}`)
					.set('Authorization', `Bearer ${authToken}`)
					.expect(200)
					.end((err, res) => {
						if (err) return done(err);
						done();
					});
			});
		});

		describe('get all created vendor Branches', () => {
			it('should return 401 for Unauthorized user', (done) => {
				request(server)
					.get(`${createRoute}all/branches`)
					.expect(401)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return 403 for Unauthorized Token', (done) => {
				request(server)
					.get(`${createRoute}all/branches`)
					.set('Authorization', `Bearer ${authTokenInvalid}`)
					.expect(403)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return a 404 for invalid input/invalid url', (done) => {
				request(server)
					.get(`${createRoute}`)
					.set('Authorization', `Bearer ${authToken}`)
					.expect(404)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return a 200 for valid data and valid Authorization', (done) => {
				request(server)
					.get(`${createRoute}all/branches`)
					.set('Authorization', `Bearer ${authToken}`)
					.expect(200)
					.end((err, res) => {
						if (err) return done(err);
						done();
					});
			});
		});

		describe('delete created  branch by id', () => {
			it('should return 401 for Unauthorized user', (done) => {
				request(server)
					.delete(`${createRoute}${id}`)
					.expect(401)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return 403 for Unauthorized Token', (done) => {
				request(server)
					.delete(`${createRoute}${id}`)
					.set('Authorization', `Bearer ${authTokenInvalid}`)
					.expect(403)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return a 404 for invalid input/invalid url', (done) => {
				request(server)
					.delete(`${createRoute}`)
					.set('Authorization', `Bearer ${authToken}`)
					.expect(404)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return a 200 for valid data and valid Authorization', (done) => {
				request(server)
					.delete(`${createRoute}${id}`)
					.set('Authorization', `Bearer ${authToken}`)
					.expect(200)
					.end((err, res) => {
						if (err) return done(err);
						done();
					});
			});
		});
	});
});
