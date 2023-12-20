import emailjs from "@emailjs/nodejs";

// Initialize emailjs with your credentials
emailjs.init({
  publicKey: "E5VmnTP471L8W0iFW",
  privateKey: "6NVEakpwXyPMDLLNACGPf",
});

import axios from "axios";

// Function to send an email

export const sendOtpEmail = async (personname, to_email, otp) => {
  try {
    const genOtp = otp;
    const response = await emailjs.send("service_ijyi40f", "template_cmp7drg", {
      personname: personname,
      your_otp: genOtp,
      to_email: to_email,
    });
    //console.log('SUCCESS!', response.status, response.text);
    return { success: true };
  } catch (err) {
    console.log("FAILED...", err);
    return { success: false, message: "Email sending failed" };
  }
};

export const sendWelcomeEmail = async (personname, to_email) => {
  try {
    const response = await emailjs.send("service_ijyi40f", "template_19aivxk", {
      personname: personname,
      to_email: to_email,
    });
    return { success: true };
  } catch (err) {
    console.log("FAILED...", err);
    return { success: false, message: "Email sending failed" };
  }
};

export const sendSMS = async (mobile, username, otp) => {
  try {
    const apiUrl = `http://colourmoontraining.com/otp_sms/sendsms?user_id=invtechnologies&mobile=${mobile}&message=Dear ${username} your one time password (OTP) ${otp} Regards CMTOTP`;
    // Send the HTTP GET request to the SMS service
    const response = await axios.post(apiUrl);

    // Check the response status from the SMS service
    if (response.status === 200) {
      return { success: true, message: "SMS sent successfully" };
    } else {
      return { success: false, message: "SMS sending failed" };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return { success: false, message: "SMS sending failed" };
  }
};

export const getPaper = async (mobile, username, otp) => {
  var values = {
    stream: "Btech",
    course: "CSE",
    "1Q_count": "2",
    "1Q_time": "2",
    "2Q_time": "2",
    "2Q_a_count": "2",
    "2Q_b_count": "2",
    "2Q_c_count": "2",
    "2Q_d_count": "2",
    "3Q_time": "2",
    "3Q_a_count": "2",
    "3Q_b_count": "2",
    "4Q_time": "2",
    "4Q_a_count": "2",
    "4Q_b_count": "2",
    "5Q_time": "2",
    "5Q_a_count": "2",
    "5Q_b_count": "2",
    "6Q_time": "2",
    "6Q_a_count": "2",
    "6Q_b_count": "2",
    "6Q_c_count": "2",
    "6Q_d_count": "2",
    "6Q_e_count": "2",
    "7Q_time": "2",
    "7Q_a_count": "2",
    "7Q_b_count": "2",
  };
  try {
    const apiUrl = `https://mcq-generator-xr5k.onrender.com/get_mcq`;
    // Send the HTTP GET request to the SMS service
    const response = await axios.post(apiUrl, values);

    // Check the response status from the SMS service
    if (response.status === 200) {
      return { success: true, message: response.data };
    } else {
      return { success: false, message: "SMS sending failed" };
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return { success: false, message: "SMS sending failed" };
  }
};
