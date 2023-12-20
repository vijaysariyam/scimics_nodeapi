import { cleanJson } from "./globalfunc.js";

export const minLength = 4;

export const sendOkResponse = (res, data) => {
  return res.status(200).json({ data: data });
};

export const sendBadRequestResponse = (res) => {
  return res.status(404).json({ error: "Bad Request" });
};

export const sendNotFoundResponse = (res) => {
  return res.status(400).json({ error: "Item not found" });
};

export const sendUserNotFoundResponse = (res) => {
  return res.status(400).json({ error: "Invalid Credentials" });
};

export const sendErrorMessage = (res, error) => {
  return res.status(400).json({ error: error });
};

export const sendInternalServerErrorResponse = (res, error) => {
  //console.log(error);
  return res.status(500).json({ error: error });
};
