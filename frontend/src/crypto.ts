// Criptografia ponta a ponta dos resumos: AES-GCM 256 via Web Crypto.
// - chave de dados (DEK): gerada no navegador e guardada no localStorage;
// - chave de recuperação: aleatória, mostrada UMA vez à psicóloga; ela cifra um backup da DEK
//   que fica no servidor. O servidor nunca recebe a DEK nem a chave de recuperação em claro.

const LS_KEY = 'psi-data-key'

const subtle = () => {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Criptografia indisponível: abra o site por localhost ou HTTPS.')
  }
  return globalThis.crypto.subtle
}

export const toB64 = (b: Uint8Array): string => btoa(String.fromCharCode(...b))
export const fromB64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

const aes = (raw: Uint8Array<ArrayBuffer>, usage: KeyUsage[]) => subtle().importKey('raw', raw, 'AES-GCM', false, usage)

export function hasLocalKey(): boolean {
  try { return !!localStorage.getItem(LS_KEY) } catch { return false }
}

function localKeyRaw(): Uint8Array<ArrayBuffer> | null {
  try {
    const v = localStorage.getItem(LS_KEY)
    return v ? fromB64(v) : null
  } catch { return null }
}

export function saveLocalKey(raw: Uint8Array) {
  localStorage.setItem(LS_KEY, toB64(raw))
}

export function newDataKey(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(32))
}

/** 64 caracteres hex em grupos de 8: XXXXXXXX-XXXXXXXX-... */
export function newRecoveryKey(): string {
  const hex = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, '0')).join('')
  return hex.toUpperCase().match(/.{8}/g)!.join('-')
}

function recoveryRaw(recovery: string): Uint8Array<ArrayBuffer> {
  const hex = recovery.replace(/[^0-9a-fA-F]/g, '')
  if (hex.length !== 64) throw new Error('Chave de recuperação inválida (são 64 caracteres).')
  return Uint8Array.from(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)))
}

async function seal(key: CryptoKey, data: Uint8Array<ArrayBuffer>) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, key, data))
  return { data: toB64(ct), iv: toB64(iv) }
}

async function open(key: CryptoKey, data: string, iv: string) {
  return new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, key, fromB64(data)))
}

/** Cifra a chave de dados com a chave de recuperação, para guardar o backup no servidor. */
export async function wrapDataKey(dek: Uint8Array<ArrayBuffer>, recovery: string) {
  const { data, iv } = await seal(await aes(recoveryRaw(recovery), ['encrypt']), dek)
  return { wrapped_key: data, iv }
}

export async function unwrapDataKey(wrapped: string, iv: string, recovery: string): Promise<Uint8Array<ArrayBuffer>> {
  try {
    return new Uint8Array(await open(await aes(recoveryRaw(recovery), ['decrypt']), wrapped, iv))
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Chave de recuperação')) throw e
    throw new Error('Chave de recuperação incorreta.')
  }
}

export async function encryptText(text: string) {
  const raw = localKeyRaw()
  if (!raw) throw new Error('Chave de criptografia não encontrada neste navegador.')
  const { data, iv } = await seal(await aes(raw, ['encrypt']), new TextEncoder().encode(text))
  return { ciphertext: data, iv }
}

export async function decryptText(ciphertext: string, iv: string): Promise<string> {
  const raw = localKeyRaw()
  if (!raw) throw new Error('sem chave')
  return new TextDecoder().decode(await open(await aes(raw, ['decrypt']), ciphertext, iv))
}
