import multer from "multer";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import { S3 } from "../../config/storageConfig";
import { configVariables } from "../../config/envConfig";
import { BaseError } from "../errors/BaseError";
import { BadRequest } from "../errors";
import logger from "../logger";
import { DeleteObjectCommand, waitUntilObjectNotExists } from "@aws-sdk/client-s3";
import path from "path";

const { bucketName } = configVariables.storage;


const fileUploadTypeToFolder: Record<string, string> = {
    'image/jpeg': 'images/',
    'image/jpg': 'images/',
    'image/png': 'images/',
    'application/pdf': 'documents/',
    'application/msword': 'documents/',
    'application/vnd.ms-excel': 'documents/',
    'text/csv': 'documents/',
    'video/mp4': 'videos/',
    'video/webm': 'videos/'
}

export const upload = multer({ storage: multer.memoryStorage() });
export class mediaStorage {
    static async uploadToBucket(fileData: Express.Multer.File) {
        if (!fileData) {
            throw new BadRequest('Error uploading data: empty data provided');
        }

        const { originalname, buffer, mimetype } = fileData;
        const folder = fileUploadTypeToFolder[mimetype];
        if (!folder) {
            throw new BadRequest(`Unsupported file type: ${mimetype}`);
        }

        const fileExtension = path.extname(originalname);
        const fileBaseName = path.basename(originalname, fileExtension);

        const key = `${folder}${fileBaseName}-${uuidv4()}${fileExtension}`;

        try {
            const uploader = new Upload({
                client: S3,
                params: {
                    Bucket: bucketName,
                    Key: key,
                    Body: buffer,
                    ContentType: mimetype,
                },
            });

            uploader.on('httpUploadProgress', (progress) => {
                logger.info(`Upload progress: ${JSON.stringify(progress)}`);
            });

            const result = await uploader.done();
            // console.log('storage done data:', result)
            return {
                key,
                url: result.Location,
                bucket: bucketName
            };

        } catch (error) {
            logger.error('Error uploading data to storage', error);
            throw new BaseError('Failed to upload file to S3');
        }
    }

    static async deleteObjectFromBucket(key: string) {
        if (!key) {
            throw new BadRequest("No object key specified for deletion");
        }

        try {
            await S3.send(
                new DeleteObjectCommand({
                    Bucket: bucketName,
                    Key: key,
                })
            );

            await waitUntilObjectNotExists(
                { client: S3, maxWaitTime: 30 },
                { Bucket: bucketName, Key: key }
            );

            logger.info(`Successfully deleted object ${key} from bucket ${bucketName}`);
        } catch (error) {
            logger.error(`Error deleting object ${key} from S3`, error);
            throw new BaseError(`Failed to delete object ${key} from S3`);
        }
    };
}