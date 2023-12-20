function cleanJson(data) {
  if (Array.isArray(data)) {
    return data.map((item) => {
      if (item && typeof item === "object") {
        delete item.uuid;
      }
      return item;
    });
  } else if (data && typeof data === "object") {
    delete data.uuid;
  }

  if (Array.isArray(data)) {
    return data.map((item) => {
      if (item && typeof item === "object") {
        delete item.vendor_uuid;
      }
      return item;
    });
  } else if (data && typeof data === "object") {
    delete data.vendor_uuid;
  }

  return data;
}

function getOTP(length) {
  const charset = "0123456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

export { cleanJson, getOTP };
