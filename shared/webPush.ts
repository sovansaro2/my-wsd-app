/**
 * Standards-compliant Web Push sender (RFC 8292 VAPID + RFC 8291 aes128gcm)
 * Uses pure Web Crypto API (crypto.subtle) so it runs natively on both
 * Cloudflare Workers and Node.js 20+ with zero native dependencies.
 */

export interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

export interface PushSendResult {
  ok: boolean;
  status: number;
  gone: boolean;
  error?: string;
}

const textEncoder = new TextEncoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(input: string): Uint8Array {
  const clean = input.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  );
  return new Uint8Array(sig);
}

/**
 * Builds RFC 8292 VAPID Authorization header (`vapid t=<jwt>, k=<pub>`)
 */
export async function buildVapidAuthHeader(
  endpoint: string,
  vapid: VapidConfig
): Promise<string> {
  const origin = new URL(endpoint).origin;
  const pubRaw = base64UrlDecode(vapid.publicKey);
  if (pubRaw.length !== 65 || pubRaw[0] !== 0x04) {
    throw new Error('Invalid VAPID public key format (expected 65-byte uncompressed P-256 point)');
  }

  const x = base64UrlEncode(pubRaw.slice(1, 33));
  const y = base64UrlEncode(pubRaw.slice(33, 65));
  const d = vapid.privateKey.trim();

  const signingKey = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x, y, d },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const headerB64 = base64UrlEncode(textEncoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const payloadB64 = base64UrlEncode(
    textEncoder.encode(
      JSON.stringify({
        aud: origin,
        exp,
        sub: vapid.subject || 'mailto:admin@watsnaydouch.site',
      })
    )
  );

  const unsignedToken = `${headerB64}.${payloadB64}`;
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingKey,
    textEncoder.encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${base64UrlEncode(new Uint8Array(signatureBuffer))}`;
  return `vapid t=${jwt}, k=${vapid.publicKey.trim()}`;
}

/**
 * Encrypts a UTF-8 push payload using RFC 8291 (`aes128gcm`)
 */
export async function encryptWebPushPayload(
  payloadJson: string,
  uaPublicBase64Url: string,
  authSecretBase64Url: string
): Promise<Uint8Array> {
  const uaPublic = base64UrlDecode(uaPublicBase64Url);
  const authSecret = base64UrlDecode(authSecretBase64Url);

  if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) {
    throw new Error('Invalid subscriber p256dh key');
  }
  if (authSecret.length !== 16) {
    throw new Error('Invalid subscriber auth secret');
  }

  // Generate ephemeral AS (application server) ECDH P-256 keypair
  const asKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeyPair.publicKey));

  // Import subscriber's public key
  const uaPubKey = await crypto.subtle.importKey(
    'raw',
    uaPublic.buffer.slice(uaPublic.byteOffset, uaPublic.byteOffset + uaPublic.byteLength) as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );

  // ECDH shared secret (32 bytes)
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: uaPubKey },
      asKeyPair.privateKey,
      256
    )
  );

  // RFC 8291 Section 3.3: Derive IKM using auth secret
  const prkKey = await hmacSha256(authSecret, ecdhSecret);
  const keyInfo = concatBytes(
    textEncoder.encode('WebPush: info\0'),
    uaPublic,
    asPublic,
    new Uint8Array([0x01])
  );
  const ikm = await hmacSha256(prkKey, keyInfo);

  // RFC 8188: Derive CEK (16 bytes) and Nonce (12 bytes) with random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmacSha256(salt, ikm);

  const cekFull = await hmacSha256(
    prk,
    concatBytes(textEncoder.encode('Content-Encoding: aes128gcm\0'), new Uint8Array([0x01]))
  );
  const cek = cekFull.slice(0, 16);

  const nonceFull = await hmacSha256(
    prk,
    concatBytes(textEncoder.encode('Content-Encoding: nonce\0'), new Uint8Array([0x01]))
  );
  const nonce = nonceFull.slice(0, 12);

  // Plaintext record with 0x02 final-record delimiter
  const plaintext = concatBytes(textEncoder.encode(payloadJson), new Uint8Array([0x02]));

  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      aesKey,
      plaintext.buffer.slice(plaintext.byteOffset, plaintext.byteOffset + plaintext.byteLength) as ArrayBuffer
    )
  );

  // Header: salt (16) || rs (4, uint32BE = 4096) || idlen (1 = 65) || asPublic (65)
  const header = new Uint8Array(16 + 4 + 1 + asPublic.length);
  header.set(salt, 0);
  const view = new DataView(header.buffer);
  view.setUint32(16, 4096, false);
  header[20] = asPublic.length;
  header.set(asPublic, 21);

  return concatBytes(header, ciphertext);
}

/**
 * Sends a single encrypted Web Push notification to an endpoint
 */
export async function sendWebPush(
  subscription: StoredPushSubscription,
  payload: PushNotificationPayload,
  vapid: VapidConfig
): Promise<PushSendResult> {
  try {
    const authHeader = await buildVapidAuthHeader(subscription.endpoint, vapid);
    const bodyBytes = await encryptWebPushPayload(
      JSON.stringify(payload),
      subscription.p256dh,
      subscription.auth
    );

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        TTL: '86400',
        Urgency: 'high',
      },
      body: bodyBytes.buffer.slice(
        bodyBytes.byteOffset,
        bodyBytes.byteOffset + bodyBytes.byteLength
      ) as ArrayBuffer,
    });

    if (response.status >= 200 && response.status < 300) {
      return { ok: true, status: response.status, gone: false };
    }

    const errText = await response.text().catch(() => '');
    return {
      ok: false,
      status: response.status,
      gone: response.status === 404 || response.status === 410,
      error: errText || `HTTP ${response.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      gone: false,
      error: err?.message || 'Push network error',
    };
  }
}
