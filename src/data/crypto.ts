export type AlgoType = 'symmetric' | 'asymmetric' | 'hashing' | 'deprecated'

export interface AlgoEntry {
  name: string
  type: AlgoType
  keySize?: string
  note: string
  deprecated?: boolean
  deprecatedReason?: string
}

export const ALGORITHMS: AlgoEntry[] = [
  // Symmetric
  { name: 'AES-128', type: 'symmetric', keySize: '128-bit', note: 'Advanced Encryption Standard — NIST approved, fast, widely used for data at rest and in transit.' },
  { name: 'AES-256', type: 'symmetric', keySize: '256-bit', note: 'AES with 256-bit key — current gold standard for symmetric encryption, used in TLS, VPNs, disk encryption.' },
  { name: '3DES',    type: 'symmetric', keySize: '112/168-bit', note: 'Triple DES — applies DES cipher three times. Legacy only; deprecated by NIST (2023). Should not be used in new systems.' },
  { name: 'ChaCha20',type: 'symmetric', keySize: '256-bit', note: 'Stream cipher alternative to AES, popular in TLS 1.3 and mobile due to software performance advantages.' },
  // Asymmetric
  { name: 'RSA-2048', type: 'asymmetric', keySize: '2048-bit', note: 'Rivest–Shamir–Adleman — widely used for key exchange, digital signatures, certificates.' },
  { name: 'RSA-4096', type: 'asymmetric', keySize: '4096-bit', note: 'RSA with larger key — used where long-term security is required; slower than 2048.' },
  { name: 'ECC',       type: 'asymmetric', keySize: '256-bit equivalent to RSA-3072', note: 'Elliptic Curve Cryptography — same security as RSA with smaller keys; used in TLS, mobile, IoT.' },
  { name: 'Diffie-Hellman', type: 'asymmetric', note: 'Key exchange protocol — allows two parties to establish a shared secret over an insecure channel.' },
  { name: 'ECDH',     type: 'asymmetric', note: 'Elliptic Curve Diffie-Hellman — modern, efficient key exchange. Used in TLS 1.3.' },
  // Hashing
  { name: 'SHA-256',  type: 'hashing', note: 'Secure Hash Algorithm 256-bit — current standard, used in TLS, code signing, certificates, blockchain.' },
  { name: 'SHA-384',  type: 'hashing', note: 'SHA-2 variant, 384-bit output — used in TLS where stronger hashing is required.' },
  { name: 'SHA-512',  type: 'hashing', note: 'SHA-2 variant, 512-bit output — strongest SHA-2 family member.' },
  { name: 'SHA-3',    type: 'hashing', note: 'NIST-standardized (2015), different design from SHA-2 (Keccak sponge). Not yet widely deployed but fully secure.' },
  { name: 'HMAC',     type: 'hashing', note: 'Hash-based Message Authentication Code — combines a key with a hash to provide integrity + authenticity.' },
  { name: 'bcrypt',   type: 'hashing', note: 'Password hashing function with work factor — slow by design to resist brute force. Preferred for password storage.' },
  // AES Modes of Operation
  { name: 'AES-ECB', type: 'deprecated', note: 'NEVER USE — Electronic Codebook mode. Identical plaintext blocks → identical ciphertext blocks. Patterns leak (the "ECB penguin" problem).', deprecated: true, deprecatedReason: 'ECB encrypts each 16-byte block independently with no chaining. Identical plaintext blocks produce identical ciphertext — patterns in data are preserved in the ciphertext. Reveals structure.' },
  { name: 'AES-CBC', type: 'symmetric', keySize: '128/256-bit', note: 'Cipher Block Chaining — each block XORed with previous ciphertext before encryption. Requires a random IV. Good but no built-in integrity.' },
  { name: 'AES-CTR', type: 'symmetric', keySize: '128/256-bit', note: 'Counter Mode — turns AES into a stream cipher using an incrementing counter + nonce. Parallelizable. Nonce must NEVER be reused.' },
  { name: 'AES-GCM', type: 'symmetric', keySize: '128/256-bit', note: 'Galois/Counter Mode — AEAD (Authenticated Encryption with Associated Data). Provides both encryption AND integrity/authentication in one operation. Current best practice for TLS, disk encryption, VPNs.' },
  // Key stretching
  { name: 'PBKDF2',  type: 'hashing', note: 'Password-Based Key Derivation Function 2 — applies HMAC thousands of times to stretch a passphrase into a cryptographic key. Used for disk encryption passphrases and password hashing.' },
  { name: 'Argon2',  type: 'hashing', note: 'Memory-hard password hashing — winner of the Password Hashing Competition (2015). Resistant to GPU/ASIC attacks due to high memory requirements. Preferred over bcrypt for new systems.' },
  // Deprecated
  { name: 'MD5',     type: 'deprecated', note: 'DEPRECATED — collision vulnerabilities.',     deprecated: true, deprecatedReason: 'Collision vulnerabilities discovered (2004+). An attacker can craft two different inputs with the same MD5 hash. Never use for security.' },
  { name: 'SHA-1',   type: 'deprecated', note: 'DEPRECATED — SHAttered collision (2017).',    deprecated: true, deprecatedReason: 'Practical collision attack demonstrated (2017, SHAttered). Deprecated by NIST. Browsers and CAs have removed support.' },
  { name: 'DES',     type: 'deprecated', note: 'DEPRECATED — 56-bit key, brute-forceable.',   deprecated: true, deprecatedReason: '56-bit key is exhaustible in hours with modern hardware. Deprecated since the late 1990s.' },
  { name: 'RC4',     type: 'deprecated', note: 'DEPRECATED — keystream biases, banned TLS.',  deprecated: true, deprecatedReason: 'Stream cipher with severe biases in output keystream. Prohibited in TLS (RFC 7465).' },
  { name: 'RSA-512', type: 'deprecated', note: 'DEPRECATED — 512-bit RSA factorable in hours.',deprecated: true, deprecatedReason: '512-bit RSA can be factored in hours. Minimum recommended is RSA-2048.' },
]

