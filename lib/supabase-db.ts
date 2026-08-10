import { supabase, isSupabaseConfigured } from './supabase';
import { normalizeEmail, normalizeName } from './utils';

import {
  TEAM_MEMBERS,
  WORK_TASKS,
  ATTENDANCE_RECORDS,
  LEAVE_REQUESTS,
  MEETINGS,
  TeamMember,
  WorkTask,
  AttendanceRecord,
  LeaveRequest,
  Meeting,
} from './mock-data';

export type {
  TeamMember,
  WorkTask,
  AttendanceRecord,
  LeaveRequest,
  Meeting,
};

const subscribers: Record<string, Set<() => void>> = {};

function notifySubscribers(table: string) {
  if (subscribers[table]) {
    subscribers[table].forEach((cb) => {
      try { cb(); } catch {}
    });
  }
}


export interface ProofOfWorkRecord {
  id: string;
  taskId?: string;
  taskTitle: string;
  submittedBy: string;
  submittedByEmail: string;
  submissionDate: string;
  workDescription: string;
  proofLink?: string;
  proofLinks?: string[];
  fileSize?: number;
  status: 'submitted' | 'approved' | 'rejected' | 'revision_requested';
  reviewedBy?: string;
  reviewComments?: string;
}

export interface DriveDocumentRecord {
  id: string;
  teamFolder: 'Marketing' | 'Business' | 'Legal' | 'Technical' | 'Other';
  uploadedBy: string;
  uploadedByEmail: string;
  fileName: string;
  fileSize?: number;
  externalLink?: string;
  description?: string;
  uploadedAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'attendance' | 'work' | 'meeting' | 'leave' | 'pow';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface DriveAccessGrantRecord {
  id: string;
  grantedTo: string;
  grantedToEmail: string;
  grantedBy: string;
  folders: string[];
  grantedAt: string;
}

// In-memory fallback state initialized with official organization team members (12 members)
let localTeamMembers: TeamMember[] = [
  { id: '1', name: 'Sahith', email: 'sahith@nivixpe.com', role: 'CEO', department: 'Executive', team: 'Business', status: 'active', joinDate: '2020-01-15' },
  { id: '2', name: 'Shubham', email: 'shubhamc@nivixpe.com', role: 'CTO', department: 'Technology', team: 'Technical', reportsTo: 'Sahith', status: 'active', joinDate: '2020-02-01' },
  { id: '3', name: 'Swaraag', email: 'swaraag@nivixpe.com', role: 'CSO', department: 'Sales & Strategy', team: 'Business', reportsTo: 'Sahith', status: 'active', joinDate: '2020-03-10' },
  { id: '4', name: 'Ujjwal', email: 'ujjwal@nivixpe.com', role: 'DCSO', department: 'Deputy Sales & Strategy', team: 'Business', reportsTo: 'Swaraag', status: 'active', joinDate: '2021-01-20' },
  { id: '5', name: 'Bhavika', email: 'N-wkw@nivixpe.com', role: 'DCMO', department: 'Deputy Marketing', team: 'Marketing', status: 'active', joinDate: '2021-02-10' },
  { id: '6', name: 'Siddharatha', email: 'siddharatha@nivixpe.com', role: 'COO', department: 'Operations', team: 'Business', reportsTo: 'Sahith', status: 'active', joinDate: '2020-05-01' },
  { id: '7', name: 'Kashish', email: 'kashish@nivixpe.com', role: 'Legal', department: 'Legal & Compliance', team: 'Legal', reportsTo: 'Sahith', status: 'active', joinDate: '2020-08-01' },
  { id: '8', name: 'Ngan Nguyen', email: 'nguyen@nivixpe.com', role: 'Developer 1', department: 'Technology', team: 'Technical', reportsTo: 'Shubham', status: 'active', joinDate: '2025-05-01' },
  { id: '9', name: 'Vinisha', email: 'vinisha@nivixpe.com', role: 'Legal Intern', department: 'Legal & Compliance', team: 'Legal', reportsTo: 'Sahith', status: 'active', joinDate: '2025-05-15' },
  { id: '10', name: 'Aryan Kulshreshtra', email: 'aryan@nivixpe.com', role: 'Product Manager', department: 'HR', team: 'HR', reportsTo: 'Sahith', status: 'active', joinDate: '2025-05-02' },
  { id: '11', name: 'Adya Paliwal', email: 'adya@nivixpe.com', role: 'Product Manager', department: 'Product', team: 'Business', reportsTo: 'Sahith', status: 'active', joinDate: '2025-07-25' },
  { id: '12', name: 'Nithin', email: 'nithin@nivixpe.com', role: 'Developer 3', department: 'Technology', team: 'Technical', reportsTo: 'Shubham', status: 'active', joinDate: '2025-05-01' },
];

let localWorkTasks: WorkTask[] = [];
let localAttendanceRecords: AttendanceRecord[] = [];
let localLeaveRequests: LeaveRequest[] = [];
let localMeetings: Meeting[] = [];
let localProofOfWork: ProofOfWorkRecord[] = [];
let localDriveDocuments: DriveDocumentRecord[] = [
  {
    "id": "k57b3kzxcex4jbryrvsdrnjn4n8bs1w0",
    "teamFolder": "Business",
    "uploadedBy": "Sahith",
    "uploadedByEmail": "ceo@nivixpe.com",
    "fileName": "6 months Growth Plan.docx",
    "fileSize": 750838,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/c3cb53d3-46f5-408a-a5d2-c81ae7909256",
    "description": "Upload by Swaraag",
    "uploadedAt": "2026-08-03T08:04:30.642Z"
  },
  {
    "id": "k57fbwscnnym7mvt5rtqtchj098bj175",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "tracker for grants.xlsx",
    "fileSize": 6066,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/9615c775-6bf4-42bc-ae98-e60b31bb1e86",
    "description": "",
    "uploadedAt": "2026-07-31T20:45:56.962Z"
  },
  {
    "id": "k57f22z8f6psm7p7abgw91t9018bjg6e",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Different sources to expend our customer base.docx",
    "fileSize": 19933,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/9bf511f6-b51d-44b1-ad6c-72703a33c2b8",
    "description": "",
    "uploadedAt": "2026-07-31T19:25:53.508Z"
  },
  {
    "id": "k575y5bvst1xe3ag70r90ksf5n8bj1wn",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Investor Incentive Document.docx",
    "fileSize": 38411,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/04b90cae-4a23-4363-ad8b-42d4f865361b",
    "description": "",
    "uploadedAt": "2026-07-31T19:25:44.182Z"
  },
  {
    "id": "k573t6aw5868a0z4sm8sjbhjh98bk9f4",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Capital Structure and Funding Strategy-Draft(to be designed ).docx",
    "fileSize": 22984,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/789aeffc-2ce0-4e90-b4ad-d4500c9579be",
    "description": "",
    "uploadedAt": "2026-07-31T19:25:35.398Z"
  },
  {
    "id": "k57f1jaymfz5xmcyrvdqw2kjgd8bk4y9",
    "teamFolder": "Legal",
    "uploadedBy": "Vinisha",
    "uploadedByEmail": "legal2@nivixpe.com",
    "fileName": "NivixPe_Legal_Vision_Board-3.docx",
    "fileSize": 16672,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/f2d94706-585b-4f3c-b488-85dc497d7be7",
    "description": "Nivixpe legal vision board",
    "uploadedAt": "2026-07-31T17:33:28.654Z"
  },
  {
    "id": "k572vf0art2vqqa5dm08bz8zqx8bkp1v",
    "teamFolder": "Business",
    "uploadedBy": "Swaraag",
    "uploadedByEmail": "cso@nivixpe.com",
    "fileName": "NIVIXPE Investor Economics & Return Framework Draft(to be designed).docx",
    "fileSize": 65190,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/3a926138-6c3a-495f-98a9-b110e758ca88",
    "description": "Design team to design the doc as well as create the diagrams according to the instructions given in the document.",
    "uploadedAt": "2026-07-31T11:56:42.915Z"
  },
  {
    "id": "k572zfgb7zk6ydmknmt9g28f7s8bj543",
    "teamFolder": "Business",
    "uploadedBy": "Swaraag",
    "uploadedByEmail": "cso@nivixpe.com",
    "fileName": "NIVIXPE Commercial Incentive Framework - Draft(to be designed).docx",
    "fileSize": 51326,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/eb94b6d5-f6ea-4906-a6ce-b8cf18c09e46",
    "description": "Design team to design the doc as well as create the diagrams according to the instructions given in the document.",
    "uploadedAt": "2026-07-31T11:56:23.130Z"
  },
  {
    "id": "k5712jrkk4ysfg3heq96zey64d8b4m40",
    "teamFolder": "Business",
    "uploadedBy": "Swaraag",
    "uploadedByEmail": "cso@nivixpe.com",
    "fileName": "NIVIXPE Growth Marketing Handbook_compressed.pdf",
    "fileSize": 1196932,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/aafaf5c1-6e72-4fab-8f79-d8d94828de53",
    "description": "Marketing Growth Economics Handbook",
    "uploadedAt": "2026-07-24T13:30:24.693Z"
  },
  {
    "id": "k579cdv4f6hrb0z1f4cyafj2358ayb1n",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Consultancy Talk Phases.pdf",
    "fileSize": 91798,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/496e8c28-9652-40a1-a1b4-3f77e350d8df",
    "description": "",
    "uploadedAt": "2026-07-21T17:31:36.287Z"
  },
  {
    "id": "k577ay88gft98z93tw1hb4raj98az9de",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "New Logistics Companies partnerships and division in phases too .pdf",
    "fileSize": 186211,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/da04f73d-98fe-4297-95dd-daee7a971492",
    "description": "",
    "uploadedAt": "2026-07-21T17:24:55.116Z"
  },
  {
    "id": "k572zv8962rhgdxb2g9pn8re5n8ayn8c",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "India Exports 2015-2025.xlsx",
    "fileSize": 11958,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/043a4226-9774-47d1-a671-60ab361c68de",
    "description": "",
    "uploadedAt": "2026-07-21T17:23:40.478Z"
  },
  {
    "id": "k57a7ajbvasxgg4m58jznrgr018azyqa",
    "teamFolder": "Business",
    "uploadedBy": "Swaraag",
    "uploadedByEmail": "cso@nivixpe.com",
    "fileName": "https://docs.google.com/document/d/1buEI4iju8jbCssg-s-3ys0wbDqhTsuoBsI__F6KFBQw/edit?usp=sharing",
    "fileSize": 0,
    "externalLink": "https://docs.google.com/document/d/1buEI4iju8jbCssg-s-3ys0wbDqhTsuoBsI__F6KFBQw/edit?usp=sharing",
    "description": "Pitch Styles and Questions",
    "uploadedAt": "2026-07-21T07:07:19.627Z"
  },
  {
    "id": "k5793yyvfgtv8m5cnjpb0qyfjh8arxdj",
    "teamFolder": "Business",
    "uploadedBy": "Swaraag",
    "uploadedByEmail": "cso@nivixpe.com",
    "fileName": "Marketing team Fund Allocation.pdf",
    "fileSize": 212270,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/de00b987-7fe0-42a6-83e5-f0bd3cd6090c",
    "description": "",
    "uploadedAt": "2026-07-18T04:21:47.145Z"
  },
  {
    "id": "k575qpxg78ser455cfdm6yx2td8aegj6",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Business Team Report June.docx",
    "fileSize": 15886,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/db91e49c-5d39-4ebc-a852-277650216abe",
    "description": "",
    "uploadedAt": "2026-07-13T08:54:43.173Z"
  },
  {
    "id": "k573fya4v682kdb2y6cvsfj3fd8a3dte",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "130_Smart_Contract_Audit_Framework.docx",
    "fileSize": 69306,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/a16a4e8b-2213-4d29-a488-1878a16b3c73",
    "description": "",
    "uploadedAt": "2026-07-07T09:15:14.016Z"
  },
  {
    "id": "k579gs9m8p4g5yptgpn4j7x5p58a36nb",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "129_Cloud_Infrastructure_Policy.docx",
    "fileSize": 69554,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/7a779343-01e2-4b60-9f06-c817f0e62a33",
    "description": "",
    "uploadedAt": "2026-07-07T09:15:04.699Z"
  },
  {
    "id": "k57ae2r0pxwwd4waxdghrfjhbh8a3w4c",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "128_Penetration_Testing_Policy.docx",
    "fileSize": 62315,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/8729ce7f-9522-47e2-9f3c-a6224ef74359",
    "description": "",
    "uploadedAt": "2026-07-07T09:14:56.608Z"
  },
  {
    "id": "k57b9991j7f2kb827d5pn7x9v58a3aqh",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "127_ISO27001_Readiness_Plan.docx",
    "fileSize": 69399,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/d4c2241a-8f42-4d9c-9358-bab749780a11",
    "description": "",
    "uploadedAt": "2026-07-07T09:14:47.193Z"
  },
  {
    "id": "k572affqzetn702s190re101s58a3b9q",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "126_SOC2_Readiness_Plan.docx",
    "fileSize": 68420,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/630a71eb-5369-493a-9605-405dcc73333c",
    "description": "",
    "uploadedAt": "2026-07-07T09:14:35.825Z"
  },
  {
    "id": "k57e0dktf3xhpzgskywc3vfken8a3yhb",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "125_Logging_Observability_Framework.docx",
    "fileSize": 66252,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/e1212c83-525a-489e-ba7d-ed9defd9c332",
    "description": "",
    "uploadedAt": "2026-07-07T09:14:23.228Z"
  },
  {
    "id": "k57a5z7n3g9b0jgg8p65zy3rys8a2eck",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "124_API_Gateway_Architecture.docx",
    "fileSize": 67496,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/e6704f87-798a-4a0a-b31d-a5a666047981",
    "description": "",
    "uploadedAt": "2026-07-07T09:14:14.527Z"
  },
  {
    "id": "k578v79sehqxv6p55b9ybsayed8a3wmq",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "123_DevOps_SOP_CICD.docx",
    "fileSize": 65713,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/c4ec54e2-8961-48af-8d9a-39ca9cc30566",
    "description": "",
    "uploadedAt": "2026-07-07T09:14:03.981Z"
  },
  {
    "id": "k57ae899yc8zmc2g9c9afsgbg18a3f29",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "122_Data_Backup_Policy.docx",
    "fileSize": 65134,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/83789b0f-d8fd-4b8f-8a77-08b009aa0187",
    "description": "",
    "uploadedAt": "2026-07-07T09:13:53.531Z"
  },
  {
    "id": "k573hnn47c7q9f9t0yva49gfjx8a2tgb",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "121_Infrastructure_Monitoring_SOP.docx",
    "fileSize": 67451,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/68ae58e1-ce87-4a99-b967-232bead2485b",
    "description": "",
    "uploadedAt": "2026-07-07T09:13:43.572Z"
  },
  {
    "id": "k57e69xb1a1s5cer22zyqq8zw58a3k0x",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "120_Business_Continuity_Plan_BCP.docx",
    "fileSize": 70215,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/4dbf2db3-df77-471d-8a40-07276934b4e9",
    "description": "",
    "uploadedAt": "2026-07-07T09:13:33.875Z"
  },
  {
    "id": "k57cdrd2dwj28b9ac0n29bhwx58a3c66",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "119_Disaster_Recovery_Plan_DRP.docx",
    "fileSize": 70374,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/82faeec2-81a9-4cb8-8252-3ef5e2690ab7",
    "description": "",
    "uploadedAt": "2026-07-07T09:13:23.016Z"
  },
  {
    "id": "k573b9vt0thscjssmz5ncbagzh8a2ch7",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "118_Access_Control_Policy_RBAC.docx",
    "fileSize": 66743,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/e996db12-c70c-4ff2-85a1-d43859a2e36c",
    "description": "",
    "uploadedAt": "2026-07-07T09:13:09.520Z"
  },
  {
    "id": "k57ey5ms1tzc7116q5d6vc1qp58a3hvh",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "117_Security_Architecture_Document.docx",
    "fileSize": 68360,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/bc2559aa-0516-4758-ad07-28316bc5356a",
    "description": "",
    "uploadedAt": "2026-07-07T09:12:58.334Z"
  },
  {
    "id": "k575g59b34vqmhp121n2mty6n98a3g3h",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "116_System_Design_Documents.docx",
    "fileSize": 73927,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/5fe5bb60-a500-423a-bc96-7c45be5b008b",
    "description": "",
    "uploadedAt": "2026-07-07T09:12:48.407Z"
  },
  {
    "id": "k576sa4hyzkcdcv62d7ws8afw58a2e5d",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "115_API_Documentation_External.docx",
    "fileSize": 68797,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/10877888-6566-4d44-a4df-89b5b4ac7f25",
    "description": "",
    "uploadedAt": "2026-07-07T09:12:38.162Z"
  },
  {
    "id": "k576kj3g0bnpk4x325vpkqbvsx8a27cw",
    "teamFolder": "Technical",
    "uploadedBy": "Siddharatha",
    "uploadedByEmail": "coo@nivixpe.com",
    "fileName": "114_Infrastructure_Architecture_Document.docx",
    "fileSize": 72823,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/64ae2ac5-8252-45ac-b44e-10f480d6a612",
    "description": "",
    "uploadedAt": "2026-07-07T09:12:18.796Z"
  },
  {
    "id": "k570cy6mqwf6ezbtgz891bvqyx898q2c",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "what we need FOR BETA PHASE (1).docx",
    "fileSize": 22727,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/2debd280-832b-4ec3-a1a1-daa421705d64",
    "description": "",
    "uploadedAt": "2026-06-24T16:19:48.581Z"
  },
  {
    "id": "k571jza1vdvgq5j7nxbts7mz2n899r6e",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "NIVIXPE PRIVATE LIMITED- Vulnerability Disclosure Policy (1).docx",
    "fileSize": 20531,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/69967d91-a20f-4c0f-81e2-7f38cf73a0d9",
    "description": "",
    "uploadedAt": "2026-06-24T16:19:34.413Z"
  },
  {
    "id": "k571drfgjz43he2mh6nxxangh1898j9x",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "NIVIXPE PRIVATE LIMITED- Student Brand Ambassador (1).docx",
    "fileSize": 30821,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/76bd46cc-b268-45da-b864-e28623b5c475",
    "description": "",
    "uploadedAt": "2026-06-24T16:19:21.350Z"
  },
  {
    "id": "k579h156cphk274q77af2tvaed899frd",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "NIVIXPE PRIVATE LIMITED - Privacy policy fnl. (1).docx",
    "fileSize": 27519,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/73f94768-5d8a-44d8-bf14-0c3316f488c3",
    "description": "",
    "uploadedAt": "2026-06-24T16:19:02.600Z"
  },
  {
    "id": "k57a49e0q7gx9cxp9k6bcqty1d899frc",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "NIVIXPE PRIVATE LIMITED - Incident Response Note (1).docx",
    "fileSize": 28037,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/c7a2f206-d94f-4fe1-b1c0-e5f70bd6984b",
    "description": "",
    "uploadedAt": "2026-06-24T16:18:44.136Z"
  },
  {
    "id": "k573x9pvwhqpg0p18723zy9x5x899c8h",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "NIVIXPE PRIVATE LIMITED - GRIEVANCE OFFICER DESIGNATION (1).docx",
    "fileSize": 18811,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/b405d415-e1e2-42b4-8bb7-216d0a7f421f",
    "description": "",
    "uploadedAt": "2026-06-24T16:18:27.665Z"
  },
  {
    "id": "k574yp0d7a2wg309s06zkm5n8n899cx5",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "NIVIXPE PRIVATE LIMITED - GRIEVANCE - PUBLIC NOTICE (1).docx",
    "fileSize": 17472,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/54de71e2-ee2c-43bd-829a-78fea65eafec",
    "description": "",
    "uploadedAt": "2026-06-24T16:18:00.559Z"
  },
  {
    "id": "k5721ghqmar31m2w44aa8k3bhs899c58",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "NIVIXPE PRIVATE LIMITED - Beta Test Agreement (1).docx",
    "fileSize": 26501,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/f4a549b5-08a7-4407-8560-c5d9d6256b07",
    "description": "",
    "uploadedAt": "2026-06-24T16:17:39.632Z"
  },
  {
    "id": "k576vr6yraayac1j2q81ejz2sh8992ec",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "IFSCA Docs needed and complience meet (1).xlsx",
    "fileSize": 15587,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/a9227436-fc4e-41f5-b197-ac334692b7e2",
    "description": "",
    "uploadedAt": "2026-06-24T16:17:25.510Z"
  },
  {
    "id": "k577zbjyrsr1tqe7bnmnxrc5y9898jf2",
    "teamFolder": "Legal",
    "uploadedBy": "Kashish",
    "uploadedByEmail": "legal1@nivixpe.com",
    "fileName": "CHEAT SHEET- NIVIXPE PRIVATE LIMITED (1).docx",
    "fileSize": 29299,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/670997e5-f98b-43a9-8477-9e78a8983dff",
    "description": "",
    "uploadedAt": "2026-06-24T16:17:05.703Z"
  },
  {
    "id": "k57cpfehhe5mrrr9gq899nr2yd88p7hp",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "NivixPe 90 Day Strategic Plan.docx",
    "fileSize": 28630,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/eae700db-388a-45b8-bd1a-33e6adb5ebd4",
    "description": "of Business Team together",
    "uploadedAt": "2026-06-15T12:42:10.488Z"
  },
  {
    "id": "k571kkszxrfzxqt5rast2tbgr188khcv",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Monthly Hatchery Report - May .docx",
    "fileSize": 9118,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/d80fe15b-a683-4bff-9bd2-40499a2abb73",
    "description": "",
    "uploadedAt": "2026-06-13T16:52:36.220Z"
  },
  {
    "id": "k5711vd1z9vv8tpp58gp7dyhg588jyjs",
    "teamFolder": "Marketing",
    "uploadedBy": "Abhiram",
    "uploadedByEmail": "cmo@nivixpe.com",
    "fileName": "NIVIXPE_GTM_Revised_2026 (1).pdf",
    "fileSize": 67774,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/08d0b116-ac69-4e79-858c-b8492ba46cb4",
    "description": "Nivixpe Gtm revised plan 2026",
    "uploadedAt": "2026-06-13T12:24:55.026Z"
  },
  {
    "id": "k5759p6rf1kefjb3035t55tyd988ezzk",
    "teamFolder": "Other",
    "uploadedBy": "Rudra Sahu",
    "uploadedByEmail": "designer2@nivixpe.com",
    "fileName": "https://drive.google.com/drive/folders/1a_kz2yW1P0dYfPSaABvGFYxI5-AMHhI9",
    "fileSize": 0,
    "externalLink": "https://drive.google.com/drive/folders/1a_kz2yW1P0dYfPSaABvGFYxI5-AMHhI9",
    "description": "Drive with all the assets created by me till date",
    "uploadedAt": "2026-06-11T18:28:50.394Z"
  },
  {
    "id": "k576jdc63ex7p8agg140n5ff5188e8f1",
    "teamFolder": "Other",
    "uploadedBy": "Aradhya",
    "uploadedByEmail": "designer1@nivixpe.com",
    "fileName": "NIVIXPE LOGO (4).png",
    "fileSize": 46342,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/e69dee64-1eb5-4733-8071-1dd5d04a90bf",
    "description": "",
    "uploadedAt": "2026-06-11T17:14:18.722Z"
  },
  {
    "id": "k571v6cyhf5trnkyhv46k859ah88eh31",
    "teamFolder": "Other",
    "uploadedBy": "Aradhya",
    "uploadedByEmail": "designer1@nivixpe.com",
    "fileName": "NIVIXPE LOGO (4) 3.png",
    "fileSize": 50018,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/1bc63dbf-e628-4dfc-9c0e-4376b3d0c104",
    "description": "",
    "uploadedAt": "2026-06-11T17:14:11.358Z"
  },
  {
    "id": "k578ff21dnb7cx80w74t0vevbh88fqhp",
    "teamFolder": "Other",
    "uploadedBy": "Aradhya",
    "uploadedByEmail": "designer1@nivixpe.com",
    "fileName": "NivixPe - 1st post (4).png",
    "fileSize": 1223827,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/9da5df9f-adcf-459a-b8c3-7d0a8b53088b",
    "description": "",
    "uploadedAt": "2026-06-11T17:13:59.889Z"
  },
  {
    "id": "k57etz5y2475fa9qkq683rdq1588fhhr",
    "teamFolder": "Other",
    "uploadedBy": "Aradhya",
    "uploadedByEmail": "designer1@nivixpe.com",
    "fileName": "NivixPe - 1st post (4).png",
    "fileSize": 1223827,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/4869af95-a710-47fe-8d99-ce1633a594c2",
    "description": "",
    "uploadedAt": "2026-06-11T17:13:10.354Z"
  },
  {
    "id": "k577w29rrmz0w4sk48qxy229yx88ek2y",
    "teamFolder": "Other",
    "uploadedBy": "Aradhya",
    "uploadedByEmail": "designer1@nivixpe.com",
    "fileName": "NivixPe - 1st post (10).png",
    "fileSize": 638818,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/6b53fab9-cf21-492d-adf6-c60a10bb5a9e",
    "description": "",
    "uploadedAt": "2026-06-11T17:13:02.965Z"
  },
  {
    "id": "k57fr13sveamw4h754rmmv8rrh88e6v1",
    "teamFolder": "Other",
    "uploadedBy": "Aradhya",
    "uploadedByEmail": "designer1@nivixpe.com",
    "fileName": "Twitter post - 3.png",
    "fileSize": 958810,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/f2487db9-e577-4371-8c88-b71ed3334420",
    "description": "",
    "uploadedAt": "2026-06-11T17:12:38.682Z"
  },
  {
    "id": "k5708k5se1zn3q5j434hpwxpjd88enek",
    "teamFolder": "Other",
    "uploadedBy": "Aradhya",
    "uploadedByEmail": "designer1@nivixpe.com",
    "fileName": "Twitter post - 2.png",
    "fileSize": 1025746,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/968feff5-66b6-4afd-a986-539105573631",
    "description": "",
    "uploadedAt": "2026-06-11T17:12:30.162Z"
  },
  {
    "id": "k570yvpkf8zy07ccc82dr52s9n88ek6t",
    "teamFolder": "Other",
    "uploadedBy": "Aradhya",
    "uploadedByEmail": "designer1@nivixpe.com",
    "fileName": "Twitter post - 1.png",
    "fileSize": 664550,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/d44beaec-7b03-402b-94fd-cb4641d52a2d",
    "description": "",
    "uploadedAt": "2026-06-11T17:12:17.267Z"
  },
  {
    "id": "k57c38cnf0bd2dka3b60rq80s588bjm3",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Insurance companies benefits of DID + possible partners.pdf",
    "fileSize": 97164,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/71938326-bcff-4cb4-adb1-607384472a27",
    "description": "",
    "uploadedAt": "2026-06-09T17:24:54.333Z"
  },
  {
    "id": "k57bx7xefdtn57htyj3454b6gh8885rf",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "List of Small Banks In India.pdf",
    "fileSize": 115228,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/b13c588e-ff58-44d3-983a-9c27ac5507a4",
    "description": "",
    "uploadedAt": "2026-06-08T20:44:41.759Z"
  },
  {
    "id": "k579s386kr8vteketkxkm80gfn889d5e",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Monthly Report Business Team-May.pdf",
    "fileSize": 90669,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/8b3453a1-1bd3-497e-b3b8-e47286f629a6",
    "description": "",
    "uploadedAt": "2026-06-08T20:44:10.905Z"
  },
  {
    "id": "k577yp2vdm6sdtsg2k5nfcqyfs888z5y",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Revolut New Policy.pdf",
    "fileSize": 34987,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/a2757bdb-bd96-4b44-b0f8-0871baeca749",
    "description": "",
    "uploadedAt": "2026-06-08T20:42:57.436Z"
  },
  {
    "id": "k575cbpp2fa0em2n06qsq1bx6d888a64",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Customer Switching Behaviour.pdf",
    "fileSize": 35433,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/422d9258-03e4-4895-9e9e-962989075f5a",
    "description": "",
    "uploadedAt": "2026-06-08T20:42:29.795Z"
  },
  {
    "id": "k57257879wjnn5782pths13knx888nr6",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Difference in Strategy in Marketing.pdf",
    "fileSize": 157830,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/36dd4d40-5c43-4676-bc63-e29d1dc1a0f6",
    "description": "Between Europe & India",
    "uploadedAt": "2026-06-08T20:41:46.008Z"
  },
  {
    "id": "k5731p3yvntze5h7pxgahegtv5888cra",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Slice Company Analysis.pdf",
    "fileSize": 111537,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/d8459acd-9a04-4636-bf22-c1b53ba14c21",
    "description": "",
    "uploadedAt": "2026-06-08T20:40:49.656Z"
  },
  {
    "id": "k571wgz5s32gzdtrwhvxf39j49889fr8",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Chinese Yuan.pdf",
    "fileSize": 589966,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/a4f3aa00-e891-4fb8-bd48-6dca5af6d80c",
    "description": "",
    "uploadedAt": "2026-06-08T20:32:54.760Z"
  },
  {
    "id": "k57c1q3ycmpa6p1jrqzn8f2gtx8883ja",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "USD currency.pdf",
    "fileSize": 578479,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/d2522498-8da1-4536-9fea-54e885dcd80d",
    "description": "",
    "uploadedAt": "2026-06-08T20:32:45.207Z"
  },
  {
    "id": "k57eg5pykc3gbndy6ayx5dskhx8882rz",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Jordanian.pdf",
    "fileSize": 520046,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/e246112c-95a4-45b2-adaf-a34322269b07",
    "description": "",
    "uploadedAt": "2026-06-08T20:32:31.892Z"
  },
  {
    "id": "k572csn6hmx9wxdmb7g1vagaah889p8z",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Omani Rial.pdf",
    "fileSize": 572919,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/fc10033f-7bd2-408b-a966-ff9f75e8bb1a",
    "description": "",
    "uploadedAt": "2026-06-08T20:32:19.950Z"
  },
  {
    "id": "k57dsf7f7hg6640jc2cc7cdpp9888drp",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Bahrain Dinar.pdf",
    "fileSize": 596059,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/35678949-a8ab-4d50-ab91-bc2db38edc8b",
    "description": "",
    "uploadedAt": "2026-06-08T20:32:09.343Z"
  },
  {
    "id": "k573gdpnqkx95xx494xg5ydqph889jry",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Kuwaiti Dinar.pdf",
    "fileSize": 497698,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/8eb6588e-ffdb-43c1-b307-ea9e3d6d5149",
    "description": "",
    "uploadedAt": "2026-06-08T20:31:58.093Z"
  },
  {
    "id": "k577tw0p2j6xer66x05vht4rwn888v5f",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Revolut Company Analysis.pdf",
    "fileSize": 1504363,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/a58ef610-e85d-47d6-a61c-cba4f11ba492",
    "description": "",
    "uploadedAt": "2026-06-08T20:28:53.067Z"
  },
  {
    "id": "k570vntq2g2h7jpvabnpwtnwy98892jg",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Short Intro Script.pdf",
    "fileSize": 85669,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/0e5d80b5-c17a-4bde-960b-964daeb44acb",
    "description": "",
    "uploadedAt": "2026-06-08T20:26:19.754Z"
  },
  {
    "id": "k57be05am4k92r54h4bjqzks79889x7q",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Investor profile analysis( if we want to approach again).pdf",
    "fileSize": 88891,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/04589b7d-68ab-46a4-b45f-a13bf543d390",
    "description": "",
    "uploadedAt": "2026-06-08T20:25:37.600Z"
  },
  {
    "id": "k57egrhfg1ds29eat9ywsxwz7h888z1n",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "FINAL VALUATION ANALYSIS.pdf",
    "fileSize": 138930,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/53c7fee6-8156-401f-a813-1ec2ebd76362",
    "description": "",
    "uploadedAt": "2026-06-08T20:24:55.805Z"
  },
  {
    "id": "k572sg2qagb07gckwfgw3ncpjs888h80",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Nivixpe_compressed (1).pdf",
    "fileSize": 1277819,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/e32d148c-37be-4dc3-8b94-8019dac09821",
    "description": "A small ppt on nivixpe",
    "uploadedAt": "2026-06-08T07:45:41.497Z"
  },
  {
    "id": "k57drwn6pskamp4k0mhtbkebws889atz",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Budget_Allocation.pdf",
    "fileSize": 22978,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/5f35f185-9e60-46cd-80a7-226f1c132baa",
    "description": "Final Draft of budget allocation ( Current Updated On is With Swaraag )",
    "uploadedAt": "2026-06-08T07:40:35.317Z"
  },
  {
    "id": "k578jy3jdsz19d3hgfj2nh6qx5888t3y",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "NIVIXPE.docx",
    "fileSize": 25867,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/50be9dec-ce11-4524-898e-019e27ebd2ef",
    "description": "Budget allocation-1",
    "uploadedAt": "2026-06-08T07:39:54.354Z"
  },
  {
    "id": "k570tfvt4hyh8hcyp4nq246cm9889s6e",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Reward_Strategy (1).pdf",
    "fileSize": 87940,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/2abf4b7c-3ccf-4b10-9007-150017531c8f",
    "description": "Reward Strategy (final)",
    "uploadedAt": "2026-06-08T07:38:37.213Z"
  },
  {
    "id": "k570v1m7w10menq8e33t9ea2hd889q1c",
    "teamFolder": "Business",
    "uploadedBy": "Ujjwal",
    "uploadedByEmail": "dcso@nivixpe.com",
    "fileName": "Investor_Data_Room_Tracker.xlsx",
    "fileSize": 10461,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/f7c6855b-83c4-4227-a830-35b2b3b3b596",
    "description": "Investor DATA Room Index",
    "uploadedAt": "2026-06-08T07:36:01.767Z"
  },
  {
    "id": "k5790e0gqt52qtpy1j84wy51r58833v5",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "NIVIXPE_Blog_Article (1).docx",
    "fileSize": 13656,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/7defd7d2-9b0d-4402-bc36-5e7e544eb2cc",
    "description": "Domakonda Bhavika → May → 29th → Blog posted on 2nd June",
    "uploadedAt": "2026-06-05T14:09:49.078Z"
  },
  {
    "id": "k576jcy3bztakbsa0z10fyx87d8836g6",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "Nivixpe_SocialMedia_Plan_June2026 (1).xlsx",
    "fileSize": 30147,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/25cd4402-f458-412e-ac8d-e4f2ef34390e",
    "description": "Domakonda Bhavika → May → 26th → Social Media Plan for June 2026",
    "uploadedAt": "2026-06-05T14:07:30.626Z"
  },
  {
    "id": "k5795wevpz82g1qynsaswr7fy1883a8t",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "NIVIXPE_Medium_Blog_Post.docx",
    "fileSize": 14246,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/dcf1f05d-8bb6-4477-ba80-101c249d5565",
    "description": "Domakonda Bhavika → May → 25th → Blog posted on 29th May",
    "uploadedAt": "2026-06-05T14:05:39.849Z"
  },
  {
    "id": "k574ajzqzwzdxk274dzrd1m9y188353b",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "NIVIXPE_Blog_Banks_Dont_Charge_Fees.docx",
    "fileSize": 13472,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/5c5bc09f-9f8c-4dbd-b0e5-c9d4bcb52d58",
    "description": "Domakonda Bhavika → May → 11th → Blog posted on 24th May",
    "uploadedAt": "2026-06-05T14:04:38.670Z"
  },
  {
    "id": "k57dbmffzgmxc9jjyrz6wwmbah883ctj",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "NIVIXPE_Blog_Global_Payments.docx",
    "fileSize": 12566,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/1c03c3be-ca5a-42b9-9056-689e8f79df77",
    "description": "Domakonda Bhavika → May → 3rd → Blog posted on 11th May",
    "uploadedAt": "2026-06-05T14:02:48.005Z"
  },
  {
    "id": "k57crn7s68w07pxze2fxsmcphd883dft",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "nivixpe subsciptions - bhavika.docx",
    "fileSize": 11492,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/fd59567a-3c02-4aca-b6fa-66686797832e",
    "description": "Domakonda Bhavika → May → 1st → Instagram & Twitter subscription document",
    "uploadedAt": "2026-06-05T14:01:03.129Z"
  },
  {
    "id": "k57fkheyyzn0hgbqys0zx6f9f188392r",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "Wise_Analysis_Bhavika.pdf",
    "fileSize": 270744,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/c3fae0db-ced0-46eb-8e6e-fcc239c99317",
    "description": "Domakonda Bhavika → May → 1st → Marketing Analysis on Wise",
    "uploadedAt": "2026-06-05T14:00:03.539Z"
  },
  {
    "id": "k57cq8xezfsx8t99v4t4h9p5ns8835pw",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "NivixPe_Blog_CrossBorderPayments.docx",
    "fileSize": 13660,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/e30a6277-3e86-4737-883f-69f3ecdb87bf",
    "description": "Domakonda Bhavika → April → 29th → Blog posted on 2nd May",
    "uploadedAt": "2026-06-05T13:58:24.243Z"
  },
  {
    "id": "k5752rk59prj4f7k0c5w5tme3x8831gb",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "nivixpe_solution_blog.docx",
    "fileSize": 12753,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/eecb99fc-328f-4f92-906a-d3fb405ceedb",
    "description": "Domakonda Bhavika → April → 15th → Blog posted on 18th April",
    "uploadedAt": "2026-06-05T13:56:53.131Z"
  },
  {
    "id": "k573rqwkkwk24zmvzb4h0mh9x58827e4",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "invisible_tax_global_ambition.docx",
    "fileSize": 11284,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/731988ea-0087-4b67-9cad-b6e18b6909c1",
    "description": "Domakonda Bhavika → April → 8th → Blog posted on 10th April",
    "uploadedAt": "2026-06-05T13:55:54.096Z"
  },
  {
    "id": "k5756z15rrqbjbez8p0aezpx7n882tc0",
    "teamFolder": "Marketing",
    "uploadedBy": "Bhavika",
    "uploadedByEmail": "dcmo@nivixpe.com",
    "fileName": "DeFi_vs_CBDCs_Medium_Blog.docx",
    "fileSize": 14508,
    "externalLink": "https://diligent-camel-310.convex.cloud/api/storage/c042c504-5522-4602-b8db-8bdf0c7bd925",
    "description": "Domakonda Bhavika → April → 2nd → Blog posted on 2nd April",
    "uploadedAt": "2026-06-05T13:53:45.426Z"
  }
];
let localNotifications: NotificationRecord[] = [];

let localDriveAccessGrants: DriveAccessGrantRecord[] = [
  {
    id: 'grant-1',
    grantedTo: 'Swaraag',
    grantedToEmail: 'cso@nivixpe.com',
    grantedBy: 'Sahith',
    folders: ['Business', 'Legal'],
    grantedAt: '2025-04-01',
  },
];

export const supabaseDb = {
  // --- TEAM MEMBERS ---
  async getTeamMembers(): Promise<TeamMember[]> {
    if (!isSupabaseConfigured) return localTeamMembers;
    try {
      const { data, error } = await supabase.from('team_members').select('*');
      if (error || !data || data.length === 0) return localTeamMembers;
      const mapped = data.map((m: any) => ({
        id: String(m.id),
        name: normalizeName(m.name),
        email: normalizeEmail(m.email),
        role: m.role,
        department: m.department,
        team: m.team,
        additionalTeams: m.additional_teams || m.additionalTeams,
        reportsTo: m.reports_to || m.reportsTo,
        status: m.status || 'active',
        lastLogin: m.last_login || m.lastLogin,
        joinDate: m.join_date || m.joinDate || '2020-01-15',
      }));

      // Deduplicate by name and filter system admin account
      const unique = mapped.filter((m, idx, arr) =>
        m.name !== 'nivixpe' && arr.findIndex(x => x.name === m.name) === idx
      );
      return unique as TeamMember[];

    } catch {
      return localTeamMembers;
    }
  },

  async addTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    const formattedEmail = member.email && member.email.trim() && !member.email.includes('placeholder')
      ? member.email.trim().toLowerCase()
      : `${member.name.trim().toLowerCase().split(' ')[0]}@nivixpe.com`;
    const newMember = { ...member, email: formattedEmail, id: String(Date.now()) };
    
    // Always sync local state
    localTeamMembers.push(newMember);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('team_members').insert([{
          id: newMember.id,
          name: newMember.name,
          email: newMember.email,
          role: newMember.role,
          department: newMember.department,
          team: newMember.team,
          additional_teams: newMember.additionalTeams,
          reports_to: newMember.reportsTo,
          status: newMember.status,
          join_date: newMember.joinDate,
        }]).select();
        if (!error && data && data[0]) {
          notifySubscribers('team_members');
          return data[0] as TeamMember;
        }
      } catch {}
    }
    notifySubscribers('team_members');
    return newMember;
  },

  async deleteTeamMember(id: string): Promise<boolean> {
    // Sync local state
    const index = localTeamMembers.findIndex((m) => String(m.id) === String(id) || m.email.toLowerCase() === String(id).toLowerCase());
    if (index !== -1) {
      localTeamMembers.splice(index, 1);
    } else {
      localTeamMembers = localTeamMembers.filter((m) => String(m.id) !== String(id) && m.email.toLowerCase() !== String(id).toLowerCase());
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('team_members').delete().eq('id', id);
      } catch {}
    }
    notifySubscribers('team_members');
    return true;
  },

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<boolean> {
    const member = localTeamMembers.find((m) => String(m.id) === String(id) || m.email.toLowerCase() === String(id).toLowerCase());
    if (member) {
      Object.assign(member, updates);
    }

    if (isSupabaseConfigured) {
      try {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.department !== undefined) dbUpdates.department = updates.department;
        if (updates.team !== undefined) dbUpdates.team = updates.team;
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        await supabase.from('team_members').update(dbUpdates).eq('id', id);
      } catch {}
    }
    notifySubscribers('team_members');
    return true;
  },




  // --- WORK TASKS ---
  async getWorkTasks(): Promise<WorkTask[]> {
    if (!isSupabaseConfigured) return localWorkTasks;
    try {
      const { data, error } = await supabase.from('work_tasks').select('*');
      if (error) { console.warn('[supabaseDb] getWorkTasks error:', error.message); return localWorkTasks; }
      if (!data || data.length === 0) return localWorkTasks;
      // Map snake_case DB columns → camelCase WorkTask
      return data.map((t: any) => ({
        id: String(t.id || t._id),
        title: t.title,
        assignee: t.assignee,
        assigneeRole: t.assignee_role || t.assigneeRole,
        status: t.status,
        dueDate: t.due_date || t.dueDate || 'Ongoing',
        completedDate: t.completed_date || t.completedDate,
        priority: t.priority,
        description: t.description,
        comments: t.comments,
        owner: t.owner,
        coordinationWith: t.coordination_with || t.coordinationWith,
        createdBy: t.created_by || t.createdBy,
      })) as WorkTask[];
    } catch (e) {
      console.warn('[supabaseDb] getWorkTasks exception:', e);
      return localWorkTasks;
    }
  },

  async createTask(task: Omit<WorkTask, 'id'>): Promise<WorkTask> {
    const newTask = { ...task, id: 'task-' + Date.now() };
    localWorkTasks.unshift(newTask);
    if (isSupabaseConfigured) {
      try {
        // Map camelCase → snake_case for Supabase columns
        const { error } = await supabase.from('work_tasks').insert([{
          id: newTask.id,
          title: newTask.title,
          assignee: newTask.assignee,
          assignee_role: newTask.assigneeRole,
          status: newTask.status,
          due_date: newTask.dueDate || 'Ongoing',
          completed_date: newTask.completedDate || null,
          priority: newTask.priority,
          description: newTask.description || null,
          comments: newTask.comments || null,
          owner: newTask.owner || null,
          coordination_with: newTask.coordinationWith || null,
          created_by: (newTask as any).createdBy || newTask.owner || null,

        }]);
        if (error) console.warn('[supabaseDb] createTask error:', error.message);
      } catch (e) { console.warn('[supabaseDb] createTask exception:', e); }
    }
    notifySubscribers('work_tasks');
    return newTask;
  },

  async updateTask(id: string, updates: Partial<WorkTask>): Promise<void> {
    localWorkTasks = localWorkTasks.map((t) => (String(t.id) === String(id) || String((t as any)._id) === String(id) ? { ...t, ...updates } : t));
    if (isSupabaseConfigured) {
      try {
        // Map camelCase → snake_case
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
        if (updates.assigneeRole !== undefined) dbUpdates.assignee_role = updates.assigneeRole;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || 'Ongoing';
        if (updates.completedDate !== undefined) dbUpdates.completed_date = updates.completedDate;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.comments !== undefined) dbUpdates.comments = updates.comments;
        if (updates.owner !== undefined) dbUpdates.owner = updates.owner;
        if (updates.coordinationWith !== undefined) dbUpdates.coordination_with = updates.coordinationWith;
        const { error } = await supabase.from('work_tasks').update(dbUpdates).eq('id', id);
        if (error) console.warn('[supabaseDb] updateTask error:', error.message);
      } catch (e) { console.warn('[supabaseDb] updateTask exception:', e); }
    }
    notifySubscribers('work_tasks');
  },

  async deleteTask(id: string): Promise<void> {
    localWorkTasks = localWorkTasks.filter((t) => String(t.id) !== String(id) && String((t as any)._id) !== String(id));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('work_tasks').delete().eq('id', id);
        if (error) console.warn('[supabaseDb] deleteTask error:', error.message);
      } catch (e) { console.warn('[supabaseDb] deleteTask exception:', e); }
    }
    notifySubscribers('work_tasks');
  },


  // --- ATTENDANCE ---
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('attendance_records').select('*');
        if (error) { console.warn('[supabaseDb] getAttendanceRecords error:', error.message); }
        else if (data && data.length > 0) {
          // Also update local cache so UI stays consistent
          localAttendanceRecords = data.map((r: any) => ({
            id: String(r.id),
            date: r.date,
            email: r.email,
            loginTime: r.login_time ?? r.loginTime,
            logoutTime: r.logout_time ?? r.logoutTime,
            status: r.status,
            workHours: r.work_hours ?? r.workHours ?? 0,
            currentSessionStart: r.current_session_start ?? r.currentSessionStart ?? null,
            isPaused: r.is_paused ?? r.isPaused ?? false,
          })) as AttendanceRecord[];
          return localAttendanceRecords;
        }
      } catch (e) { console.warn('[supabaseDb] getAttendanceRecords exception:', e); }
    }
    return localAttendanceRecords;
  },

  async markAttendance(record: Omit<AttendanceRecord, 'id'> & { id?: string; _id?: string }): Promise<void> {
    // 1. Always update local cache immediately for instant UI feedback
    const index = localAttendanceRecords.findIndex(
      (r) => r.date === record.date && r.email === record.email
    );
    if (index >= 0) {
      localAttendanceRecords[index] = { ...localAttendanceRecords[index], ...record };
    } else {
      localAttendanceRecords.push({ ...record });
    }

    // 2. Persist to Supabase - only write columns that exist in the schema
    if (isSupabaseConfigured) {
      try {
        const payload: any = {
          date: record.date,
          email: record.email,
          login_time: record.loginTime ?? null,
          logout_time: record.logoutTime ?? null,
          status: record.status,
          // These columns require running supabase/migrations/add_attendance_columns.sql first
          work_hours: record.workHours ?? 0,
          current_session_start: record.currentSessionStart ?? null,
          is_paused: record.isPaused ?? false,
        };
        const { error } = await supabase
          .from('attendance_records')
          .upsert([payload], { onConflict: 'date,email' });
        if (error) {
          // If work_hours column doesn't exist yet, retry with base columns only
          if (error.message?.includes('work_hours') || error.message?.includes('current_session') || error.message?.includes('is_paused')) {
            console.warn('[supabaseDb] Missing attendance columns - run add_attendance_columns.sql migration. Retrying with base columns only.');
            const { error: e2 } = await supabase.from('attendance_records').upsert([{
              date: record.date,
              email: record.email,
              login_time: record.loginTime ?? null,
              logout_time: record.logoutTime ?? null,
              status: record.status,
            }], { onConflict: 'date,email' });
            if (e2) console.warn('[supabaseDb] markAttendance base retry error:', e2.message);
          } else {
            console.warn('[supabaseDb] markAttendance error:', error.message);
          }
        }
      } catch (e) { console.warn('[supabaseDb] markAttendance exception:', e); }
    }
  },

  // --- LEAVE REQUESTS ---
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('leave_requests').select('*');
        if (error) { console.warn('[supabaseDb] getLeaveRequests error:', error.message); }
        else if (data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            employeeName: r.employee_name || r.employeeName,
            employeeEmail: r.employee_email || r.employeeEmail,
            startDate: r.start_date || r.startDate,
            endDate: r.end_date || r.endDate,
            reason: r.reason,
            status: r.status,
            type: r.type,
            approvedBy: r.approved_by || r.approvedBy,
          }));
        }
      } catch (e) { console.warn('[supabaseDb] getLeaveRequests exception:', e); }
    }
    return localLeaveRequests;
  },

  async createLeaveRequest(req: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest> {
    const newReq = { ...req, id: 'leave-' + Date.now() };
    localLeaveRequests.unshift(newReq);
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('leave_requests').insert([{
          id: newReq.id,
          employee_name: newReq.employeeName,
          employee_email: newReq.employeeEmail,
          start_date: newReq.startDate,
          end_date: newReq.endDate,
          reason: newReq.reason,
          status: newReq.status,
          type: newReq.type,
          approved_by: newReq.approvedBy || null,
        }]);
        if (error) console.warn('[supabaseDb] createLeaveRequest error:', error.message);
      } catch (e) { console.warn('[supabaseDb] createLeaveRequest exception:', e); }
    }
    return newReq;
  },

  async updateLeaveStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
    localLeaveRequests = localLeaveRequests.map((l) => (l.id === id ? { ...l, status } : l));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('leave_requests').update({ status }).eq('id', id);
        if (error) console.warn('[supabaseDb] updateLeaveStatus error:', error.message);
      } catch (e) { console.warn('[supabaseDb] updateLeaveStatus exception:', e); }
    }
  },

  // --- MEETINGS ---
  async getMeetings(): Promise<Meeting[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('meetings').select('*');
        if (error) { console.warn('[supabaseDb] getMeetings error:', error.message); }
        else if (data && data.length > 0) {
          return data.map((m: any) => ({
            id: m.id,
            title: m.title,
            date: m.date,
            time: m.time,
            attendees: m.attendees || [],
            status: m.status,
            minutesUrl: m.minutes_url || m.minutesUrl,
            scheduledBy: m.scheduled_by || m.scheduledBy,
            meetLink: m.meet_link || m.meetLink,
            decisions: m.decisions,
            agenda: m.agenda,
          })) as Meeting[];
        }
      } catch (e) { console.warn('[supabaseDb] getMeetings exception:', e); }
    }
    return localMeetings;
  },

  async createMeeting(meeting: Omit<Meeting, 'id'>): Promise<Meeting> {
    const newMeeting = { ...meeting, id: 'meet-' + Date.now() };
    localMeetings.unshift(newMeeting);
    if (isSupabaseConfigured) {
      try {
        // Map camelCase → snake_case for DB columns
        const { error } = await supabase.from('meetings').insert([{
          id: newMeeting.id,
          title: newMeeting.title,
          date: newMeeting.date,
          time: newMeeting.time,
          attendees: newMeeting.attendees || [],
          status: newMeeting.status,
          minutes_url: newMeeting.minutesUrl || null,
          scheduled_by: (newMeeting as any).scheduledBy || null,
        }]);
        if (error) console.warn('[supabaseDb] createMeeting error:', error.message);
      } catch (e) { console.warn('[supabaseDb] createMeeting exception:', e); }
    }
    return newMeeting;
  },

  async completeMeeting(id: string, updates: Partial<Meeting>): Promise<void> {
    const idx = localMeetings.findIndex((m) => m.id === id);
    if (idx !== -1) {
      localMeetings[idx] = { ...localMeetings[idx], ...updates, status: 'completed' };
    }
    if (isSupabaseConfigured) {
      try {
        const dbUpdates: any = { status: 'completed' };
        if (updates.minutesUrl !== undefined) dbUpdates.minutes_url = updates.minutesUrl;
        if (updates.decisions !== undefined) dbUpdates.decisions = updates.decisions;
        if (updates.agenda !== undefined) dbUpdates.agenda = updates.agenda;
        const { error } = await supabase.from('meetings').update(dbUpdates).eq('id', id);
        if (error) console.warn('[supabaseDb] completeMeeting error:', error.message);
      } catch (e) { console.warn('[supabaseDb] completeMeeting exception:', e); }
    }
  },

  async deleteMeeting(id: string): Promise<void> {
    localMeetings = localMeetings.filter((m) => m.id !== id);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('meetings').delete().eq('id', id);
      } catch {}
    }
  },

  // --- PROOF OF WORK ---
  async getProofOfWork(): Promise<ProofOfWorkRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('proof_of_work').select('*');
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            taskId: r.task_id || r.taskId,
            taskTitle: r.task_title || r.taskTitle,
            submittedBy: r.submitted_by || r.submittedBy,
            submittedByEmail: r.submitted_by_email || r.submittedByEmail,
            submissionDate: r.submission_date || r.submissionDate,
            workDescription: r.work_description || r.workDescription,
            proofLink: r.proof_link || r.proofLink,
            proofLinks: r.proof_links || r.proofLinks || [],
            fileSize: r.file_size || r.fileSize,
            status: r.status,
            reviewedBy: r.reviewed_by || r.reviewedBy,
            reviewComments: r.review_comments || r.reviewComments,
          }));
        }
      } catch {}
    }
    return localProofOfWork;
  },

  async submitProofOfWork(pow: Omit<ProofOfWorkRecord, 'id'>): Promise<ProofOfWorkRecord> {
    const newPow = { ...pow, id: 'pow-' + Date.now() };
    localProofOfWork.unshift(newPow);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('proof_of_work').insert([{
          id: newPow.id,
          task_id: newPow.taskId || null,
          task_title: newPow.taskTitle,
          submitted_by: newPow.submittedBy,
          submitted_by_email: newPow.submittedByEmail,
          submission_date: newPow.submissionDate,
          work_description: newPow.workDescription,
          proof_link: newPow.proofLink || null,
          proof_links: newPow.proofLinks || [],
          file_size: newPow.fileSize || null,
          status: newPow.status,
          reviewed_by: newPow.reviewedBy || null,
          review_comments: newPow.reviewComments || null,
        }]);
      } catch {}
    }
    notifySubscribers('proof_of_work');
    return newPow;
  },

  async reviewProofOfWork(id: string, status: 'approved' | 'rejected' | 'revision_requested', comments?: string, reviewer?: string): Promise<void> {
    localProofOfWork = localProofOfWork.map((p) =>
      p.id === id ? { ...p, status, reviewComments: comments, reviewedBy: reviewer } : p
    );
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('proof_of_work')
          .update({ status, review_comments: comments, reviewed_by: reviewer })
          .eq('id', id);
      } catch {}
    }
    notifySubscribers('proof_of_work');
  },


  // --- DRIVE DOCUMENTS ---
  async getDriveDocuments(): Promise<DriveDocumentRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('drive_documents').select('*');
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            teamFolder: r.team_folder || r.teamFolder,
            uploadedBy: r.uploaded_by || r.uploadedBy,
            uploadedByEmail: r.uploaded_by_email || r.uploadedByEmail,
            fileName: r.file_name || r.fileName,
            fileSize: r.file_size || r.fileSize,
            externalLink: r.external_link || r.externalLink,
            description: r.description || '',
            uploadedAt: r.uploaded_at || r.uploadedAt,
          }));
        }
      } catch {}
    }
    return localDriveDocuments;
  },

  async addDriveDocument(doc: Omit<DriveDocumentRecord, 'id'>): Promise<DriveDocumentRecord> {
    const newDoc = { ...doc, id: 'doc-' + Date.now() };
    localDriveDocuments.unshift(newDoc);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('drive_documents').insert([{
          id: newDoc.id,
          team_folder: newDoc.teamFolder,
          uploaded_by: newDoc.uploadedBy,
          uploaded_by_email: newDoc.uploadedByEmail,
          file_name: newDoc.fileName,
          file_size: newDoc.fileSize || null,
          external_link: newDoc.externalLink || null,
          description: newDoc.description || '',
          uploaded_at: newDoc.uploadedAt,
        }]);
      } catch {}
    }
    return newDoc;
  },

  // --- DRIVE ACCESS GRANTS ---
  async getDriveAccessGrants(): Promise<DriveAccessGrantRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('drive_access_grants').select('*');
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            grantedTo: r.granted_to || r.grantedTo,
            grantedToEmail: r.granted_to_email || r.grantedToEmail,
            grantedBy: r.granted_by || r.grantedBy,
            folders: r.folders || [],
            grantedAt: r.granted_at || r.grantedAt,
          }));
        }
      } catch {}
    }
    return localDriveAccessGrants;
  },

  async grantDriveAccess(grant: Omit<DriveAccessGrantRecord, 'id'>): Promise<void> {
    const newGrant = { ...grant, id: 'grant-' + Date.now() };
    localDriveAccessGrants.push(newGrant);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('drive_access_grants').insert([{
          id: newGrant.id,
          granted_to: newGrant.grantedTo,
          granted_to_email: newGrant.grantedToEmail,
          granted_by: newGrant.grantedBy,
          folders: newGrant.folders || [],
          granted_at: newGrant.grantedAt,
        }]);
      } catch {}
    }
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<NotificationRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${userId},user_id.eq.all`);
        if (!error && data && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            userId: r.user_id || r.userId,
            title: r.title,
            message: r.message,
            type: r.type,
            isRead: r.is_read ?? r.isRead ?? false,
            createdAt: r.created_at || r.createdAt,
            link: r.link,
          }));
        }
      } catch {}
    }
    return localNotifications.filter((n) => n.userId === userId || n.userId === 'all');
  },

  async markNotificationRead(id: string): Promise<void> {
    localNotifications = localNotifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch {}
    }
  },

  // --- REAL-TIME SUBSCRIPTION HELPER ---
  subscribeToChanges(table: string, callback: () => void): () => void {
    if (!subscribers[table]) {
      subscribers[table] = new Set();
    }
    subscribers[table].add(callback);

    let supabaseUnsub = () => {};
    if (isSupabaseConfigured) {
      try {
        const channel = supabase
          .channel(`realtime_${table}_${Math.random()}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            () => {
              callback();
            }
          )
          .subscribe();

        supabaseUnsub = () => {
          supabase.removeChannel(channel);
        };
      } catch {
        supabaseUnsub = () => {};
      }
    }

    return () => {
      if (subscribers[table]) {
        subscribers[table].delete(callback);
      }
      supabaseUnsub();
    };
  },

};
