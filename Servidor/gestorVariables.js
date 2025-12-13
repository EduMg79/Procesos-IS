const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function accessCLAVECORREO() {
	const name = 'projects/mi-proyecto-474816/secrets/MAIL_PASS/versions/1';
	const [version] = await client.accessSecretVersion({ name });
	const datos = version.payload.data.toString('utf8');
	console.log('MAIL_PASS obtenido');
	return datos;
}

async function accessUSUARIOCORREO() {
	const name = 'projects/mi-proyecto-474816/secrets/MAIL_USER/versions/1';
	const [version] = await client.accessSecretVersion({ name });
	const datos = version.payload.data.toString('utf8');
	console.log('MAIL_USER obtenido');
	return datos;
}

async function accessMONGODBURI() {
	const name = 'projects/mi-proyecto-474816/secrets/MONGODB_URI/versions/1';
	const [version] = await client.accessSecretVersion({ name });
	const datos = version.payload.data.toString('utf8');
	console.log('MONGODB_URI obtenido');
	return datos;
}

module.exports = {
	accessCLAVECORREO,
	accessUSUARIOCORREO,
	accessMONGODBURI
};