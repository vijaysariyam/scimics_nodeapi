import request from 'supertest';
import { expect } from 'chai';

describe('Promocode API Tests', () => {
	var createRoute = `/`;
	var id = 0;
	const server = 'http://localhost:8080/api/promocode';
	const authToken =
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoicXdlcnR5IiwidXNlcl9lbWFpbCI6InZpamF5QGdtYWlsLmNvbSIsInVzZXJfbmFtZSI6InZpamF5IHNhcml5YW0iLCJ1c2VyX3Bob25lIjoiNzk4OTEwODQzNCIsImlhdCI6MTY4NzQzNzA0MX0.PTPmuhYjhtBG3Dstkg--Ogsnk5kCrzAN3mWp_jpMig0';
	const authTokenInvalid =
		'xeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoicXdlcnR5IiwidXNlcl9lbWFpbCI6InZpamF5QGdtYWlsLmNvbSIsInVzZXJfbmFtZSI6InZpamF5IHNhcml5YW0iLCJ1c2VyX3Bob25lIjoiNzk4OTEwODQzNCIsImlhdCI6MTY4NzQzNzA0MX0.PTPmuhYjhtBG3Dstkg--Ogsnk5kCrzAN3mWp_jpMig0';

	const validData = {
		promocode: 'SUMMER2023',
		promocode_title: 'Summer Sale 2023',
		promocode_disc: 'Get 20% off on all products',
	};

	const validUpdatedData = {
		promocode: 'SUMMER2023',
		promocode_title: 'Summer Sale 2023',
		promocode_disc: 'Get 30% off on all products',
	};

	const missingData = {
		// Missing some required data
		promocode_title: 'Summer Sale 2023',
		promocode_disc: 'Get 30% off on all products',
	};

	describe('create new Promocode', () => {
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
					const { promocode_id } = res.body.data;
					id = promocode_id;
					done();
				});
		});

		describe('update created Promocode', () => {
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

		describe('get created Promocode info by id', () => {
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

		describe('get all created vendor Promocodes', () => {
			it('should return 401 for Unauthorized user', (done) => {
				request(server)
					.get(`${createRoute}all/promocodes`)
					.expect(401)
					.end((err, res) => {
						if (err) return done(err);
						// Add more assertions based on the response data as needed
						done();
					});
			});

			it('should return 403 for Unauthorized Token', (done) => {
				request(server)
					.get(`${createRoute}all/promocodes`)
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
					.get(`${createRoute}all/promocodes`)
					.set('Authorization', `Bearer ${authToken}`)
					.expect(200)
					.end((err, res) => {
						if (err) return done(err);
						done();
					});
			});
		});

		describe('delete created  promocode by id', () => {
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
