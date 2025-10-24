import * as crypto from 'crypto';

/**
 * OBS请求参数接口
 */
export interface ObsRequestParams {
  /** HTTP请求方法 (GET, PUT, POST, DELETE等) */
  httpMethod: string;
  
  /** 请求头部 */
  headers: Record<string, string | string[]>;
  
  /** 查询参数 */
  queries?: Record<string, string | null>;
  
  /** 桶名 */
  bucketName: string;
  
  /** 对象名 (可选) */
  objectName?: string;
}

/**
 * OBS签名生成器接口
 */
export class ObsSignatureGenerator {
  private static readonly SIGN_SEP = "\n";
  private static readonly OBS_PREFIX = "x-obs-";
  private static readonly SUB_RESOURCES = [
    "CDNNotifyConfiguration", "acl", "append", "attname", "backtosource", "cors", "customdomain", "delete",
    "deletebucket", "directcoldaccess", "encryption", "inventory", "length", "lifecycle", "location", "logging",
    "metadata", "mirrorBackToSource", "modify", "name", "notification", "obscompresspolicy", "orchestration",
    "partNumber", "policy", "position", "quota", "rename", "replication", "response-cache-control",
    "response-content-disposition", "response-content-encoding", "response-content-language", "response-content-type",
    "response-expires", "restore", "storageClass", "storagePolicy", "storageinfo", "tagging", "torrent", "truncate",
    "uploadId", "uploads", "versionId", "versioning", "versions", "website", "x-image-process",
    "x-image-save-bucket", "x-image-save-object", "x-obs-security-token", "object-lock", "retention"
  ];

  private accessKey: string;
  private secretKey: string;

  /**
   * 创建OBS签名生成器，从环境变量读取AK和SK
   */
  constructor() {
    // 从环境变量读取AK和SK
    this.accessKey = process.env.OBS_ACCESS_KEY_ID || '';
    this.secretKey = process.env.OBS_SECRET_ACCESS_KEY || '';
    
    // 验证凭证是否存在
    if (!this.accessKey || !this.secretKey) {
      throw new Error('环境变量 OBS_ACCESS_KEY_ID 和 OBS_SECRET_ACCESS_KEY 必须设置');
    }
  }

  /**
   * 生成OBS请求的Authorization头部值
   * @param params OBS请求参数
   * @returns 签名字符串，格式为 "OBS {accessKey}:{signature}"
   */
  public generateAuthorization(params: ObsRequestParams): string {
    const { httpMethod, bucketName, objectName = "" } = params;
    
    // 标准化headers格式
    const standardHeaders: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(params.headers)) {
      if (Array.isArray(value)) {
        standardHeaders[key] = value;
      } else if (value !== undefined && value !== null) {
        standardHeaders[key] = [value];
      }
    }
    
    // 标准化queries格式
    const standardQueries: Record<string, string | null> = {};
    if (params.queries) {
      for (const [key, value] of Object.entries(params.queries)) {
        standardQueries[key] = value;
      }
    }
    
    // 生成签名
    return this.headerSignature(
      httpMethod,
      standardHeaders,
      standardQueries,
      bucketName,
      objectName
    );
  }

  /**
   * 为完整请求生成签名头部
   * @param httpMethod HTTP方法
   * @param headers 请求头部
   * @param queries 查询参数
   * @param bucketName 桶名
   * @param objectName 对象名
   * @returns 签名字符串
   */
  private headerSignature(
    httpMethod: string,
    headers: Record<string, string[]>,
    queries: Record<string, string | null>,
    bucketName: string,
    objectName: string
  ): string {
    // 构造StringToSign
    const stringToSign = this.stringToSign(httpMethod, headers, queries, bucketName, objectName);

    // 计算签名
    return `OBS ${this.accessKey}:${this.hmacSha1(stringToSign)}`;
  }

  /**
   * 构造签名字符串
   */
  private stringToSign(
    httpMethod: string,
    headers: Record<string, string[]>,
    queries: Record<string, string | null>,
    bucketName: string,
    objectName: string
  ): string {
    let contentMd5 = "";
    let contentType = "";
    let date = "";

    const canonicalizedHeaders: Record<string, string> = {};

    for (const [key, values] of Object.entries(headers)) {
      if (!key || !values || values.length === 0) {
        continue;
      }

      const lowerKey = key.trim().toLowerCase();
      
      if (lowerKey === "content-md5") {
        contentMd5 = values[0];
        continue;
      }

      if (lowerKey === "content-type") {
        contentType = values[0];
        continue;
      }

      if (lowerKey === "date") {
        date = values[0];
        continue;
      }

      if (lowerKey.startsWith(ObsSignatureGenerator.OBS_PREFIX)) {
        const temp: string[] = [];
        for (const value of values) {
          if (value != null) {
            temp.push(value.trim());
          }
        }
        canonicalizedHeaders[lowerKey] = temp.join(",");
      }
    }

    // 如果header头域中包含x-obs-date，Date参数置空
    if ("x-obs-date" in canonicalizedHeaders) {
      date = "";
    }

    // 构造StringToSign，拼接HTTP-Verb、Content-MD5、Content-Type、Date
    let stringToSign = `${httpMethod}${ObsSignatureGenerator.SIGN_SEP}${contentMd5}${ObsSignatureGenerator.SIGN_SEP}${contentType}${ObsSignatureGenerator.SIGN_SEP}${date}${ObsSignatureGenerator.SIGN_SEP}`;

    // 构造StringToSign，拼接CanonicalizedHeaders
    const sortedHeaders = Object.keys(canonicalizedHeaders).sort();
    for (const key of sortedHeaders) {
      stringToSign += `${key}:${canonicalizedHeaders[key]}${ObsSignatureGenerator.SIGN_SEP}`;
    }

    // 构造StringToSign，拼接CanonicalizedResource
    stringToSign += "/";
    if (this.isValid(bucketName)) {
      stringToSign += `${bucketName}/`;
      if (this.isValid(objectName)) {
        stringToSign += this.urlEncode(objectName);
      }
    }

    const canonicalizedResource: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(queries)) {
      if (key == null) {
        continue;
      }

      if (ObsSignatureGenerator.SUB_RESOURCES.includes(key)) {
        canonicalizedResource[key] = value;
      }
    }

    if (Object.keys(canonicalizedResource).length > 0) {
      stringToSign += "?";
      const sortedResources = Object.keys(canonicalizedResource).sort();
      
      const resourceParts: string[] = [];
      for (const key of sortedResources) {
        const value = canonicalizedResource[key];
        if (this.isValid(value)) {
          resourceParts.push(`${key}=${value}`);
        } else {
          resourceParts.push(key);
        }
      }
      stringToSign += resourceParts.join("&");
    }

    return stringToSign;
  }

  /**
   * 使用HMAC-SHA1算法计算签名
   */
  private hmacSha1(input: string): string {
    const hmac = crypto.createHmac('sha1', this.secretKey);
    hmac.update(input);
    return hmac.digest('base64');
  }

  /**
   * URL编码，保留特定字符
   */
  private urlEncode(input: string): string {
    return encodeURIComponent(input)
      .replace(/%7E/g, "~")
      .replace(/%2F/g, "/")
      .replace(/%20/g, "+");
  }

  /**
   * 检查字符串是否有效
   */
  private isValid(input: string | null | undefined): boolean {
    return input != null && input !== "";
  }
}