import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput, CommonPrefix, Object as S3Object } from "@aws-sdk/client-s3";

// Interface for folder structure
interface Folder {
  name: string;
  path: string;
  url: string;
}

// Interface for object structure
interface Object {
  name: string;
  lastModified: Date | undefined;
  size: number | undefined;
  path: string;
  url: string;
}

interface QueryResult {
  folders: Folder[];
  objects: Object[];
}

const ensureEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value;
};

const s3Client = new S3Client({
  region: ensureEnv("AWS_REGION"),
  credentials: {
    accessKeyId: ensureEnv("AWS_ACCESS_KEY_ID"),
    secretAccessKey: ensureEnv("AWS_SECRET_ACCESS_KEY"),
  },
});
const excludeRegex = new RegExp(process.env.EXCLUDE_PATTERN || /(?!)/);

const formatUrl = (path: string): string => `http://${process.env.BUCKET_NAME}/${path}`;

const mapFolders = (prefix: string, commonPrefixes: CommonPrefix[] = []): Folder[] =>
  commonPrefixes
    .filter(({ Prefix }) => Prefix !== undefined && !excludeRegex.test(Prefix))
    .map(({ Prefix = '' }) => ({
      name: Prefix.slice(prefix.length),
      path: Prefix,
      url: formatUrl(Prefix),
    }));

const mapObjects = (prefix: string, contents: S3Object[] = []): Object[] =>
  contents
    .filter(({ Key }) => Key && !excludeRegex.test(Key))
    .map(({ Key, LastModified, Size }) => ({
      name: Key.slice(prefix.length),
      lastModified: LastModified,
      size: Size,
      path: Key,
      url: formatUrl(Key),
    }));

const listContents = async (prefix: string): Promise<QueryResult> => {
  console.debug("Retrieving data from AWS SDK");
  const data: ListObjectsV2CommandOutput = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: process.env.BUCKET_NAME,
      Prefix: prefix,
      Delimiter: "/",
    })
  );
  console.debug(`Received data: ${JSON.stringify(data, null, 2)}`);

  return {
    folders: mapFolders(prefix, data.CommonPrefixes),
    objects: mapObjects(prefix, data.Contents),
  };
};

export const useContents = (prefix: string): UseQueryResult<QueryResult, Error> => {
  return useQuery<QueryResult, Error>(["contents", prefix], () => listContents(prefix));
};
