const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION,
    credentials: {
        accessKeyId: process.env.B2_ACCESS_KEY,
        secretAccessKey: process.env.B2_SECRET_KEY,
    },
    forcePathStyle: true,
});

async function getSignedStreamUrl(key) {
    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: key,
    });

    const url = await getSignedUrl(s3, command, {
        expiresIn: 3600,
    });

    return url;
}

async function uploadFile(key, body, contentType) {
    const command = new PutObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3.send(command);
    return key;
}

async function getObject(key) {
    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: key,
    });

    const resp = await s3.send(command);
    return resp; // contains Body (stream), ContentType, ContentLength
}

function getPublicUrl(key) {
    const endpoint = process.env.B2_ENDPOINT.replace(/\/$/, '');
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return `${endpoint}/${process.env.B2_BUCKET}/${encodedKey}`;
}

module.exports = {
    getSignedStreamUrl,
    uploadFile,
    getPublicUrl,
    getObject,
};