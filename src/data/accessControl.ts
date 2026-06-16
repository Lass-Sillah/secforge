export type ACModel = 'MAC' | 'DAC' | 'RBAC' | 'ABAC'

export interface ACModelInfo {
  name: string
  full: string
  description: string
  keyTrait: string
  example: string
}

export const AC_MODELS: Record<ACModel, ACModelInfo> = {
  MAC: {
    name: 'MAC',
    full: 'Mandatory Access Control',
    description: 'Access is determined by the system based on security labels/classifications. Neither owner nor user can override it.',
    keyTrait: 'Labels + clearances set by the system. Owner cannot grant access.',
    example: 'Military systems — SECRET data requires SECRET clearance regardless of who owns the file.',
  },
  DAC: {
    name: 'DAC',
    full: 'Discretionary Access Control',
    description: 'Resource owner decides who can access their resources. Owner has full discretion.',
    keyTrait: 'Owner controls permissions. Most flexible, least secure.',
    example: 'Linux file permissions — the file creator can chmod and chown freely.',
  },
  RBAC: {
    name: 'RBAC',
    full: 'Role-Based Access Control',
    description: 'Access is granted based on the user\'s role in the organization. Roles aggregate permissions.',
    keyTrait: 'Job function defines access. Scalable for large organizations.',
    example: 'HR role can access payroll; Developer role can deploy code; neither can access the other\'s systems.',
  },
  ABAC: {
    name: 'ABAC',
    full: 'Attribute-Based Access Control',
    description: 'Access decisions evaluate multiple attributes of the user, resource, and environment simultaneously.',
    keyTrait: 'Most granular and flexible. Can combine role, time, location, clearance, resource sensitivity.',
    example: 'Allow access if: role=doctor AND patient=assigned AND time=business-hours AND location=hospital-network.',
  },
}

export interface ACScenario {
  id: string
  situation: string
  correctModel: ACModel
  explanation: string
  distractors: ACModel[]
}

export interface ACPrincipleScenario {
  id: string
  situation: string
  correctPrinciple: string
  explanation: string
  distractors: string[]
}

// Least privilege / need-to-know / separation of duties questions
// These use MCQuestion format with principle names as options
export const AC_ZERO_TRUST_SCENARIOS: ACPrincipleScenario[] = [
  {
    id: 'zt-01',
    situation: 'A company eliminates implicit trust for all users regardless of whether they are inside or outside the corporate network. Every access request — even from an employee on the internal VPN — requires authentication, authorization, and continuous validation. The guiding assumption is that a breach has already occurred.',
    correctPrinciple: 'Zero Trust',
    explanation: 'Zero Trust is an architecture based on three principles: (1) Explicit verification — always authenticate and authorize based on all available data points; (2) Least privilege access — limit user access with just-in-time and just-enough-access policies; (3) Assume breach — minimize blast radius and segment access, verify end-to-end encryption. The key departure from traditional security: the internal network is NOT a trusted zone — traffic from inside is treated with the same scrutiny as traffic from the internet.',
    distractors: ['Least Privilege', 'Defense in Depth', 'Separation of Duties'],
  },
  {
    id: 'zt-02',
    situation: 'A security administrator needs to perform an emergency change on a production database server. Instead of having a standing admin account with permanent database access, the PAM system grants a temporary credential valid for 4 hours that expires automatically. The session is recorded and all commands are logged.',
    correctPrinciple: 'Just-in-Time (JIT) / Privileged Access Management (PAM)',
    explanation: 'Just-in-Time (JIT) access is a PAM (Privileged Access Management) control where privileged credentials are granted on-demand for the minimum time needed, then auto-expire. This eliminates standing admin accounts — a common lateral movement target. PAM also provides credential vaulting (passwords checked out from a vault) and session recording (all privileged activity logged and replayable for audit). JIT is a Zero Trust implementation for privileged access: explicit, time-limited, monitored.',
    distractors: ['Least Privilege', 'Separation of Duties', 'Need-to-Know'],
  },
  {
    id: 'zt-03',
    situation: 'A company enforces that all traffic between microservices in their cloud environment must be authenticated and encrypted using mTLS, even traffic between services on the same private subnet. No service is implicitly trusted based on its network location.',
    correctPrinciple: 'Zero Trust (microsegmentation / mutual TLS)',
    explanation: 'This is Zero Trust applied to service-to-service communication. Traditional perimeter security assumes traffic inside the network is safe — Zero Trust eliminates this assumption. Mutual TLS (mTLS) requires BOTH services to present certificates, ensuring only authorized services can communicate. Microsegmentation creates granular network policies between individual workloads rather than trusting entire subnets. This prevents lateral movement: a compromised service cannot communicate with others without a valid certificate.',
    distractors: ['Defense in Depth', 'Network Segmentation (traditional)', 'MAC'],
  },
]