export interface CryptoUseCase {
  id: string
  scenario: string
  correctAlgo: string
  wrongAlgos: string[]
  explanation: string
}

export const CRYPTO_USE_CASES: CryptoUseCase[] = [
  {
    id: 'cu-01',
    scenario: 'Encrypting a 500GB database backup that will be stored on an external drive.',
    correctAlgo: 'AES-256',
    wrongAlgos: ['RSA-2048', 'SHA-256', 'MD5'],
    explanation: 'AES-256 is symmetric, fast, and designed for bulk data encryption. RSA is asymmetric and extremely slow for large data. SHA-256 and MD5 are hash functions — they cannot be decrypted.',
  },
  {
    id: 'cu-02',
    scenario: 'Two parties need to establish a shared secret key over an untrusted network channel.',
    correctAlgo: 'Diffie-Hellman',
    wrongAlgos: ['AES-256', 'SHA-256', 'bcrypt'],
    explanation: 'Diffie-Hellman (and its elliptic curve variant ECDH) is specifically designed for key exchange over insecure channels. AES requires the key to already be shared. SHA-256 and bcrypt are hash functions.',
  },
  {
    id: 'cu-03',
    scenario: 'Storing user passwords in a database so even if the DB is stolen, passwords are hard to recover.',
    correctAlgo: 'bcrypt',
    wrongAlgos: ['AES-256', 'MD5', 'SHA-256'],
    explanation: 'bcrypt is a slow, work-factor-based hash designed specifically for password storage — it resists brute force by being computationally expensive. MD5 and SHA-256 are too fast for password hashing. AES is reversible encryption, not hashing.',
  },
  {
    id: 'cu-04',
    scenario: 'Verifying that a downloaded software package has not been tampered with since the vendor published it.',
    correctAlgo: 'SHA-256',
    wrongAlgos: ['AES-256', 'RSA-2048', 'MD5'],
    explanation: 'SHA-256 produces a hash/digest that changes if even one byte of the file is modified. MD5 has collision vulnerabilities — an attacker could craft a malicious file with the same MD5. AES encrypts but doesn\'t verify integrity alone. RSA is asymmetric encryption/signing.',
  },
  {
    id: 'cu-05',
    scenario: 'A legacy system uses this algorithm to hash passwords. A security audit flags it as critically insecure because collisions are trivially achievable.',
    correctAlgo: 'MD5',
    wrongAlgos: ['SHA-256', 'bcrypt', 'AES-256'],
    explanation: 'MD5 was demonstrated to have practical collision attacks in 2004 and worse since. It is the poster child for deprecated hash functions. SHA-256 and bcrypt are currently safe. AES is encryption, not hashing.',
  },
  {
    id: 'cu-06',
    scenario: 'A developer wants to ensure that an API message has not been tampered with in transit AND that it came from the correct sender (integrity + authenticity), using a shared secret key.',
    correctAlgo: 'HMAC',
    wrongAlgos: ['SHA-256', 'AES-256', 'RSA-2048'],
    explanation: 'HMAC (Hash-based Message Authentication Code) combines a cryptographic hash with a secret key — it provides both integrity (message not altered) and authenticity (sender knows the key). Plain SHA-256 provides integrity but no authentication (anyone can compute it). AES provides confidentiality but not integrity by itself. RSA could sign the message but requires asymmetric key infrastructure.',
  },
  {
    id: 'cu-07',
    scenario: 'A security architect wants to ensure that even if a server\'s long-term private key is compromised in the future, past TLS sessions cannot be decrypted.',
    correctAlgo: 'ECDH',
    wrongAlgos: ['RSA-2048', 'AES-256', 'SHA-256'],
    explanation: 'ECDH (Elliptic Curve Diffie-Hellman) — specifically ephemeral variants like ECDHE — provides forward secrecy. Each session generates a unique temporary key pair; past sessions cannot be decrypted even if the long-term private key is later compromised. RSA key exchange does NOT provide forward secrecy — the session key is wrapped with the server\'s long-term private key, so compromising that key decrypts all past sessions. TLS 1.3 mandates ECDHE for this reason.',
  },
  {
    id: 'cu-08',
    scenario: 'A legal team needs to send a digitally signed document proving the sender\'s identity and ensuring the recipient can verify the document has not been altered. Non-repudiation is required.',
    correctAlgo: 'RSA-2048',
    wrongAlgos: ['AES-256', 'SHA-256', 'bcrypt'],
    explanation: 'Digital signatures use asymmetric cryptography. The sender signs with their private key; anyone can verify with the public key. RSA-2048 (or ECDSA) is used for digital signatures. AES is symmetric and cannot provide non-repudiation (both parties share the key). SHA-256 alone is a hash — it proves integrity but cannot prove who created the hash. bcrypt is for password storage only.',
  },
  {
    id: 'cu-09',
    scenario: 'An IoT device with very limited CPU and memory needs to establish an encrypted connection. Standard RSA-2048 is too computationally expensive for the hardware.',
    correctAlgo: 'ECC',
    wrongAlgos: ['RSA-4096', 'AES-256', '3DES'],
    explanation: 'Elliptic Curve Cryptography (ECC) achieves equivalent security to RSA with much smaller key sizes — a 256-bit ECC key is approximately as strong as RSA-3072. This means drastically less computation, memory, and power consumption. Ideal for IoT, embedded systems, and mobile devices. RSA-4096 would be even more expensive than RSA-2048. 3DES is deprecated. AES-256 could encrypt data but cannot do key exchange without a pre-shared key.',
  },
  {
    id: 'cu-10',
    scenario: 'A compliance team finds that servers are still negotiating TLS connections using this cipher for key exchange. It does NOT provide forward secrecy and is prohibited in TLS 1.3.',
    correctAlgo: 'RSA-2048',
    wrongAlgos: ['ECDH', 'AES-256', 'SHA-256'],
    explanation: 'Static RSA key exchange (in TLS 1.2 and earlier) uses the server\'s long-term RSA private key to protect the pre-master secret. If the private key is ever compromised, an attacker who recorded past traffic can decrypt all of it — no forward secrecy. TLS 1.3 completely removes static RSA key exchange and mandates ephemeral Diffie-Hellman (ECDHE or DHE). If you see RSA used for key exchange (not just signatures) in a TLS config, it\'s a compliance finding.',
  },
  // ─── AES Modes ───────────────────────────────────────────────────────────────
  {
    id: 'cu-11',
    scenario: 'A security architect reviews an encryption implementation and discovers it divides a file into 16-byte blocks and encrypts each block independently. Encrypted images still show visible shapes and patterns. Which mode is this and why is it a critical flaw?',
    correctAlgo: 'AES-ECB',
    wrongAlgos: ['AES-GCM', 'AES-CBC', 'AES-CTR'],
    explanation: 'ECB (Electronic Codebook) mode encrypts every block independently with the same key. Identical 16-byte plaintext blocks produce identical 16-byte ciphertext blocks — patterns in the plaintext are perfectly preserved in the ciphertext. The "ECB penguin" problem illustrates this: encrypt a bitmap with ECB and the penguin shape is still visible. ECB is never appropriate for encrypting more than one block of non-random data. Replace with AES-GCM.',
  },
  {
    id: 'cu-12',
    scenario: 'A developer needs to encrypt data where the same key will be used repeatedly. They want no pattern leakage between identical plaintext blocks, and each message should use a new random value to ensure ciphertext uniqueness. Integrity checking is handled separately. Which mode fits?',
    correctAlgo: 'AES-CBC',
    wrongAlgos: ['AES-ECB', 'AES-GCM', 'RSA-2048'],
    explanation: 'AES-CBC (Cipher Block Chaining) XORs each plaintext block with the previous ciphertext block before encryption. A random IV (Initialization Vector) for the first block ensures that encrypting the same plaintext with the same key produces different ciphertext each time. CBC eliminates the pattern-leakage problem of ECB. The trade-off: CBC provides no authentication — integrity must be handled separately (e.g., with HMAC). AES-GCM would be preferable in most modern systems as it provides both.',
  },
  {
    id: 'cu-13',
    scenario: 'An application needs to encrypt a stream of data where random access to different positions is required (e.g., seeking in an encrypted video file). The operation must be parallelizable across CPU cores. Which AES mode is appropriate?',
    correctAlgo: 'AES-CTR',
    wrongAlgos: ['AES-CBC', 'AES-ECB', 'bcrypt'],
    explanation: 'AES-CTR (Counter Mode) turns AES into a stream cipher by encrypting a counter concatenated with a nonce and XORing the keystream with plaintext. Because each block is independent (uses its counter value), CTR is fully parallelizable — multiple blocks can be encrypted simultaneously. It also allows random access: to decrypt byte N, compute keystream for that position only. CBC is sequential (each block depends on the previous) and does not support random access. Warning: the nonce must never be reused — reusing a nonce with the same key completely breaks CTR.',
  },
  {
    id: 'cu-14',
    scenario: 'A cloud storage service wants to encrypt files such that any tampering with the ciphertext is detectable by the recipient — without requiring a separate MAC or HMAC calculation. Which AES mode provides both confidentiality and built-in authentication?',
    correctAlgo: 'AES-GCM',
    wrongAlgos: ['AES-CBC', 'AES-CTR', 'AES-ECB'],
    explanation: 'AES-GCM (Galois/Counter Mode) is an AEAD (Authenticated Encryption with Associated Data) mode — it provides confidentiality (encryption), integrity (detects any modification to ciphertext), and authenticity in a single operation. The Galois field authentication tag (typically 128-bit) is appended to the ciphertext. Any bit flip in the ciphertext will cause authentication to fail before decryption proceeds. This is why AES-GCM is the preferred mode in TLS 1.3, WPA3, and modern disk encryption. AES-CBC and AES-CTR provide confidentiality only — integrity requires a separate HMAC.',
  },
  {
    id: 'cu-15',
    scenario: 'A system encrypts user passwords and stores a salt + hash in the database. The security team discovers the hash function used completes in under 1 millisecond per attempt, making GPU-accelerated brute force trivially fast. Which algorithm should replace it?',
    correctAlgo: 'Argon2',
    wrongAlgos: ['SHA-256', 'AES-GCM', 'PBKDF2'],
    explanation: 'Argon2 won the Password Hashing Competition (2015) and is designed to be memory-hard — it requires large amounts of RAM per computation, which makes GPU and ASIC attacks prohibitively expensive (GPUs excel at parallel computation but have limited per-core memory). Password hashing must be slow by design. Argon2 is the current recommendation for new systems; bcrypt and PBKDF2 are acceptable but older. SHA-256 is a general-purpose hash — too fast for passwords. AES-GCM is encryption, not hashing.',
  },
  {
    id: 'cu-16',
    scenario: 'A user provides a passphrase (e.g., "CorrectHorseBatteryStaple") to unlock full-disk encryption. The software must convert this passphrase into a 256-bit cryptographic key. Which algorithm performs this conversion?',
    correctAlgo: 'PBKDF2',
    wrongAlgos: ['SHA-256', 'AES-256', 'HMAC'],
    explanation: 'PBKDF2 (Password-Based Key Derivation Function 2) derives a cryptographic key from a passphrase by applying a pseudorandom function (typically HMAC-SHA256) many thousands of times — its iteration count is configurable and increases the computational cost of brute-force attacks. It is specifically designed for this key-derivation use case and is used by WPA2 (for PMK derivation from PSK) and many disk encryption systems (macOS FileVault, VeraCrypt). SHA-256 alone is one pass — too fast. AES-256 is an encryption algorithm, not a KDF.',
  },
]
