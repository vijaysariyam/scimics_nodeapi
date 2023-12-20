function cleanJson(data) {
	if (Array.isArray(data)) {
		return data.map((item) => {
			if (item && typeof item === 'object') {
				delete item.uuid;
			}
			return item;
		});
	} else if (data && typeof data === 'object') {
		delete data.uuid;
	}

	if (Array.isArray(data)) {
		return data.map((item) => {
			if (item && typeof item === 'object') {
				delete item.vendor_uuid;
			}
			return item;
		});
	} else if (data && typeof data === 'object') {
		delete data.vendor_uuid;
	}

	return data;
}

export { cleanJson };