export const AC_FEDERATION_SCENARIOS: ACPrincipleScenario[] = [
  {
    id: 'fed-01',
    situation: 'Employees of a company log into a third-party HR SaaS platform using their existing corporate Active Directory credentials. The corporate identity provider authenticates the user and sends a digitally signed assertion to the HR platform, which grants access without storing a separate password. Which protocol enables this federated SSO?',
    correctPrinciple: 'SAML (Security Assertion Markup Language)',
    explanation: 'SAML 2.0 is the dominant enterprise SSO federation protocol. The Identity Provider (IdP — your company\'s AD/ADFS) authenticates the user and issues a signed XML assertion. The Service Provider (SP — the HR SaaS) trusts the assertion and grants access. Three roles: IdP (authenticates), SP (provides service), and user. SAML is authentication-focused and designed for web browser SSO in enterprise environments. Key exam trap: SAML is for authentication/SSO — not authorization delegation. OAuth 2.0 handles authorization (delegating access to resources). OIDC adds an authentication layer on top of OAuth.',
    distractors: ['OAuth 2.0', 'RADIUS', 'Kerberos'],
  },
  {
    id: 'fed-02',
    situation: 'A mobile app asks users to "Continue with Google." When the user clicks, they are redirected to Google, authenticate there, and Google sends the app a token that allows the app to access the user\'s Google Drive files on their behalf — without the app ever seeing the user\'s Google password. Which protocol is this?',
    correctPrinciple: 'OAuth 2.0',
    explanation: 'OAuth 2.0 is an authorization framework — it delegates access to resources without sharing credentials. The user authorizes an application to act on their behalf. Key actors: Resource Owner (user), Client (mobile app), Authorization Server (Google), Resource Server (Google Drive API). OAuth issues an access token the app uses to call the API. Critical exam distinction: OAuth 2.0 is for authorization (what can this app do?), NOT authentication (who is this user?). To add authentication to OAuth, you layer OIDC on top. Using OAuth alone does NOT prove who the user is — it only proves they authorized the app.',
    distractors: ['SAML (Security Assertion Markup Language)', 'LDAP', 'OIDC (OpenID Connect)'],
  },
  {
    id: 'fed-03',
    situation: 'An application needs to verify the identity of users logging in with their Google accounts. After the user authenticates with Google, the app receives an ID token — a signed JSON object (JWT) containing the user\'s name, email, and a unique identifier. The app uses this to create a user session. Which protocol extends OAuth 2.0 to provide identity information?',
    correctPrinciple: 'OIDC (OpenID Connect)',
    explanation: 'OpenID Connect (OIDC) is an identity layer built on top of OAuth 2.0. While OAuth 2.0 provides an access token for authorization, OIDC adds an ID token (a JWT — JSON Web Token) that contains identity claims (sub, name, email, iss, exp). The ID token proves who the user is; the access token proves what the app can do. OIDC is the modern standard for authentication in consumer and enterprise apps. Exam mnemonic: OAuth = authorization (access resources), OIDC = authentication (identity of the user). Almost all modern "Sign in with Google/Apple/Microsoft" buttons use OIDC.',
    distractors: ['SAML (Security Assertion Markup Language)', 'OAuth 2.0', 'RADIUS'],
  },
  {
    id: 'fed-04',
    situation: 'When a network engineer connects to a Cisco switch via SSH and enters their credentials, the switch forwards the credentials to a central server that validates them against a shared user database. The same server controls VPN access, Wi-Fi authentication (802.1X), and dial-up access. What protocol is the central authentication server using?',
    correctPrinciple: 'RADIUS (Remote Authentication Dial-In User Service)',
    explanation: 'RADIUS (RFC 2865) is an AAA (Authentication, Authorization, Accounting) protocol widely used for network access control. It centralizes authentication for: VPNs, 802.1X wired/wireless, dial-up, and network device management. RADIUS uses UDP (ports 1812/1813 or legacy 1645/1646). Encryption: only the password field is encrypted in the request packet (the rest is cleartext). TACACS+ (Cisco proprietary) is an alternative that encrypts the entire packet and is preferred for device administration. Key distinction: RADIUS is for network access (users accessing the network); LDAP is for directory lookups (applications querying user attributes). RADIUS attributes can come from Active Directory via LDAP.',
    distractors: ['LDAP', 'SAML (Security Assertion Markup Language)', 'TACACS+'],
  },
  {
    id: 'fed-05',
    situation: 'A web application needs to look up whether a user is a member of the "Finance-Approvers" Active Directory group before granting access to the payment approval module. The app queries the company\'s domain controller using port 389, sending the user\'s username and receiving their group memberships, department, email, and phone number. Which protocol is the application using?',
    correctPrinciple: 'LDAP (Lightweight Directory Access Protocol)',
    explanation: 'LDAP (Lightweight Directory Access Protocol, RFC 4511) is a protocol for reading and writing directory services — such as Active Directory (AD) or OpenLDAP. Applications use LDAP to: authenticate users, look up group memberships, retrieve user attributes (email, department, phone), and query organizational structure. LDAP uses port 389 (cleartext) and 636 (LDAPS — LDAP over TLS, encrypted). LDAPS should always be used in production. LDAP is NOT an authentication protocol itself — it is a directory access protocol used in authentication flows. The distinction: RADIUS handles network access authentication; LDAP queries directory attributes. Many RADIUS servers use LDAP/AD as their backend user database.',
    distractors: ['RADIUS (Remote Authentication Dial-In User Service)', 'OIDC (OpenID Connect)', 'Kerberos'],
  },
]

