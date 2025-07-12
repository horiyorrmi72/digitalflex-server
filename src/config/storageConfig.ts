import { S3Client } from "@aws-sdk/client-s3";
import { configVariables } from "./envConfig";
const { region, accessKeyId, secretAccessId } = configVariables.storage;


export const S3 = new S3Client({
    region: region,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessId
    }
})