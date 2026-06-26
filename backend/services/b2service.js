const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
// require("dotenv").config();

const s3 = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION,
    credentials: {
        accessKeyId: process.env.B2_ACCESS_KEY,
        secretAccessKey: process.env.B2_SECRET_KEY,
    },
});

async function getSignedStreamUrl(key) {

    console.log("========== B2 DEBUG ==========");
    console.log("Bucket :", process.env.B2_BUCKET);
    console.log("Endpoint :", process.env.B2_ENDPOINT);
    console.log("Region :", process.env.B2_REGION);
    console.log("Key :", key);

    const command = new GetObjectCommand({
        Bucket: process.env.B2_BUCKET,
        Key: key,
    });

    const url = await getSignedUrl(s3, command, {
        expiresIn: 3600,
    });

    console.log("Generated URL:");
    console.log(url);
    console.log("==============================");

    return url;
}

module.exports = {
    getSignedStreamUrl,
};