export const AC_PRINCIPLE_SCENARIOS: ACPrincipleScenario[] = [
  {
    id: 'acp-01',
    situation: 'A junior analyst is granted read access to customer records only, even though their manager can also write and delete. The analyst\'s access was deliberately limited to what their daily job tasks require — nothing more.',
    correctPrinciple: 'Least Privilege',
    explanation: 'Least Privilege (PoLP) means every user, process, and system receives the minimum permissions required to perform their job function — nothing more. It limits blast radius if credentials are compromised. This is a foundational principle in both access control and security architecture.',
    distractors: ['Need-to-Know', 'Separation of Duties', 'Defense in Depth'],
  },
  {
    id: 'acp-02',
    situation: 'A financial firm requires that no single employee can both initiate a wire transfer AND approve it. Both steps are required, and the two roles must be held by different people.',
    correctPrinciple: 'Separation of Duties',
    explanation: 'Separation of Duties (SoD) prevents fraud and error by requiring that critical tasks involve at least two different people. No individual has enough access to commit fraud undetected. Common in financial controls, change management, and audit processes. Distinct from least privilege (which limits a single user\'s access) — SoD specifically divides responsibilities across multiple people.',
    distractors: ['Least Privilege', 'Need-to-Know', 'Role-Based Access Control'],
  },
  {
    id: 'acp-03',
    situation: 'An intelligence analyst is cleared to TOP SECRET level but is blocked from accessing a specific compartmentalized program\'s files, even though the files are classified TOP SECRET. Their clearance level is sufficient, but they are not authorized for that specific program.',
    correctPrinciple: 'Need-to-Know',
    explanation: 'Need-to-Know adds a second gate beyond clearance level: even if you have the clearance, you must have a demonstrated operational need to access specific information. A TOP SECRET clearance allows access to TS information you need for your job — not all TS information. This is how compartmentalization works (SCI programs, SAPs). Least privilege is related but need-to-know is the specific term for classified information access beyond clearance level.',
    distractors: ['Least Privilege', 'Mandatory Access Control', 'Separation of Duties'],
  },
  {
    id: 'acp-04',
    situation: 'An organization reviews all user permissions quarterly. During the review, a developer who moved to management three months ago still has production server admin rights from their old role. These excess permissions are removed.',
    correctPrinciple: 'Least Privilege',
    explanation: 'This is a privilege review (also called a recertification or access review) enforcing least privilege. Accumulation of privileges over time as users change roles is called privilege creep. The quarterly review removes permissions that are no longer needed — enforcing that users retain only what their current role requires. This directly implements the principle of least privilege through an operational process.',
    distractors: ['Separation of Duties', 'Need-to-Know', 'Role-Based Access Control'],
  },
]

