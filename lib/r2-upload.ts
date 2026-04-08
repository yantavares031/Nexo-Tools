import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const BACKUPS_PREFIX = "backups/";

/** Prefixos no bucket nexo-tools (pastas no painel R2). */
export const R2_KEY_PREFIX_COMPROVACOES = "comprovacoes/";
export const R2_KEY_PREFIX_ORDENS_COMPRA = "ordens-compra/";

const APP_OBJECT_PREFIXES = [R2_KEY_PREFIX_COMPROVACOES, R2_KEY_PREFIX_ORDENS_COMPRA] as const;

export function isR2AppObjectKey(key: string): boolean {
  return APP_OBJECT_PREFIXES.some((p) => key.startsWith(p));
}

export function buildComprovacaoObjectKey(fileId: string, ext: string): string {
  return `${R2_KEY_PREFIX_COMPROVACOES}${fileId}${ext}`;
}

/** PDF enviado pela agência: ordens-compra/{ordemId}/agencia/{fileId}.ext */
export function buildOrdemCompraAgenciaObjectKey(
  ordemCompraId: string,
  fileId: string,
  ext: string
): string {
  return `${R2_KEY_PREFIX_ORDENS_COMPRA}${ordemCompraId}/agencia/${fileId}${ext}`;
}

/** PDF da OC assinada (admin): ordens-compra/{ordemId}/assinado/{fileId}.ext */
export function buildOrdemCompraAssinadoObjectKey(
  ordemCompraId: string,
  fileId: string,
  ext: string
): string {
  return `${R2_KEY_PREFIX_ORDENS_COMPRA}${ordemCompraId}/assinado/${fileId}${ext}`;
}

function assertAppObjectKey(key: string): void {
  if (!isR2AppObjectKey(key)) {
    throw new Error(`Chave R2 de app inválida: ${key}`);
  }
}

/**
 * Upload de anexos do painel (comprovações / ordens de compra), fora do prefixo backups/.
 */
export async function putAppObjectToR2(input: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  assertAppObjectKey(input.key);
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME não configurado.");
  }
  const client = getR2S3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    })
  );
}

export async function getAppObjectBufferFromR2(key: string): Promise<Buffer> {
  assertAppObjectKey(key);
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME não configurado.");
  }
  const client = getR2S3Client();
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = res.Body;
  if (!body) {
    throw new Error("Objeto vazio no R2.");
  }
  return Buffer.from(await body.transformToByteArray());
}

export async function deleteAppObjectFromR2(key: string): Promise<void> {
  assertAppObjectKey(key);
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME não configurado.");
  }
  const client = getR2S3Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

function getMaxBackupsRetained(): number {
  const raw = process.env.BACKUP_R2_MAX_RETAINED?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 3;
  return Number.isFinite(n) && n >= 1 ? n : 3;
}

export function getR2S3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 não configurado. Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY."
    );
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });
}

export async function listBackupKeysInR2(): Promise<string[]> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME não configurado.");
  }
  const client = getR2S3Client();
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: BACKUPS_PREFIX,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of response.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  return keys.sort();
}

export async function deleteBackupFromR2(key: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME não configurado.");
  }
  if (!key.startsWith(BACKUPS_PREFIX)) {
    throw new Error(`Chave inválida para backup: ${key}`);
  }
  const client = getR2S3Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Envia o buffer ao R2 em backups/{filename}, aplicando rotação (padrão: manter os 3 mais recentes).
 */
export async function uploadBackupToR2(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME não configurado.");
  }
  const max = getMaxBackupsRetained();
  const keys = await listBackupKeysInR2();
  if (keys.length >= max) {
    const toRemove = keys.length - max + 1;
    for (let i = 0; i < toRemove; i++) {
      await deleteBackupFromR2(keys[i]!);
    }
  }
  const key = `${BACKUPS_PREFIX}${filename}`;
  const client = getR2S3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: "application/octet-stream",
    })
  );
  return key;
}