export const AC_SCENARIOS: ACScenario[] = [
  {
    id: 'ac-01',
    situation: 'A classified government network uses security labels (UNCLASSIFIED, SECRET, TOP SECRET). Users cannot share files with others even if they want to — the system enforces all access decisions based on clearance levels.',
    correctModel: 'MAC',
    explanation: 'Mandatory Access Control (MAC) is defined by the system enforcing labels/clearances. The key tell: owners CANNOT override — the system decides. Classic in government/military contexts.',
    distractors: ['DAC', 'RBAC', 'ABAC'],
  },
  {
    id: 'ac-02',
    situation: 'A hospital grants doctors access to patient records based on their job title. Nurses have a separate access profile. Admins configure roles once; adding a new doctor simply assigns them the "Doctor" role.',
    correctModel: 'RBAC',
    explanation: 'Role-Based Access Control — access follows job function (role). Scalable: new employees inherit permissions from their role without individual configuration.',
    distractors: ['MAC', 'DAC', 'ABAC'],
  },
  {
    id: 'ac-03',
    situation: 'In a shared Unix filesystem, Alice creates a project folder and uses chmod to grant Bob read access. She can revoke Bob\'s access at any time. The IT admin has no involvement.',
    correctModel: 'DAC',
    explanation: 'Discretionary Access Control — the resource OWNER decides who can access it. Alice has full discretion over her own files. Most flexible, but vulnerable to insider threats.',
    distractors: ['MAC', 'RBAC', 'ABAC'],
  },
  {
    id: 'ac-04',
    situation: 'A policy engine grants access to financial records only when: the user is a Senior Auditor, is accessing from the corporate VPN, is within business hours (Mon-Fri 8am-6pm), and the record\'s sensitivity level is ≤ INTERNAL.',
    correctModel: 'ABAC',
    explanation: 'Attribute-Based Access Control evaluates multiple attributes simultaneously: user attributes (role=Senior Auditor), environment (VPN, time), and resource attributes (sensitivity). No other model combines all three dimensions.',
    distractors: ['MAC', 'DAC', 'RBAC'],
  },
  {
    id: 'ac-05',
    situation: 'A contractor is given access to specific project files by the project lead, who can also revoke that access without involving the IT department. The contractor cannot further share the files.',
    correctModel: 'DAC',
    explanation: 'The project lead (owner) decides who gets access — that\'s discretionary. The contractor cannot re-share (no further discretion), which is a common DAC implementation constraint.',
    distractors: ['MAC', 'RBAC', 'ABAC'],
  },
  {
    id: 'ac-06',
    situation: 'A hospital\'s EHR system assigns security clearance labels to all data and all users. Patient records are labelled TOP SECRET. Doctors hold TOP SECRET clearance. Even when a doctor is the treating physician who created the record, they cannot share or export it to a nurse who holds only a CONFIDENTIAL clearance — the system blocks the operation automatically.',
    correctModel: 'MAC',
    explanation: 'The defining MAC characteristic is here: even the data\'s creator (the doctor) cannot override the access policy. The system enforces labels and clearances regardless of ownership or intent. If the owner could grant access at will, it would be DAC. The mandatory, system-enforced nature — with no user override — is what makes this MAC.',
    distractors: ['DAC', 'RBAC', 'ABAC'],
  },
  {
    id: 'ac-07',
    situation: 'A company uses a SaaS identity platform. When a new hire joins the Marketing department, they automatically receive access to the CRM, email marketing tool, and social media scheduler — the same apps every other Marketing employee has. The IT team configured the department\'s access profile once; no per-user tickets are needed.',
    correctModel: 'RBAC',
    explanation: 'Access is tied to the user\'s role (Marketing department member), not to individual identity. The key RBAC tell: new users inherit permissions from the role automatically — IT does not touch individual settings. This scales well in large organisations. ABAC could also involve department, but ABAC requires evaluating multiple attributes simultaneously; here a single role assignment drives all access decisions.',
    distractors: ['MAC', 'DAC', 'ABAC'],
  },
  {
    id: 'ac-08',
    situation: 'A cloud data lake policy engine evaluates four conditions before granting read access: the user\'s department attribute must equal "Finance", the data\'s classification tag must be "INTERNAL", the request time must fall within business hours (Mon–Fri 08:00–18:00), and the request must originate from a corporate network IP range. All four conditions must be true simultaneously.',
    correctModel: 'ABAC',
    explanation: 'ABAC is the only model that natively combines user attributes (dept=Finance), resource attributes (classification=INTERNAL), environmental attributes (time=business-hours), and network attributes (geo=corporate-network) into a single policy decision. No other model evaluates all four dimensions at once: RBAC considers only role, MAC considers only labels/clearances, and DAC defers to the owner.',
    distractors: ['MAC', 'DAC', 'RBAC'],
  },
  {
    id: 'ac-09',
    situation: 'A developer pushes a new repository to an open-source platform. By default the repo is private. The developer sets it to public, then invites two collaborators with write access and one with read-only access — all without involving an administrator. They can revoke any collaborator\'s access at any time.',
    correctModel: 'DAC',
    explanation: 'The resource owner (developer) has full discretion over who can access their repository and at what permission level. No central authority, clearance system, or role engine is involved — the owner decides. This is the canonical DAC pattern. The ability to set public/private and grant granular per-user permissions at will, without admin involvement, distinguishes DAC from all other models.',
    distractors: ['MAC', 'RBAC', 'ABAC'],
  },
]
