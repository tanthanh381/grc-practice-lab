"use client";

import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Cloud,
  Database,
  Download,
  FileCheck2,
  FileJson,
  FileText,
  Filter,
  Flag,
  FolderOpen,
  Gauge,
  GitBranch,
  GraduationCap,
  Grid3X3,
  Home,
  Import,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  ListChecks,
  MessageSquareText,
  MoreHorizontal,
  PlayCircle,
  Plus,
  RefreshCw,
  Route,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  SlidersHorizontal,
  Sparkles,
  Star,
  TimerReset,
  Trash2,
  TrendingUp,
  UserRoundCheck,
  Wand2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type DataKey =
  | "assets"
  | "vendors"
  | "policies"
  | "risks"
  | "controls"
  | "treatments"
  | "evidence"
  | "audits"
  | "controlTests"
  | "findings"
  | "requirements"
  | "exceptions"
  | "issues"
  | "tasks"
  | "incidents"
  | "appetite"
  | "kris"
  | "bia"
  | "bcm"
  | "cloudRisks"
  | "vendorAssessments"
  | "sox"
  | "itgc";

type GrcRecord = {
  id: string;
  title?: string;
  name?: string;
  owner?: string;
  status?: string;
  dueDate?: string;
  reviewDate?: string;
  priority?: string;
  [key: string]: string | number | boolean | undefined;
};

type GrcData = Record<DataKey, GrcRecord[]> & {
  activity: Array<{ id: string; message: string; at: string; type: string }>;
};

type Option = { label: string; value: string };
type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "date";
  options?: Option[];
  relation?: DataKey;
  min?: number;
  max?: number;
  placeholder?: string;
  required?: boolean;
};

type ColumnConfig = {
  key: string;
  label: string;
  relation?: DataKey;
  render?: (item: GrcRecord, data: GrcData) => React.ReactNode;
};

type EntityConfig = {
  key: DataKey;
  title: string;
  singular: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
};

type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: (data: GrcData) => string | number;
};

const STORAGE_KEY = "grc-practice-lab:v1";
const PROFILE_KEY = "grc-practice-lab:profile:v1";

const statusOptions = ["Draft", "Active", "In Progress", "Approved", "Implemented", "Testing", "Open", "Closed"].map(
  (value) => ({ label: value, value }),
);
const ownerOptions = ["GRC Lead", "Security", "IT Ops", "Finance", "Legal", "Procurement", "Business Owner"].map(
  (value) => ({ label: value, value }),
);
const priorityOptions = ["Low", "Medium", "High", "Critical"].map((value) => ({ label: value, value }));
const emptyData: GrcData = {
  assets: [],
  vendors: [],
  policies: [],
  risks: [],
  controls: [],
  treatments: [],
  evidence: [],
  audits: [],
  controlTests: [],
  findings: [],
  requirements: [],
  exceptions: [],
  issues: [],
  tasks: [],
  incidents: [],
  appetite: [],
  kris: [],
  bia: [],
  bcm: [],
  cloudRisks: [],
  vendorAssessments: [],
  sox: [],
  itgc: [],
  activity: [],
};

const sampleData: GrcData = {
  assets: [
    {
      id: "AST-001",
      name: "Customer Identity Platform",
      owner: "Security",
      criticality: "Critical",
      type: "SaaS",
      dataClass: "Restricted",
      status: "Active",
    },
    {
      id: "AST-002",
      name: "Payment Data Warehouse",
      owner: "Finance",
      criticality: "Critical",
      type: "Database",
      dataClass: "Confidential",
      status: "Active",
    },
    {
      id: "AST-003",
      name: "Employee Endpoint Fleet",
      owner: "IT Ops",
      criticality: "High",
      type: "Endpoint",
      dataClass: "Internal",
      status: "Active",
    },
  ],
  vendors: [
    {
      id: "VEN-001",
      name: "CloudPay Hosting",
      owner: "Procurement",
      criticality: "Critical",
      service: "Cloud infrastructure",
      status: "Active",
      reviewDate: "2026-07-15",
    },
    {
      id: "VEN-002",
      name: "SecureMail",
      owner: "IT Ops",
      criticality: "High",
      service: "Email security gateway",
      status: "Active",
      reviewDate: "2026-08-04",
    },
  ],
  policies: [
    {
      id: "POL-001",
      title: "Access Control Policy",
      owner: "Security",
      status: "Approved",
      version: "2.1",
      reviewDate: "2026-09-10",
      scope: "All production systems",
    },
    {
      id: "POL-002",
      title: "Vendor Risk Management Standard",
      owner: "Procurement",
      status: "Active",
      version: "1.4",
      reviewDate: "2026-08-22",
      scope: "Third-party services",
    },
  ],
  risks: [
    {
      id: "RSK-001",
      title: "Stolen credentials expose customer identities",
      assetId: "AST-001",
      owner: "Security",
      likelihood: 4,
      impact: 5,
      status: "Open",
      treatment: "Mitigate",
      category: "Cyber",
    },
    {
      id: "RSK-002",
      title: "Unverified vendor control failure disrupts payment reporting",
      assetId: "AST-002",
      owner: "Finance",
      likelihood: 3,
      impact: 4,
      status: "In Progress",
      treatment: "Transfer",
      category: "Third Party",
    },
    {
      id: "RSK-003",
      title: "Endpoint patch delays increase ransomware exposure",
      assetId: "AST-003",
      owner: "IT Ops",
      likelihood: 4,
      impact: 4,
      status: "Open",
      treatment: "Mitigate",
      category: "Operational",
    },
  ],
  controls: [
    {
      id: "CTL-001",
      title: "MFA enforced for privileged and customer admin access",
      owner: "Security",
      riskId: "RSK-001",
      framework: "ISO 27001 A.5.17 / SOC 2 CC6.3",
      frequency: "Continuous",
      type: "Preventive",
      status: "Implemented",
    },
    {
      id: "CTL-002",
      title: "Quarterly vendor assurance review",
      owner: "Procurement",
      riskId: "RSK-002",
      framework: "ISO 27001 A.5.19 / SOC 2 CC9.2",
      frequency: "Quarterly",
      type: "Detective",
      status: "Testing",
    },
    {
      id: "CTL-003",
      title: "Endpoint patch compliance reporting",
      owner: "IT Ops",
      riskId: "RSK-003",
      framework: "CIS 7 / NIST PR.IP",
      frequency: "Weekly",
      type: "Detective",
      status: "Implemented",
    },
  ],
  treatments: [
    {
      id: "TRT-001",
      title: "Roll out phishing-resistant MFA for admins",
      owner: "Security",
      riskId: "RSK-001",
      strategy: "Mitigate",
      status: "In Progress",
      dueDate: "2026-07-25",
    },
    {
      id: "TRT-002",
      title: "Obtain updated SOC 2 report and bridge letter",
      owner: "Procurement",
      riskId: "RSK-002",
      strategy: "Transfer",
      status: "Open",
      dueDate: "2026-07-18",
    },
  ],
  evidence: [
    {
      id: "EVD-001",
      title: "MFA policy screenshot and admin enrollment export",
      owner: "Security",
      controlId: "CTL-001",
      type: "Screenshot",
      status: "Accepted",
      collectedAt: "2026-06-18",
      quality: "Strong",
    },
    {
      id: "EVD-002",
      title: "Patch compliance dashboard export",
      owner: "IT Ops",
      controlId: "CTL-003",
      type: "Report",
      status: "Needs Refresh",
      collectedAt: "2026-05-26",
      quality: "Medium",
    },
  ],
  audits: [
    {
      id: "AUD-001",
      title: "SOC 2 Type II readiness audit",
      owner: "GRC Lead",
      scope: "Security, availability, confidentiality",
      status: "Planning",
      dueDate: "2026-08-30",
    },
  ],
  controlTests: [
    {
      id: "TST-001",
      title: "MFA sample test",
      owner: "Security",
      controlId: "CTL-001",
      result: "Pass",
      sampleSize: 12,
      status: "Closed",
      testedAt: "2026-06-21",
    },
  ],
  findings: [
    {
      id: "FND-001",
      title: "Vendor review lacks documented compensating control",
      owner: "Procurement",
      severity: "Medium",
      controlId: "CTL-002",
      status: "Open",
      dueDate: "2026-07-20",
    },
  ],
  requirements: [
    {
      id: "REQ-001",
      title: "ISO 27001 access control objective",
      owner: "Security",
      framework: "ISO 27001",
      status: "Mapped",
      controlId: "CTL-001",
    },
    {
      id: "REQ-002",
      title: "SOC 2 vendor management criteria",
      owner: "Procurement",
      framework: "SOC 2",
      status: "Mapped",
      controlId: "CTL-002",
    },
  ],
  exceptions: [
    {
      id: "EXC-001",
      title: "Legacy finance integration without SSO",
      owner: "Finance",
      riskId: "RSK-001",
      status: "Approved",
      dueDate: "2026-09-01",
    },
  ],
  issues: [
    {
      id: "ISS-001",
      title: "Patch scanner missing 18 laptops",
      owner: "IT Ops",
      priority: "High",
      status: "Open",
      dueDate: "2026-07-05",
    },
  ],
  tasks: [
    {
      id: "TSK-001",
      title: "Attach bridge letter to vendor file",
      owner: "Procurement",
      priority: "High",
      status: "Open",
      dueDate: "2026-07-12",
    },
    {
      id: "TSK-002",
      title: "Refresh endpoint patch evidence",
      owner: "IT Ops",
      priority: "Medium",
      status: "Open",
      dueDate: "2026-07-08",
    },
  ],
  incidents: [
    {
      id: "INC-001",
      title: "Suspicious privileged login blocked",
      owner: "Security",
      severity: "High",
      status: "Contained",
      detectedAt: "2026-06-20",
    },
  ],
  appetite: [
    {
      id: "APP-001",
      title: "Customer data confidentiality",
      owner: "Board",
      category: "Cyber",
      appetite: "Low",
      tolerance: 8,
      status: "Approved",
    },
    {
      id: "APP-002",
      title: "Third-party operational dependency",
      owner: "Board",
      category: "Third Party",
      appetite: "Medium",
      tolerance: 12,
      status: "Approved",
    },
  ],
  kris: [
    {
      id: "KRI-001",
      title: "Privileged accounts without phishing-resistant MFA",
      owner: "Security",
      current: 4,
      amber: 3,
      red: 7,
      status: "Amber",
    },
    {
      id: "KRI-002",
      title: "Endpoints missing critical patches over 14 days",
      owner: "IT Ops",
      current: 22,
      amber: 15,
      red: 30,
      status: "Amber",
    },
  ],
  bia: [
    {
      id: "BIA-001",
      title: "Payment reporting process",
      owner: "Finance",
      rto: "8 hours",
      rpo: "1 hour",
      impact: "High",
      status: "Approved",
    },
  ],
  bcm: [
    {
      id: "BCM-001",
      title: "Payment reporting recovery plan",
      owner: "Finance",
      scenario: "Cloud outage",
      testDate: "2026-09-15",
      status: "Draft",
    },
  ],
  cloudRisks: [
    {
      id: "CLD-001",
      title: "Over-permissive cloud IAM roles",
      owner: "Security",
      likelihood: 3,
      impact: 5,
      status: "Open",
      provider: "AWS",
    },
  ],
  vendorAssessments: [
    {
      id: "VRA-001",
      title: "CloudPay Hosting annual reassessment",
      vendorId: "VEN-001",
      security: 18,
      compliance: 20,
      financial: 21,
      operational: 16,
      status: "In Progress",
    },
  ],
  sox: [
    {
      id: "SOX-001",
      title: "Change approval for financial reporting jobs",
      owner: "Finance",
      controlId: "CTL-003",
      status: "Testing",
      frequency: "Monthly",
    },
  ],
  itgc: [
    {
      id: "ITG-001",
      title: "User access review for production systems",
      owner: "IT Ops",
      controlId: "CTL-001",
      status: "Implemented",
      frequency: "Quarterly",
    },
  ],
  activity: [
    {
      id: "ACT-001",
      message: "Loaded sample GRC program with risks, controls and evidence",
      at: "2026-06-28",
      type: "system",
    },
  ],
};

const entityConfigs: EntityConfig[] = [
  {
    key: "assets",
    title: "Asset Inventory",
    singular: "asset",
    description: "Catalog systems, processes and data stores that anchor risk decisions.",
    icon: Archive,
    accent: "blue",
    fields: [
      { name: "name", label: "Asset name", type: "text", required: true },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "type", label: "Type", type: "select", options: ["SaaS", "Database", "Endpoint", "Process", "Network", "Application"].map((value) => ({ label: value, value })) },
      { name: "criticality", label: "Criticality", type: "select", options: priorityOptions },
      { name: "dataClass", label: "Data class", type: "select", options: ["Public", "Internal", "Confidential", "Restricted"].map((value) => ({ label: value, value })) },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "name", label: "Asset" },
      { key: "owner", label: "Owner" },
      { key: "criticality", label: "Criticality", render: (item) => <Badge value={String(item.criticality)} /> },
      { key: "dataClass", label: "Data" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "vendors",
    title: "Vendor Management",
    singular: "vendor",
    description: "Track third parties, criticality, review dates and assurance gaps.",
    icon: Building2,
    accent: "green",
    fields: [
      { name: "name", label: "Vendor name", type: "text", required: true },
      { name: "owner", label: "Business owner", type: "select", options: ownerOptions },
      { name: "service", label: "Service", type: "text" },
      { name: "criticality", label: "Criticality", type: "select", options: priorityOptions },
      { name: "status", label: "Status", type: "select", options: statusOptions },
      { name: "reviewDate", label: "Next review", type: "date" },
    ],
    columns: [
      { key: "name", label: "Vendor" },
      { key: "service", label: "Service" },
      { key: "criticality", label: "Criticality", render: (item) => <Badge value={String(item.criticality)} /> },
      { key: "reviewDate", label: "Review" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "policies",
    title: "Policy Library",
    singular: "policy",
    description: "Manage policy owners, scope, review cadence and approval status.",
    icon: FileText,
    accent: "cyan",
    fields: [
      { name: "title", label: "Policy title", type: "text", required: true },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "scope", label: "Scope", type: "textarea" },
      { name: "version", label: "Version", type: "text" },
      { name: "status", label: "Status", type: "select", options: statusOptions },
      { name: "reviewDate", label: "Review date", type: "date" },
    ],
    columns: [
      { key: "title", label: "Policy" },
      { key: "owner", label: "Owner" },
      { key: "version", label: "Version" },
      { key: "reviewDate", label: "Review" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "risks",
    title: "Risk Register",
    singular: "risk",
    description: "Score threats, link assets, compare against appetite and decide treatment.",
    icon: AlertTriangle,
    accent: "red",
    fields: [
      { name: "title", label: "Risk statement", type: "textarea", required: true, placeholder: "Threat exploits vulnerability causing impact to asset" },
      { name: "assetId", label: "Impacted asset", type: "select", relation: "assets" },
      { name: "owner", label: "Risk owner", type: "select", options: ownerOptions },
      { name: "category", label: "Category", type: "select", options: ["Cyber", "Third Party", "Operational", "Financial", "Compliance", "Privacy"].map((value) => ({ label: value, value })) },
      { name: "likelihood", label: "Likelihood", type: "number", min: 1, max: 5 },
      { name: "impact", label: "Impact", type: "number", min: 1, max: 5 },
      { name: "treatment", label: "Treatment", type: "select", options: ["Mitigate", "Transfer", "Accept", "Avoid"].map((value) => ({ label: value, value })) },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "title", label: "Risk" },
      { key: "assetId", label: "Asset", relation: "assets" },
      { key: "score", label: "Score", render: (item) => <RiskScore score={getRiskScore(item)} /> },
      { key: "treatment", label: "Treatment" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "controls",
    title: "Control Catalog",
    singular: "control",
    description: "Define testable controls, map them to risks and frameworks, then prove they work.",
    icon: ShieldCheck,
    accent: "indigo",
    fields: [
      { name: "title", label: "Control objective", type: "textarea", required: true },
      { name: "riskId", label: "Linked risk", type: "select", relation: "risks" },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "framework", label: "Framework mapping", type: "text", placeholder: "ISO 27001 A.5.17 / SOC 2 CC6.3" },
      { name: "type", label: "Control type", type: "select", options: ["Preventive", "Detective", "Corrective", "Directive"].map((value) => ({ label: value, value })) },
      { name: "frequency", label: "Frequency", type: "select", options: ["Continuous", "Daily", "Weekly", "Monthly", "Quarterly", "Annual"].map((value) => ({ label: value, value })) },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "title", label: "Control" },
      { key: "riskId", label: "Risk", relation: "risks" },
      { key: "framework", label: "Framework" },
      { key: "frequency", label: "Frequency" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "treatments",
    title: "Risk Treatments",
    singular: "treatment",
    description: "Plan the response that brings risk back within appetite.",
    icon: LifeBuoy,
    accent: "amber",
    fields: [
      { name: "title", label: "Treatment action", type: "textarea", required: true },
      { name: "riskId", label: "Risk", type: "select", relation: "risks" },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "strategy", label: "Strategy", type: "select", options: ["Mitigate", "Transfer", "Accept", "Avoid"].map((value) => ({ label: value, value })) },
      { name: "status", label: "Status", type: "select", options: statusOptions },
      { name: "dueDate", label: "Due date", type: "date" },
    ],
    columns: [
      { key: "title", label: "Treatment" },
      { key: "riskId", label: "Risk", relation: "risks" },
      { key: "strategy", label: "Strategy" },
      { key: "dueDate", label: "Due" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "evidence",
    title: "Evidence Library",
    singular: "evidence",
    description: "Collect dated artifacts that prove control design and operation.",
    icon: FolderOpen,
    accent: "cyan",
    fields: [
      { name: "title", label: "Evidence title", type: "textarea", required: true },
      { name: "controlId", label: "Linked control", type: "select", relation: "controls" },
      { name: "owner", label: "Collector", type: "select", options: ownerOptions },
      { name: "type", label: "Type", type: "select", options: ["Screenshot", "Report", "Log export", "Policy", "Ticket", "Attestation"].map((value) => ({ label: value, value })) },
      { name: "quality", label: "Quality", type: "select", options: ["Weak", "Medium", "Strong"].map((value) => ({ label: value, value })) },
      { name: "status", label: "Status", type: "select", options: ["Collected", "Accepted", "Needs Refresh", "Rejected"].map((value) => ({ label: value, value })) },
      { name: "collectedAt", label: "Collected", type: "date" },
    ],
    columns: [
      { key: "title", label: "Evidence" },
      { key: "controlId", label: "Control", relation: "controls" },
      { key: "quality", label: "Quality", render: (item) => <EvidenceScore item={item} /> },
      { key: "collectedAt", label: "Collected" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "audits",
    title: "Audit Schedule",
    singular: "audit",
    description: "Plan audit scope, timing, owner and readiness state.",
    icon: ClipboardCheck,
    accent: "violet",
    fields: [
      { name: "title", label: "Audit name", type: "text", required: true },
      { name: "owner", label: "Lead", type: "select", options: ownerOptions },
      { name: "scope", label: "Scope", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ["Planning", "Fieldwork", "Reporting", "Closed"].map((value) => ({ label: value, value })) },
      { name: "dueDate", label: "Report due", type: "date" },
    ],
    columns: [
      { key: "title", label: "Audit" },
      { key: "owner", label: "Lead" },
      { key: "scope", label: "Scope" },
      { key: "dueDate", label: "Due" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "controlTests",
    title: "Control Testing",
    singular: "test",
    description: "Record sample sizes, results, and test dates for operating effectiveness.",
    icon: ClipboardList,
    accent: "green",
    fields: [
      { name: "title", label: "Test name", type: "text", required: true },
      { name: "controlId", label: "Control", type: "select", relation: "controls" },
      { name: "owner", label: "Tester", type: "select", options: ownerOptions },
      { name: "sampleSize", label: "Sample size", type: "number", min: 1, max: 200 },
      { name: "result", label: "Result", type: "select", options: ["Pass", "Pass with observation", "Fail", "Not tested"].map((value) => ({ label: value, value })) },
      { name: "status", label: "Status", type: "select", options: statusOptions },
      { name: "testedAt", label: "Tested", type: "date" },
    ],
    columns: [
      { key: "title", label: "Test" },
      { key: "controlId", label: "Control", relation: "controls" },
      { key: "sampleSize", label: "Sample" },
      { key: "result", label: "Result", render: (item) => <Badge value={String(item.result)} /> },
      { key: "testedAt", label: "Tested" },
    ],
  },
  {
    key: "findings",
    title: "Audit Findings",
    singular: "finding",
    description: "Track deficiencies, severity, owners and remediation deadlines.",
    icon: Search,
    accent: "red",
    fields: [
      { name: "title", label: "Finding", type: "textarea", required: true },
      { name: "controlId", label: "Control", type: "select", relation: "controls" },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "severity", label: "Severity", type: "select", options: priorityOptions },
      { name: "status", label: "Status", type: "select", options: statusOptions },
      { name: "dueDate", label: "Due", type: "date" },
    ],
    columns: [
      { key: "title", label: "Finding" },
      { key: "controlId", label: "Control", relation: "controls" },
      { key: "severity", label: "Severity", render: (item) => <Badge value={String(item.severity)} /> },
      { key: "dueDate", label: "Due" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "requirements",
    title: "Compliance Requirements",
    singular: "requirement",
    description: "Translate frameworks and regulations into mapped, owned obligations.",
    icon: ListChecks,
    accent: "indigo",
    fields: [
      { name: "title", label: "Requirement", type: "textarea", required: true },
      { name: "framework", label: "Framework", type: "text" },
      { name: "controlId", label: "Mapped control", type: "select", relation: "controls" },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "status", label: "Status", type: "select", options: ["Unmapped", "Mapped", "Evidence Ready", "Accepted"].map((value) => ({ label: value, value })) },
    ],
    columns: [
      { key: "title", label: "Requirement" },
      { key: "framework", label: "Framework" },
      { key: "controlId", label: "Control", relation: "controls" },
      { key: "owner", label: "Owner" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "exceptions",
    title: "Exceptions",
    singular: "exception",
    description: "Approve, time-box and monitor policy/control exceptions.",
    icon: ShieldAlert,
    accent: "amber",
    fields: [
      { name: "title", label: "Exception", type: "textarea", required: true },
      { name: "riskId", label: "Risk", type: "select", relation: "risks" },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "status", label: "Status", type: "select", options: statusOptions },
      { name: "dueDate", label: "Expiry", type: "date" },
    ],
    columns: [
      { key: "title", label: "Exception" },
      { key: "riskId", label: "Risk", relation: "risks" },
      { key: "owner", label: "Owner" },
      { key: "dueDate", label: "Expires" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "issues",
    title: "Issue Tracker",
    singular: "issue",
    description: "Track operational gaps that need remediation outside formal audit findings.",
    icon: ShieldQuestion,
    accent: "red",
    fields: [
      { name: "title", label: "Issue", type: "textarea", required: true },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "priority", label: "Priority", type: "select", options: priorityOptions },
      { name: "status", label: "Status", type: "select", options: statusOptions },
      { name: "dueDate", label: "Due", type: "date" },
    ],
    columns: [
      { key: "title", label: "Issue" },
      { key: "owner", label: "Owner" },
      { key: "priority", label: "Priority", render: (item) => <Badge value={String(item.priority)} /> },
      { key: "dueDate", label: "Due" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "tasks",
    title: "Task Management",
    singular: "task",
    description: "Coordinate day-to-day work across audits, risk treatments and evidence refreshes.",
    icon: CheckCircle2,
    accent: "green",
    fields: [
      { name: "title", label: "Task", type: "textarea", required: true },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "priority", label: "Priority", type: "select", options: priorityOptions },
      { name: "status", label: "Status", type: "select", options: statusOptions },
      { name: "dueDate", label: "Due", type: "date" },
    ],
    columns: [
      { key: "title", label: "Task" },
      { key: "owner", label: "Owner" },
      { key: "priority", label: "Priority", render: (item) => <Badge value={String(item.priority)} /> },
      { key: "dueDate", label: "Due" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "incidents",
    title: "Incident Log",
    singular: "incident",
    description: "Document security and resilience incidents, severity and containment state.",
    icon: Activity,
    accent: "red",
    fields: [
      { name: "title", label: "Incident", type: "textarea", required: true },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "severity", label: "Severity", type: "select", options: priorityOptions },
      { name: "status", label: "Status", type: "select", options: ["Detected", "Contained", "Resolved", "Closed"].map((value) => ({ label: value, value })) },
      { name: "detectedAt", label: "Detected", type: "date" },
    ],
    columns: [
      { key: "title", label: "Incident" },
      { key: "owner", label: "Owner" },
      { key: "severity", label: "Severity", render: (item) => <Badge value={String(item.severity)} /> },
      { key: "detectedAt", label: "Detected" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "appetite",
    title: "Risk Appetite",
    singular: "statement",
    description: "Define board-approved boundaries that make risk scores meaningful.",
    icon: Gauge,
    accent: "blue",
    fields: [
      { name: "title", label: "Statement", type: "textarea", required: true },
      { name: "category", label: "Category", type: "select", options: ["Cyber", "Third Party", "Operational", "Financial", "Compliance", "Privacy"].map((value) => ({ label: value, value })) },
      { name: "owner", label: "Approver", type: "text" },
      { name: "appetite", label: "Appetite", type: "select", options: ["Very Low", "Low", "Medium", "High"].map((value) => ({ label: value, value })) },
      { name: "tolerance", label: "Tolerance score", type: "number", min: 1, max: 25 },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "title", label: "Statement" },
      { key: "category", label: "Category" },
      { key: "appetite", label: "Appetite", render: (item) => <Badge value={String(item.appetite)} /> },
      { key: "tolerance", label: "Tolerance" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "kris",
    title: "Key Risk Indicators",
    singular: "KRI",
    description: "Monitor early-warning signals tied to appetite thresholds.",
    icon: TrendingUp,
    accent: "amber",
    fields: [
      { name: "title", label: "Indicator", type: "textarea", required: true },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "current", label: "Current value", type: "number" },
      { name: "amber", label: "Amber threshold", type: "number" },
      { name: "red", label: "Red threshold", type: "number" },
      { name: "status", label: "RAG", type: "select", options: ["Green", "Amber", "Red"].map((value) => ({ label: value, value })) },
    ],
    columns: [
      { key: "title", label: "KRI" },
      { key: "owner", label: "Owner" },
      { key: "current", label: "Current" },
      { key: "red", label: "Red" },
      { key: "status", label: "RAG", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "bia",
    title: "Business Impact Analysis",
    singular: "BIA entry",
    description: "Capture impact, RTO and RPO for critical business services.",
    icon: TimerReset,
    accent: "violet",
    fields: [
      { name: "title", label: "Process", type: "text", required: true },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "impact", label: "Impact", type: "select", options: priorityOptions },
      { name: "rto", label: "RTO", type: "text" },
      { name: "rpo", label: "RPO", type: "text" },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "title", label: "Process" },
      { key: "owner", label: "Owner" },
      { key: "impact", label: "Impact", render: (item) => <Badge value={String(item.impact)} /> },
      { key: "rto", label: "RTO" },
      { key: "rpo", label: "RPO" },
    ],
  },
  {
    key: "bcm",
    title: "BCM / DR Plans",
    singular: "plan",
    description: "Design and test recovery plans for high-impact scenarios.",
    icon: Route,
    accent: "green",
    fields: [
      { name: "title", label: "Plan", type: "text", required: true },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "scenario", label: "Scenario", type: "textarea" },
      { name: "testDate", label: "Next test", type: "date" },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "title", label: "Plan" },
      { key: "owner", label: "Owner" },
      { key: "scenario", label: "Scenario" },
      { key: "testDate", label: "Test date" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "cloudRisks",
    title: "Cloud Risk Scenarios",
    singular: "cloud risk",
    description: "Practice cloud-specific risk statements and guardrail mapping.",
    icon: Cloud,
    accent: "cyan",
    fields: [
      { name: "title", label: "Scenario", type: "textarea", required: true },
      { name: "provider", label: "Provider", type: "select", options: ["AWS", "Azure", "GCP", "SaaS", "Multi-cloud"].map((value) => ({ label: value, value })) },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "likelihood", label: "Likelihood", type: "number", min: 1, max: 5 },
      { name: "impact", label: "Impact", type: "number", min: 1, max: 5 },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "title", label: "Scenario" },
      { key: "provider", label: "Provider" },
      { key: "score", label: "Score", render: (item) => <RiskScore score={getRiskScore(item)} /> },
      { key: "owner", label: "Owner" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "vendorAssessments",
    title: "Vendor Risk Assessment",
    singular: "assessment",
    description: "Score vendors across security, compliance, financial and operational dimensions.",
    icon: SlidersHorizontal,
    accent: "green",
    fields: [
      { name: "title", label: "Assessment", type: "text", required: true },
      { name: "vendorId", label: "Vendor", type: "select", relation: "vendors" },
      { name: "security", label: "Security score", type: "number", min: 0, max: 25 },
      { name: "compliance", label: "Compliance score", type: "number", min: 0, max: 25 },
      { name: "financial", label: "Financial score", type: "number", min: 0, max: 25 },
      { name: "operational", label: "Operational score", type: "number", min: 0, max: 25 },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "title", label: "Assessment" },
      { key: "vendorId", label: "Vendor", relation: "vendors" },
      { key: "score", label: "Risk score", render: (item) => <VendorScore item={item} /> },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "sox",
    title: "SOX Compliance",
    singular: "SOX control",
    description: "Track financial reporting controls, frequency and testing state.",
    icon: BriefcaseBusiness,
    accent: "violet",
    fields: [
      { name: "title", label: "SOX control", type: "textarea", required: true },
      { name: "controlId", label: "Linked control", type: "select", relation: "controls" },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "frequency", label: "Frequency", type: "select", options: ["Monthly", "Quarterly", "Annual"].map((value) => ({ label: value, value })) },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "title", label: "SOX control" },
      { key: "controlId", label: "Control", relation: "controls" },
      { key: "owner", label: "Owner" },
      { key: "frequency", label: "Frequency" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
  {
    key: "itgc",
    title: "IT General Controls",
    singular: "ITGC",
    description: "Manage access, change, backup and operations controls.",
    icon: Database,
    accent: "indigo",
    fields: [
      { name: "title", label: "ITGC", type: "textarea", required: true },
      { name: "controlId", label: "Linked control", type: "select", relation: "controls" },
      { name: "owner", label: "Owner", type: "select", options: ownerOptions },
      { name: "frequency", label: "Frequency", type: "select", options: ["Continuous", "Monthly", "Quarterly", "Annual"].map((value) => ({ label: value, value })) },
      { name: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "title", label: "ITGC" },
      { key: "controlId", label: "Control", relation: "controls" },
      { key: "owner", label: "Owner" },
      { key: "frequency", label: "Frequency" },
      { key: "status", label: "Status", render: (item) => <Badge value={String(item.status)} /> },
    ],
  },
];

const configByKey = Object.fromEntries(entityConfigs.map((config) => [config.key, config])) as Record<DataKey, EntityConfig>;

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Command",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "start", label: "Start Here", icon: Home },
      { id: "missions", label: "Guided Missions", icon: Flag },
      { id: "frameworks", label: "Frameworks", icon: BookOpen, badge: () => "566" },
      { id: "glossary", label: "GRC Glossary", icon: GraduationCap },
      { id: "interview", label: "Interview Prep", icon: MessageSquareText },
      { id: "ai", label: "AI Command", icon: Sparkles },
      { id: "portfolio", label: "Portfolio Builder", icon: UserRoundCheck },
    ],
  },
  {
    title: "Foundation",
    items: [
      { id: "assets", label: "Assets", icon: Archive, badge: (d) => d.assets.length },
      { id: "vendors", label: "Vendors", icon: Building2, badge: (d) => d.vendors.length },
      { id: "vendorAssessments", label: "Vendor Risk", icon: SlidersHorizontal, badge: (d) => d.vendorAssessments.length },
      { id: "policies", label: "Policies", icon: FileText, badge: (d) => d.policies.length },
      { id: "requirements", label: "Requirements", icon: ListChecks, badge: (d) => d.requirements.length },
    ],
  },
  {
    title: "Risk & Controls",
    items: [
      { id: "appetite", label: "Risk Appetite", icon: Gauge, badge: (d) => d.appetite.length },
      { id: "risks", label: "Risk Register", icon: AlertTriangle, badge: (d) => d.risks.length },
      { id: "kris", label: "KRIs", icon: TrendingUp, badge: (d) => d.kris.length },
      { id: "controls", label: "Controls", icon: ShieldCheck, badge: (d) => d.controls.length },
      { id: "treatments", label: "Treatments", icon: LifeBuoy, badge: (d) => d.treatments.length },
      { id: "matrix", label: "Risk Matrix", icon: Grid3X3 },
      { id: "mapping", label: "Control Mapping", icon: GitBranch },
      { id: "lifecycle", label: "Control Lifecycle", icon: RefreshCw },
      { id: "cloudRisks", label: "Cloud Risks", icon: Cloud, badge: (d) => d.cloudRisks.length },
    ],
  },
  {
    title: "Audit & Compliance",
    items: [
      { id: "audits", label: "Audits", icon: ClipboardCheck, badge: (d) => d.audits.length },
      { id: "evidence", label: "Evidence", icon: FolderOpen, badge: (d) => d.evidence.length },
      { id: "evidenceScore", label: "Evidence Scoring", icon: Star },
      { id: "controlTests", label: "Control Testing", icon: ClipboardList, badge: (d) => d.controlTests.length },
      { id: "findings", label: "Findings", icon: Search, badge: (d) => d.findings.length },
      { id: "soa", label: "Statement of Applicability", icon: FileCheck2 },
      { id: "itgc", label: "ITGC", icon: Database, badge: (d) => d.itgc.length },
      { id: "sox", label: "SOX", icon: BriefcaseBusiness, badge: (d) => d.sox.length },
      { id: "auditSim", label: "Audit Simulator", icon: PlayCircle },
    ],
  },
  {
    title: "Operations",
    items: [
      { id: "bia", label: "BIA", icon: TimerReset, badge: (d) => d.bia.length },
      { id: "bcm", label: "BCM / DR", icon: Route, badge: (d) => d.bcm.length },
      { id: "incidents", label: "Incidents", icon: Activity, badge: (d) => d.incidents.length },
      { id: "exceptions", label: "Exceptions", icon: ShieldAlert, badge: (d) => d.exceptions.length },
      { id: "issues", label: "Issues", icon: ShieldQuestion, badge: (d) => d.issues.length },
      { id: "tasks", label: "Tasks", icon: CheckCircle2, badge: (d) => d.tasks.length },
      { id: "calendar", label: "Compliance Calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Insights",
    items: [
      { id: "traceability", label: "Traceability", icon: Link2 },
      { id: "reports", label: "Reports", icon: BarChart3 },
      { id: "projects", label: "Projects", icon: BriefcaseBusiness },
    ],
  },
];

const frameworkFamilies = [
  { name: "ISO 27001:2022", count: 93, domains: ["Organizational", "People", "Physical", "Technology"] },
  { name: "NIST CSF 2.0", count: 106, domains: ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"] },
  { name: "CIS Controls v8", count: 153, domains: ["Inventory", "Data Protection", "Secure Config", "Monitoring", "Response"] },
  { name: "SOC 2 Trust Services", count: 64, domains: ["CC", "Availability", "Confidentiality", "Processing Integrity", "Privacy"] },
  { name: "PCI DSS 4.0", count: 70, domains: ["Network", "Account Data", "Vulnerability", "Access", "Monitoring"] },
  { name: "SOX ITGC", count: 42, domains: ["Access", "Change", "Operations", "Backup"] },
  { name: "GDPR Privacy", count: 38, domains: ["Lawfulness", "Rights", "DPIA", "Processor", "Breach"] },
];

const glossary = [
  ["Risk appetite", "The level of risk leadership is willing to accept while pursuing business objectives.", "Risk"],
  ["Risk tolerance", "A measurable threshold that turns appetite into a decision boundary.", "Risk"],
  ["Control objective", "The intended outcome a control is designed to achieve.", "Controls"],
  ["Control design", "Whether a control is logically capable of reducing a risk.", "Controls"],
  ["Operating effectiveness", "Whether a control actually worked during the selected period.", "Audit"],
  ["Evidence", "Dated proof that supports control design or operation.", "Audit"],
  ["Statement of Applicability", "The ISO 27001 artifact explaining which Annex A controls apply and why.", "ISO 27001"],
  ["KRI", "A metric that warns risk owners before exposure exceeds appetite.", "Risk"],
  ["BIA", "Business analysis that defines impact, RTO and RPO for continuity planning.", "Resilience"],
  ["RTO", "The maximum acceptable time to restore a process after disruption.", "Resilience"],
  ["RPO", "The maximum acceptable data loss measured in time.", "Resilience"],
  ["ITGC", "General IT controls over access, change, operations and backup processes.", "SOX"],
  ["Inherent risk", "Risk level before controls are considered.", "Risk"],
  ["Residual risk", "Risk level remaining after controls and treatment actions.", "Risk"],
  ["Finding", "A documented gap from testing, audit or control assessment.", "Audit"],
];

const interviewQuestions = [
  "How would you explain risk appetite to a non-technical executive?",
  "What evidence would you request for a privileged access review control?",
  "How do you decide whether a vendor is critical?",
  "What is the difference between a control deficiency and a material weakness?",
  "How would you write a good risk statement?",
  "What makes evidence weak even when it exists?",
  "How do KRIs connect to board-approved appetite?",
  "How would you prepare for a SOC 2 readiness audit?",
];

function nextId(prefix: string, items: GrcRecord[]) {
  const n = items.length + 1;
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

function getDisplayName(item?: GrcRecord) {
  return String(item?.title || item?.name || item?.id || "Untitled");
}

function findById(data: GrcData, key: DataKey, id?: string | number | boolean) {
  return data[key].find((item) => item.id === id);
}

function getRiskScore(item: GrcRecord) {
  return Number(item.likelihood || 1) * Number(item.impact || 1);
}

function riskLevel(score: number) {
  if (score >= 20) return "Critical";
  if (score >= 12) return "High";
  if (score >= 6) return "Medium";
  return "Low";
}

function riskClass(score: number) {
  return riskLevel(score).toLowerCase();
}

function evidenceScore(item: GrcRecord) {
  let score = 30;
  if (item.controlId) score += 25;
  if (item.collectedAt) score += 15;
  if (item.quality === "Strong") score += 25;
  if (item.quality === "Medium") score += 15;
  if (item.status === "Accepted") score += 10;
  if (item.status === "Needs Refresh") score -= 15;
  return Math.max(0, Math.min(100, score));
}

function vendorScore(item: GrcRecord) {
  return ["security", "compliance", "financial", "operational"].reduce((sum, key) => sum + Number(item[key] || 0), 0);
}

function daysUntil(date?: string | number | boolean) {
  if (!date || typeof date !== "string") return null;
  const now = new Date();
  const target = new Date(`${date}T00:00:00`);
  const diff = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  return Number.isFinite(diff) ? diff : null;
}

function buildFrameworkControls() {
  return frameworkFamilies.flatMap((family) =>
    Array.from({ length: family.count }, (_, index) => {
      const domain = family.domains[index % family.domains.length];
      const number = index + 1;
      return {
        id: `${family.name.split(" ")[0].replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${String(number).padStart(3, "0")}`,
        family: family.name,
        domain,
        title: `${domain} control practice ${number}`,
        objective: `Verify that ${domain.toLowerCase()} governance is owned, documented, measured and reviewed.`,
      };
    }),
  );
}

const frameworkControls = buildFrameworkControls();

function Badge({ value }: { value?: string }) {
  const normalized = String(value || "None").slice(0, 80);
  const className = slugClass(normalized);
  return <span className={`badge badge-${className}`}>{normalized}</span>;
}

function slugClass(value: string) {
  let slug = "";
  for (const char of value.toLowerCase()) {
    const code = char.charCodeAt(0);
    const isLetter = code >= 97 && code <= 122;
    const isNumber = code >= 48 && code <= 57;
    slug += isLetter || isNumber ? char : "-";
  }
  return slug.split("-").filter(Boolean).join("-") || "none";
}

function RiskScore({ score }: { score: number }) {
  return (
    <span className={`risk-score risk-${riskClass(score)}`}>
      {score}
      <small>{riskLevel(score)}</small>
    </span>
  );
}

function EvidenceScore({ item }: { item: GrcRecord }) {
  const score = evidenceScore(item);
  return (
    <span className="mini-score">
      <span style={{ width: `${score}%` }} />
      <strong>{score}</strong>
    </span>
  );
}

function VendorScore({ item }: { item: GrcRecord }) {
  const score = vendorScore(item);
  const label = score >= 80 ? "Low" : score >= 60 ? "Moderate" : score >= 40 ? "High" : "Critical";
  return (
    <span className={`vendor-score vendor-${label.toLowerCase()}`}>
      {score}/100 <small>{label}</small>
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: string;
  sub?: string;
}) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        {sub ? <small>{sub}</small> : null}
      </div>
    </article>
  );
}

export default function GrcLab() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="loading-shell">
        <div>
          <strong>GRC Practice Lab</strong>
          <span>Loading workspace...</span>
        </div>
      </main>
    );
  }

  return <GrcWorkspace />;
}

function GrcWorkspace() {
  const [data, setData] = useState<GrcData>(sampleData);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [formState, setFormState] = useState<{ key: DataKey; item?: GrcRecord } | null>(null);
  const [draft, setDraft] = useState<Record<string, string | number | boolean>>({});
  const [profile, setProfile] = useState({ name: "GRC Analyst", email: "analyst@example.com", linkedin: "", targetRole: "GRC Analyst" });
  const [frameworkQuery, setFrameworkQuery] = useState("");
  const [frameworkFilter, setFrameworkFilter] = useState("All");
  const [coachPrompt, setCoachPrompt] = useState("What should I fix first before an audit?");
  const [coachAnswer, setCoachAnswer] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const storedProfile = window.localStorage.getItem(PROFILE_KEY);
    if (stored) {
      try {
        setData({ ...emptyData, ...JSON.parse(stored) });
      } catch {
        setData(sampleData);
      }
    }
    if (storedProfile) {
      try {
        setProfile(JSON.parse(storedProfile));
      } catch {
        setProfile({ name: "GRC Analyst", email: "analyst@example.com", linkedin: "", targetRole: "GRC Analyst" });
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [profile, hydrated]);

  const metrics = useMemo(() => buildMetrics(data), [data]);
  const activeConfig = configByKey[activeTab as DataKey];
  const activeNav = navGroups.flatMap((group) => group.items).find((item) => item.id === activeTab);
  const PageIcon = activeConfig?.icon || activeNav?.icon || LayoutDashboard;

  const addActivity = (message: string, type = "update") => {
    const entry = {
      id: `ACT-${Date.now()}`,
      message,
      at: new Date().toISOString().slice(0, 10),
      type,
    };
    setData((current) => ({ ...current, activity: [entry, ...current.activity].slice(0, 40) }));
  };

  const openForm = (key: DataKey, item?: GrcRecord) => {
    const config = configByKey[key];
    const base = Object.fromEntries(config.fields.map((field) => [field.name, field.type === "number" ? 1 : ""]));
    setDraft({ ...base, ...(item || {}) });
    setFormState({ key, item });
  };

  const saveRecord = () => {
    if (!formState) return;
    const config = configByKey[formState.key];
    const normalized = { ...draft };
    config.fields.forEach((field) => {
      if (field.type === "number") normalized[field.name] = Number(normalized[field.name] || 0);
    });
    const prefix = config.key.slice(0, 3).toUpperCase();
    const payload = {
      ...formState.item,
      ...normalized,
      id: formState.item?.id || nextId(prefix, data[formState.key]),
    } as GrcRecord;

    setData((current) => {
      const existing = Boolean(formState.item);
      const rows = existing
        ? current[formState.key].map((item) => (item.id === payload.id ? payload : item))
        : [payload, ...current[formState.key]];
      const activity = [
        {
          id: `ACT-${Date.now()}`,
          message: `${existing ? "Updated" : "Created"} ${config.singular}: ${getDisplayName(payload)}`,
          at: new Date().toISOString().slice(0, 10),
          type: config.key,
        },
        ...current.activity,
      ].slice(0, 40);
      return { ...current, [formState.key]: rows, activity };
    });
    setFormState(null);
  };

  const deleteRecord = (key: DataKey, id: string) => {
    const config = configByKey[key];
    const item = data[key].find((row) => row.id === id);
    setData((current) => ({
      ...current,
      [key]: current[key].filter((row) => row.id !== id),
      activity: [
        {
          id: `ACT-${Date.now()}`,
          message: `Deleted ${config.singular}: ${getDisplayName(item)}`,
          at: new Date().toISOString().slice(0, 10),
          type: key,
        },
        ...current.activity,
      ].slice(0, 40),
    }));
  };

  const loadSamples = () => {
    setData(sampleData);
    addActivity("Restored sample GRC lab data", "system");
  };

  const resetData = () => {
    setData({ ...emptyData, activity: [{ id: "ACT-001", message: "Started a blank GRC workspace", at: new Date().toISOString().slice(0, 10), type: "system" }] });
  };

  const exportJson = () => {
    downloadFile("grc-practice-lab-export.json", JSON.stringify({ data, profile, exportedAt: new Date().toISOString() }, null, 2), "application/json");
  };

  const exportReport = () => {
    downloadFile("grc-executive-report.md", buildMarkdownReport(data, profile), "text/markdown");
  };

  const importJson = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    setData({ ...emptyData, ...(parsed.data || parsed) });
    if (parsed.profile) setProfile(parsed.profile);
    addActivity("Imported GRC lab JSON package", "system");
  };

  const mapFrameworkControl = (control: (typeof frameworkControls)[number]) => {
    const record: GrcRecord = {
      id: nextId("CTL", data.controls),
      title: control.objective,
      owner: "Security",
      framework: `${control.family} / ${control.id}`,
      frequency: "Quarterly",
      type: "Preventive",
      status: "Draft",
    };
    setData((current) => ({
      ...current,
      controls: [record, ...current.controls],
      activity: [
        {
          id: `ACT-${Date.now()}`,
          message: `Mapped framework control into catalog: ${control.id}`,
          at: new Date().toISOString().slice(0, 10),
          type: "framework",
        },
        ...current.activity,
      ].slice(0, 40),
    }));
    setActiveTab("controls");
  };

  const renderContent = () => {
    if (activeConfig) return <EntityView config={activeConfig} data={data} query={query} filter={filter} onEdit={openForm} onDelete={deleteRecord} />;
    switch (activeTab) {
      case "dashboard":
        return <Dashboard data={data} metrics={metrics} go={setActiveTab} />;
      case "start":
        return <StartHere data={data} go={setActiveTab} loadSamples={loadSamples} />;
      case "missions":
        return <Missions data={data} go={setActiveTab} />;
      case "frameworks":
        return (
          <Frameworks
            query={frameworkQuery}
            filter={frameworkFilter}
            setQuery={setFrameworkQuery}
            setFilter={setFrameworkFilter}
            onMap={mapFrameworkControl}
          />
        );
      case "glossary":
        return <Glossary query={query} />;
      case "interview":
        return <InterviewPrep data={data} />;
      case "ai":
        return <AiCommand data={data} prompt={coachPrompt} setPrompt={setCoachPrompt} answer={coachAnswer} setAnswer={setCoachAnswer} />;
      case "portfolio":
        return <Portfolio data={data} profile={profile} setProfile={setProfile} exportReport={exportReport} />;
      case "matrix":
        return <RiskMatrix data={data} />;
      case "mapping":
        return <ControlMapping data={data} />;
      case "lifecycle":
        return <ControlLifecycle data={data} />;
      case "evidenceScore":
        return <EvidenceScoring data={data} />;
      case "soa":
        return <StatementOfApplicability data={data} />;
      case "auditSim":
        return <AuditSimulator data={data} setData={setData} />;
      case "calendar":
        return <ComplianceCalendar data={data} />;
      case "traceability":
        return <Traceability data={data} />;
      case "reports":
        return <Reports data={data} profile={profile} exportJson={exportJson} exportReport={exportReport} />;
      case "projects":
        return <Projects data={data} go={setActiveTab} />;
      default:
        return <Dashboard data={data} metrics={metrics} go={setActiveTab} />;
    }
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Shield size={22} />
          </div>
          <div>
            <strong>GRC Practice Lab</strong>
            <span>Governance. Risk. Compliance.</span>
          </div>
        </div>
        <nav className="nav-list">
          {navGroups.map((group) => (
            <section key={group.title}>
              <p>{group.title}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                const badge = item.badge?.(data);
                return (
                  <button key={item.id} className={active ? "active" : ""} onClick={() => setActiveTab(item.id)}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                    {badge !== undefined && badge !== "" ? <em>{badge}</em> : null}
                  </button>
                );
              })}
            </section>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="page-title">
            <div className="page-icon">
              <PageIcon size={23} />
            </div>
            <div>
              <h1>{activeConfig?.title || activeNav?.label || "Dashboard"}</h1>
              <p>{activeConfig?.description || "Operate a complete hands-on GRC program from one browser workspace."}</p>
            </div>
          </div>
          <div className="top-actions">
            <div className="searchbox">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search current view" />
            </div>
            <button className="icon-button" title="Import JSON" onClick={() => fileInputRef.current?.click()}>
              <Import size={18} />
            </button>
            <button className="icon-button" title="Export JSON" onClick={exportJson}>
              <Download size={18} />
            </button>
            {activeConfig ? (
              <button className="primary-button" onClick={() => openForm(activeConfig.key)}>
                <Plus size={18} />
                Add
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => importJson(event.target.files?.[0])}
          />
        </header>

        <div className="workspace-tools">
          <button className="chip" onClick={loadSamples}>
            <Wand2 size={15} />
            Load sample data
          </button>
          <button className="chip" onClick={resetData}>
            <RefreshCw size={15} />
            Blank workspace
          </button>
          <button className="chip" onClick={exportReport}>
            <FileText size={15} />
            Markdown report
          </button>
          <label className="filter-select">
            <Filter size={15} />
            <select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="open">Open / active</option>
              <option value="high">High / critical</option>
              <option value="due">Due soon</option>
            </select>
          </label>
        </div>

        {renderContent()}
      </section>

      {formState ? (
        <RecordModal
          config={configByKey[formState.key]}
          data={data}
          draft={draft}
          setDraft={setDraft}
          onClose={() => setFormState(null)}
          onSave={saveRecord}
          editing={Boolean(formState.item)}
        />
      ) : null}
    </main>
  );
}

function buildMetrics(data: GrcData) {
  const scores = data.risks.map(getRiskScore);
  const critical = scores.filter((score) => score >= 20).length;
  const high = scores.filter((score) => score >= 12 && score < 20).length;
  const controlsWithEvidence = data.controls.filter((control) => data.evidence.some((item) => item.controlId === control.id)).length;
  const testedControls = data.controls.filter((control) => data.controlTests.some((item) => item.controlId === control.id)).length;
  const openFindings = data.findings.filter((item) => item.status !== "Closed").length;
  const dueSoon = dueItems(data).filter((item) => {
    const days = daysUntil(item.date);
    return days !== null && days <= 30;
  }).length;
  const evidenceCoverage = data.controls.length ? Math.round((controlsWithEvidence / data.controls.length) * 100) : 0;
  const testCoverage = data.controls.length ? Math.round((testedControls / data.controls.length) * 100) : 0;
  const riskHealth = Math.max(0, 100 - critical * 18 - high * 8 - openFindings * 5);
  const overall = Math.round((riskHealth + evidenceCoverage + testCoverage) / 3);
  return { critical, high, openFindings, dueSoon, evidenceCoverage, testCoverage, riskHealth, overall };
}

function Dashboard({ data, metrics, go }: { data: GrcData; metrics: ReturnType<typeof buildMetrics>; go: (tab: string) => void }) {
  const advisor = buildAdvisor(data);
  return (
    <div className="content-grid">
      <section className="stats-grid">
        <StatCard icon={Gauge} label="Program health" value={`${metrics.overall}%`} tone={metrics.overall >= 70 ? "green" : metrics.overall >= 45 ? "amber" : "red"} sub="risk + evidence + testing" />
        <StatCard icon={AlertTriangle} label="Critical risks" value={metrics.critical} tone={metrics.critical ? "red" : "green"} sub={`${metrics.high} high risks`} />
        <StatCard icon={FolderOpen} label="Evidence coverage" value={`${metrics.evidenceCoverage}%`} tone={metrics.evidenceCoverage >= 70 ? "green" : "amber"} sub="controls with proof" />
        <StatCard icon={CalendarDays} label="Due in 30 days" value={metrics.dueSoon} tone={metrics.dueSoon ? "amber" : "green"} sub="reviews and actions" />
      </section>

      <section className="main-two-col">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Risk heatmap</h2>
              <p>Score = likelihood x impact. Use it to prioritize treatment.</p>
            </div>
            <button className="ghost-button" onClick={() => go("matrix")}>
              Open matrix <ArrowRight size={16} />
            </button>
          </div>
          <RiskMatrix data={data} compact />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Health advisor</h2>
              <p>Automatically generated from your current records.</p>
            </div>
          </div>
          <div className="advisor-list">
            {advisor.map((item) => (
              <button key={item.title} onClick={() => go(item.tab)} className={`advisor advisor-${item.tone}`}>
                <item.icon size={19} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.detail}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="coverage-grid">
        {[
          ["Assets", data.assets.length, "assets"],
          ["Vendors", data.vendors.length, "vendors"],
          ["Risks", data.risks.length, "risks"],
          ["Controls", data.controls.length, "controls"],
          ["Evidence", data.evidence.length, "evidence"],
          ["Findings", data.findings.length, "findings"],
          ["Tasks", data.tasks.length, "tasks"],
          ["Incidents", data.incidents.length, "incidents"],
        ].map(([label, value, tab]) => (
          <button key={label} className="coverage-tile" onClick={() => go(String(tab))}>
            <strong>{value}</strong>
            <span>{label}</span>
          </button>
        ))}
      </section>

      <section className="main-two-col">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Upcoming work</h2>
              <p>Deadlines from tasks, findings, audits, policies and reviews.</p>
            </div>
          </div>
          <Timeline items={dueItems(data).slice(0, 7)} />
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Activity trail</h2>
              <p>Recent changes saved in this browser workspace.</p>
            </div>
          </div>
          <div className="activity-list">
            {data.activity.slice(0, 7).map((item) => (
              <div key={item.id} className="activity-row">
                <span />
                <div>
                  <strong>{item.message}</strong>
                  <small>{item.at}</small>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function EntityView({
  config,
  data,
  query,
  filter,
  onEdit,
  onDelete,
}: {
  config: EntityConfig;
  data: GrcData;
  query: string;
  filter: string;
  onEdit: (key: DataKey, item?: GrcRecord) => void;
  onDelete: (key: DataKey, id: string) => void;
}) {
  const rows = useMemo(() => {
    return data[config.key]
      .filter((item) => {
        const text = JSON.stringify(item).toLowerCase();
        return !query || text.includes(query.toLowerCase());
      })
      .filter((item) => {
        if (filter === "all") return true;
        if (filter === "open") return !["Closed", "Approved", "Accepted"].includes(String(item.status));
        if (filter === "high") {
          const score = getRiskScore(item);
          return ["High", "Critical"].includes(String(item.priority || item.severity || item.criticality)) || score >= 12;
        }
        if (filter === "due") {
          const days = daysUntil(item.dueDate || item.reviewDate || item.testDate);
          return days !== null && days <= 30;
        }
        return true;
      });
  }, [config.key, data, filter, query]);

  return (
    <section className="panel">
      <div className="table-toolbar">
        <div>
          <h2>{config.title}</h2>
          <p>
            {rows.length} of {data[config.key].length} records visible
          </p>
        </div>
        <button className="primary-button" onClick={() => onEdit(config.key)}>
          <Plus size={17} />
          Add {config.singular}
        </button>
      </div>

      {rows.length ? (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {config.columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  {config.columns.map((column) => (
                    <td key={column.key}>{renderCell(column, item, data)}</td>
                  ))}
                  <td className="row-actions">
                    <button className="icon-button small" title="Edit" onClick={() => onEdit(config.key, item)}>
                      <MoreHorizontal size={16} />
                    </button>
                    <button className="icon-button small danger" title="Delete" onClick={() => onDelete(config.key, item.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={config.icon} title={`No ${config.title.toLowerCase()} yet`} detail="Load sample data or create your first record to start building traceability." />
      )}
    </section>
  );
}

function renderCell(column: ColumnConfig, item: GrcRecord, data: GrcData) {
  if (column.render) return column.render(item, data);
  if (column.relation) {
    return <span className="relation-chip">{getDisplayName(findById(data, column.relation, item[column.key]))}</span>;
  }
  const value = item[column.key];
  if (!value) return <span className="muted">-</span>;
  return String(value);
}

function RecordModal({
  config,
  data,
  draft,
  setDraft,
  onClose,
  onSave,
  editing,
}: {
  config: EntityConfig;
  data: GrcData;
  draft: Record<string, string | number | boolean>;
  setDraft: React.Dispatch<React.SetStateAction<Record<string, string | number | boolean>>>;
  onClose: () => void;
  onSave: () => void;
  editing: boolean;
}) {
  return (
    <div className="modal-backdrop">
      <form
        className="record-modal"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div className="modal-header">
          <div>
            <h2>{editing ? "Edit" : "Add"} {config.singular}</h2>
            <p>{config.description}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="form-grid">
          {config.fields.map((field) => (
            <label key={field.name} className={field.type === "textarea" ? "wide" : ""}>
              <span>{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  required={field.required}
                  value={String(draft[field.name] || "")}
                  placeholder={field.placeholder}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              ) : field.type === "select" ? (
                <select value={String(draft[field.name] || "")} required={field.required} onChange={(event) => setDraft((current) => ({ ...current, [field.name]: event.target.value }))}>
                  <option value="">Choose...</option>
                  {getFieldOptions(field, data).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required={field.required}
                  type={field.type}
                  min={field.min}
                  max={field.max}
                  value={String(draft[field.name] || "")}
                  placeholder={field.placeholder}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.name]: field.type === "number" ? Number(event.target.value) : event.target.value }))}
                />
              )}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            <Save size={17} />
            Save record
          </button>
        </div>
      </form>
    </div>
  );
}

function getFieldOptions(field: FieldConfig, data: GrcData) {
  if (field.relation) {
    return data[field.relation].map((item) => ({ label: `${item.id} - ${getDisplayName(item)}`, value: item.id }));
  }
  return field.options || [];
}

function StartHere({ data, go, loadSamples }: { data: GrcData; go: (tab: string) => void; loadSamples: () => void }) {
  const steps = [
    { label: "Define appetite", tab: "appetite", done: data.appetite.length > 0, detail: "Board boundaries for risk decisions." },
    { label: "Inventory assets", tab: "assets", done: data.assets.length >= 2, detail: "Know what needs protection." },
    { label: "Score risks", tab: "risks", done: data.risks.length >= 3, detail: "Threat + vulnerability + impact." },
    { label: "Map controls", tab: "controls", done: data.controls.length >= 3, detail: "Reduce risks with testable safeguards." },
    { label: "Collect evidence", tab: "evidence", done: data.evidence.length >= 2, detail: "Prove controls are operating." },
    { label: "Run testing", tab: "controlTests", done: data.controlTests.length >= 1, detail: "Validate operating effectiveness." },
    { label: "Export report", tab: "reports", done: false, detail: "Turn work into portfolio material." },
  ];
  const done = steps.filter((step) => step.done).length;
  return (
    <section className="panel">
      <div className="start-hero">
        <div>
          <span className="eyebrow">Hands-on path</span>
          <h2>Build a complete GRC mini-program</h2>
          <p>Move through the workflow an analyst uses in real audits: appetite, assets, risks, controls, evidence, testing and reporting.</p>
        </div>
        <div className="progress-ring">
          <strong>{Math.round((done / steps.length) * 100)}%</strong>
          <span>complete</span>
        </div>
      </div>
      <div className="mission-list">
        {steps.map((step, index) => (
          <button key={step.label} className={step.done ? "done" : ""} onClick={() => go(step.tab)}>
            <em>{index + 1}</em>
            <span>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </span>
            {step.done ? <Check size={18} /> : <ArrowRight size={18} />}
          </button>
        ))}
      </div>
      <div className="inline-actions">
        <button className="primary-button" onClick={loadSamples}>
          <Wand2 size={17} />
          Load a realistic program
        </button>
        <button className="ghost-button" onClick={() => go("missions")}>
          Open guided missions <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function Missions({ data, go }: { data: GrcData; go: (tab: string) => void }) {
  const missions = [
    { title: "Risk register starter", target: "risks", done: data.risks.length >= 3, criteria: "Create 3 risks with asset links and 1-5 scores." },
    { title: "Control assurance chain", target: "mapping", done: data.controls.length >= 3 && data.evidence.length >= 2, criteria: "Map at least 3 controls and collect 2 evidence items." },
    { title: "Audit readiness", target: "auditSim", done: data.controlTests.length >= 1 && data.findings.length >= 1, criteria: "Run one control test and document one finding." },
    { title: "Third-party review", target: "vendorAssessments", done: data.vendorAssessments.length >= 1, criteria: "Score a vendor across four risk dimensions." },
    { title: "Portfolio packet", target: "portfolio", done: data.risks.length >= 3 && data.controls.length >= 3 && data.evidence.length >= 2, criteria: "Generate a report with traceability." },
  ];
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Guided missions</h2>
          <p>Each mission validates real artifacts in the workspace.</p>
        </div>
      </div>
      <div className="mission-card-grid">
        {missions.map((mission, index) => (
          <article key={mission.title} className={mission.done ? "mission-card complete" : "mission-card"}>
            <div className="mission-number">{index + 1}</div>
            <h3>{mission.title}</h3>
            <p>{mission.criteria}</p>
            <button className={mission.done ? "ghost-button" : "primary-button"} onClick={() => go(mission.target)}>
              {mission.done ? <Check size={17} /> : <ArrowRight size={17} />}
              {mission.done ? "Review artifact" : "Go"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Frameworks({
  query,
  filter,
  setQuery,
  setFilter,
  onMap,
}: {
  query: string;
  filter: string;
  setQuery: (value: string) => void;
  setFilter: (value: string) => void;
  onMap: (control: (typeof frameworkControls)[number]) => void;
}) {
  const visible = frameworkControls.filter((control) => {
    const text = `${control.id} ${control.family} ${control.domain} ${control.title} ${control.objective}`.toLowerCase();
    return (filter === "All" || control.family === filter) && (!query || text.includes(query.toLowerCase()));
  });
  return (
    <section className="panel">
      <div className="framework-toolbar">
        <div className="searchbox standalone">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 566 generated framework practices" />
        </div>
        <label className="filter-select">
          <Filter size={15} />
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option>All</option>
            {frameworkFamilies.map((family) => (
              <option key={family.name}>{family.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="framework-family-grid">
        {frameworkFamilies.map((family) => (
          <button key={family.name} onClick={() => setFilter(family.name)} className={filter === family.name ? "selected" : ""}>
            <strong>{family.count}</strong>
            <span>{family.name}</span>
          </button>
        ))}
      </div>
      <div className="framework-list">
        {visible.slice(0, 90).map((control) => (
          <article key={`${control.family}-${control.id}`} className="framework-row">
            <div>
              <strong>{control.id}</strong>
              <h3>{control.title}</h3>
              <p>{control.objective}</p>
              <span>{control.family} / {control.domain}</span>
            </div>
            <button className="ghost-button" onClick={() => onMap(control)}>
              <Link2 size={16} />
              Map
            </button>
          </article>
        ))}
      </div>
      {visible.length > 90 ? <p className="list-note">Showing first 90 of {visible.length}. Refine search to narrow the control set.</p> : null}
    </section>
  );
}

function Glossary({ query }: { query: string }) {
  const visible = glossary.filter((item) => item.join(" ").toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="glossary-grid">
      {visible.map(([term, def, category]) => (
        <article key={term} className="glossary-card">
          <Badge value={category} />
          <h3>{term}</h3>
          <p>{def}</p>
        </article>
      ))}
    </section>
  );
}

function InterviewPrep({ data }: { data: GrcData }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Interview prep lab</h2>
          <p>Practice concise, evidence-backed answers using your workspace records.</p>
        </div>
      </div>
      <div className="question-grid">
        {interviewQuestions.map((question, index) => (
          <article key={question} className="question-card">
            <span>Q{index + 1}</span>
            <h3>{question}</h3>
            <p>{sampleInterviewAnswer(question, data)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AiCommand({
  data,
  prompt,
  setPrompt,
  answer,
  setAnswer,
}: {
  data: GrcData;
  prompt: string;
  setPrompt: (value: string) => void;
  answer: string;
  setAnswer: (value: string) => void;
}) {
  const runAdvisor = () => setAnswer(localCoach(prompt, data));
  return (
    <section className="panel ai-panel">
      <div className="panel-heading">
        <div>
          <h2>Local GRC command advisor</h2>
          <p>Rule-based coaching from your current records. No external API or data upload required.</p>
        </div>
      </div>
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      <div className="inline-actions">
        <button className="primary-button" onClick={runAdvisor}>
          <Sparkles size={17} />
          Analyze
        </button>
        <button className="ghost-button" onClick={() => setPrompt("Create a 30-day audit readiness plan from my current data.")}>
          30-day plan
        </button>
        <button className="ghost-button" onClick={() => setPrompt("Which risks exceed appetite and what evidence is missing?")}>
          Appetite gaps
        </button>
      </div>
      <pre className="coach-output">{answer || localCoach("summary", data)}</pre>
    </section>
  );
}

function Portfolio({
  data,
  profile,
  setProfile,
  exportReport,
}: {
  data: GrcData;
  profile: { name: string; email: string; linkedin: string; targetRole: string };
  setProfile: React.Dispatch<React.SetStateAction<{ name: string; email: string; linkedin: string; targetRole: string }>>;
  exportReport: () => void;
}) {
  const artifacts = [
    ["Risk register", data.risks.length],
    ["Control catalog", data.controls.length],
    ["Evidence library", data.evidence.length],
    ["Audit tests", data.controlTests.length],
    ["Findings", data.findings.length],
    ["Reports", data.requirements.length + data.policies.length],
  ];
  return (
    <section className="portfolio-layout">
      <article className="panel profile-panel">
        <h2>Candidate profile</h2>
        {Object.entries(profile).map(([key, value]) => (
          <label key={key}>
            <span>{key === "targetRole" ? "Target role" : key}</span>
            <input value={value} onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))} />
          </label>
        ))}
        <button className="primary-button" onClick={exportReport}>
          <Download size={17} />
          Download portfolio report
        </button>
      </article>
      <article className="panel portfolio-preview">
        <span className="eyebrow">Portfolio summary</span>
        <h2>{profile.name}</h2>
        <p>{profile.targetRole} portfolio built from a hands-on GRC practice workspace.</p>
        <div className="artifact-grid">
          {artifacts.map(([label, count]) => (
            <div key={String(label)}>
              <strong>{count}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <h3>Proof points</h3>
        <ul className="proof-list">
          <li>Built risk-to-control-to-evidence traceability across {data.risks.length} risks.</li>
          <li>Maintained {data.controls.length} controls mapped to framework requirements.</li>
          <li>Tracked {data.findings.length} audit finding(s) and {data.tasks.length} remediation task(s).</li>
          <li>Prepared export-ready executive report and JSON data pack.</li>
        </ul>
      </article>
    </section>
  );
}

function RiskMatrix({ data, compact = false }: { data: GrcData; compact?: boolean }) {
  const matrix = Array.from({ length: 5 }, (_, impactIndex) =>
    Array.from({ length: 5 }, (_, likelihoodIndex) => {
      const impact = 5 - impactIndex;
      const likelihood = likelihoodIndex + 1;
      return data.risks.filter((risk) => Number(risk.impact) === impact && Number(risk.likelihood) === likelihood);
    }),
  );
  return (
    <div className={compact ? "matrix compact" : "matrix"}>
      <div className="matrix-label y">Impact</div>
      <div className="matrix-grid">
        {matrix.flatMap((row, rowIndex) =>
          row.map((items, colIndex) => {
            const impact = 5 - rowIndex;
            const likelihood = colIndex + 1;
            const score = impact * likelihood;
            return (
              <div key={`${impact}-${likelihood}`} className={`matrix-cell risk-${riskClass(score)}`}>
                <strong>{score}</strong>
                <span>{items.length}</span>
              </div>
            );
          }),
        )}
      </div>
      <div className="matrix-label x">Likelihood</div>
    </div>
  );
}

function ControlMapping({ data }: { data: GrcData }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Control mapping</h2>
          <p>Every meaningful control should connect risk, framework, evidence and tests.</p>
        </div>
      </div>
      <div className="mapping-list">
        {data.controls.map((control) => {
          const risk = findById(data, "risks", control.riskId);
          const evidence = data.evidence.filter((item) => item.controlId === control.id);
          const tests = data.controlTests.filter((item) => item.controlId === control.id);
          return (
            <article key={control.id} className="mapping-row">
              <div>
                <strong>{control.id}</strong>
                <h3>{control.title}</h3>
                <p>{control.framework}</p>
              </div>
              <div className="mapping-chain">
                <span>{risk ? getDisplayName(risk) : "No risk"}</span>
                <ArrowRight size={16} />
                <span>{evidence.length} evidence</span>
                <ArrowRight size={16} />
                <span>{tests.length} tests</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ControlLifecycle({ data }: { data: GrcData }) {
  const stages = [
    ["Draft", data.controls.filter((c) => c.status === "Draft").length],
    ["Implemented", data.controls.filter((c) => c.status === "Implemented").length],
    ["Testing", data.controls.filter((c) => c.status === "Testing").length],
    ["Evidence Ready", data.controls.filter((c) => data.evidence.some((e) => e.controlId === c.id)).length],
    ["Accepted", data.controls.filter((c) => data.controlTests.some((t) => t.controlId === c.id && t.result === "Pass")).length],
  ];
  return (
    <section className="panel">
      <div className="flow-strip">
        {stages.map(([label, count], index) => (
          <div key={String(label)} className="flow-step">
            <strong>{count}</strong>
            <span>{label}</span>
            {index < stages.length - 1 ? <ArrowRight size={18} /> : null}
          </div>
        ))}
      </div>
      <div className="lifecycle-grid">
        {data.controls.map((control) => (
          <article key={control.id} className="lifecycle-card">
            <h3>{control.title}</h3>
            <p>{control.framework || "No framework mapping"}</p>
            <div className="lifecycle-bars">
              {["Designed", "Owned", "Evidence", "Tested"].map((label) => {
                const ok =
                  label === "Designed" ||
                  (label === "Owned" && Boolean(control.owner)) ||
                  (label === "Evidence" && data.evidence.some((e) => e.controlId === control.id)) ||
                  (label === "Tested" && data.controlTests.some((t) => t.controlId === control.id));
                return <span key={label} className={ok ? "ok" : ""}>{label}</span>;
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceScoring({ data }: { data: GrcData }) {
  return (
    <section className="evidence-grid">
      {data.evidence.map((item) => (
        <article key={item.id} className="evidence-card">
          <EvidenceScore item={item} />
          <h3>{item.title}</h3>
          <p>{getDisplayName(findById(data, "controls", item.controlId))}</p>
          <ul>
            <li className={item.controlId ? "ok" : ""}>Linked to a control</li>
            <li className={item.collectedAt ? "ok" : ""}>Collection date recorded</li>
            <li className={item.quality === "Strong" ? "ok" : ""}>Strong artifact quality</li>
            <li className={item.status === "Accepted" ? "ok" : ""}>Accepted by reviewer</li>
          </ul>
        </article>
      ))}
    </section>
  );
}

function StatementOfApplicability({ data }: { data: GrcData }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Statement of Applicability</h2>
          <p>Generated from controls and framework mappings in the catalog.</p>
        </div>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Control</th>
              <th>Framework</th>
              <th>Applicable</th>
              <th>Justification</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {data.controls.map((control) => (
              <tr key={control.id}>
                <td>{control.title}</td>
                <td>{control.framework || "Not mapped"}</td>
                <td><Badge value={control.riskId ? "Yes" : "Review"} /></td>
                <td>{control.riskId ? "Selected because a linked risk requires treatment." : "No risk link yet; applicability needs review."}</td>
                <td>{data.evidence.filter((item) => item.controlId === control.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AuditSimulator({ data, setData }: { data: GrcData; setData: React.Dispatch<React.SetStateAction<GrcData>> }) {
  const sampleSize = data.controls.reduce((sum, control) => {
    const frequency = String(control.frequency || "");
    if (frequency === "Continuous" || frequency === "Daily") return sum + 25;
    if (frequency === "Weekly") return sum + 8;
    if (frequency === "Monthly") return sum + 3;
    return sum + 2;
  }, 0);
  const launchAudit = () => {
    const audit: GrcRecord = {
      id: nextId("AUD", data.audits),
      title: "Generated readiness audit",
      owner: "GRC Lead",
      scope: `${data.controls.length} controls, target sample size ${sampleSize}`,
      status: "Planning",
      dueDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
    };
    setData((current) => ({
      ...current,
      audits: [audit, ...current.audits],
      activity: [{ id: `ACT-${Date.now()}`, message: "Generated readiness audit plan", at: new Date().toISOString().slice(0, 10), type: "audit" }, ...current.activity].slice(0, 40),
    }));
  };
  return (
    <section className="panel">
      <div className="audit-steps">
        {["Plan", "Scope", "Sample", "Fieldwork", "Report"].map((step, index) => (
          <div key={step}>
            <strong>{index + 1}</strong>
            <span>{step}</span>
          </div>
        ))}
      </div>
      <div className="sim-summary">
        <StatCard icon={ShieldCheck} label="Controls in scope" value={data.controls.length} tone="blue" />
        <StatCard icon={ClipboardList} label="Suggested samples" value={sampleSize} tone="amber" />
        <StatCard icon={Search} label="Open findings" value={data.findings.filter((f) => f.status !== "Closed").length} tone="red" />
      </div>
      <button className="primary-button" onClick={launchAudit}>
        <PlayCircle size={17} />
        Generate audit plan
      </button>
    </section>
  );
}

function ComplianceCalendar({ data }: { data: GrcData }) {
  return (
    <section className="panel">
      <Timeline items={dueItems(data)} />
    </section>
  );
}

function Traceability({ data }: { data: GrcData }) {
  return (
    <section className="panel">
      <div className="trace-list">
        {data.risks.map((risk) => {
          const controls = data.controls.filter((control) => control.riskId === risk.id);
          return (
            <article key={risk.id} className="trace-row">
              <div className="trace-root">
                <Badge value={riskLevel(getRiskScore(risk))} />
                <h3>{risk.title}</h3>
                <p>{getDisplayName(findById(data, "assets", risk.assetId))}</p>
              </div>
              <div className="trace-branches">
                {controls.length ? controls.map((control) => (
                  <div key={control.id} className="trace-branch">
                    <span>{control.title}</span>
                    <small>{data.evidence.filter((e) => e.controlId === control.id).length} evidence / {data.controlTests.filter((t) => t.controlId === control.id).length} tests</small>
                  </div>
                )) : <span className="missing">No linked control</span>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Reports({
  data,
  profile,
  exportJson,
  exportReport,
}: {
  data: GrcData;
  profile: { name: string; email: string; linkedin: string; targetRole: string };
  exportJson: () => void;
  exportReport: () => void;
}) {
  return (
    <section className="reports-layout">
      <article className="panel">
        <h2>Export center</h2>
        <p>Generate portable artifacts for review, study notes or portfolio use.</p>
        <div className="report-actions">
          <button className="primary-button" onClick={exportReport}>
            <FileText size={17} />
            Executive Markdown
          </button>
          <button className="ghost-button" onClick={exportJson}>
            <FileJson size={17} />
            Full JSON data
          </button>
          <button className="ghost-button" onClick={() => downloadFile("risk-register.csv", toCsv(data.risks), "text/csv")}>
            <Download size={17} />
            Risk CSV
          </button>
        </div>
      </article>
      <article className="panel markdown-preview">
        <pre>{buildMarkdownReport(data, profile)}</pre>
      </article>
    </section>
  );
}

function Projects({ data, go }: { data: GrcData; go: (tab: string) => void }) {
  const projectCards = [
    { title: "SOC 2 readiness", tab: "audits", count: data.audits.length, icon: ClipboardCheck },
    { title: "ISO 27001 ISMS build", tab: "soa", count: data.requirements.length, icon: Shield },
    { title: "Vendor assurance", tab: "vendorAssessments", count: data.vendorAssessments.length, icon: Building2 },
    { title: "Resilience planning", tab: "bcm", count: data.bcm.length + data.bia.length, icon: Route },
  ];
  return (
    <section className="project-grid">
      {projectCards.map((card) => (
        <article key={card.title} className="project-card">
          <card.icon size={22} />
          <h3>{card.title}</h3>
          <strong>{card.count}</strong>
          <p>Workspace artifacts linked to this project track.</p>
          <button className="ghost-button" onClick={() => go(card.tab)}>
            Open <ArrowRight size={16} />
          </button>
        </article>
      ))}
    </section>
  );
}

function Timeline({ items }: { items: Array<{ title: string; date: string; type: string; tab: string }> }) {
  if (!items.length) return <EmptyState icon={CalendarDays} title="No due dates yet" detail="Add review dates, audit deadlines or task due dates to populate the calendar." />;
  return (
    <div className="timeline">
      {items.map((item) => {
        const days = daysUntil(item.date);
        return (
          <div key={`${item.type}-${item.title}-${item.date}`} className="timeline-row">
            <div>
              <strong>{item.title}</strong>
              <small>{item.type}</small>
            </div>
            <Badge value={days === null ? item.date : days < 0 ? "Overdue" : `${days} days`} />
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="empty-state">
      <Icon size={28} />
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}

function dueItems(data: GrcData) {
  const rows: Array<{ title: string; date: string; type: string; tab: string }> = [];
  const push = (items: GrcRecord[], type: string, tab: string, field: string) => {
    items.forEach((item) => {
      const date = item[field];
      if (typeof date === "string" && date) rows.push({ title: getDisplayName(item), date, type, tab });
    });
  };
  push(data.tasks, "Task", "tasks", "dueDate");
  push(data.findings, "Finding", "findings", "dueDate");
  push(data.treatments, "Treatment", "treatments", "dueDate");
  push(data.audits, "Audit", "audits", "dueDate");
  push(data.policies, "Policy review", "policies", "reviewDate");
  push(data.vendors, "Vendor review", "vendors", "reviewDate");
  push(data.bcm, "BCM test", "bcm", "testDate");
  return rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function buildAdvisor(data: GrcData) {
  const items: Array<{ title: string; detail: string; tab: string; tone: string; icon: LucideIcon }> = [];
  if (!data.appetite.length) items.push({ title: "No appetite statements", detail: "Risk scoring has no decision boundary yet.", tab: "appetite", tone: "red", icon: Gauge });
  const risksWithoutControls = data.risks.filter((risk) => !data.controls.some((control) => control.riskId === risk.id));
  if (risksWithoutControls.length) items.push({ title: `${risksWithoutControls.length} risks lack controls`, detail: "Auditors will ask how these risks are reduced.", tab: "mapping", tone: "red", icon: AlertTriangle });
  const controlsWithoutEvidence = data.controls.filter((control) => !data.evidence.some((e) => e.controlId === control.id));
  if (controlsWithoutEvidence.length) items.push({ title: `${controlsWithoutEvidence.length} controls lack evidence`, detail: "Claims need proof before fieldwork starts.", tab: "evidence", tone: "amber", icon: FolderOpen });
  const untested = data.controls.filter((control) => !data.controlTests.some((test) => test.controlId === control.id));
  if (untested.length) items.push({ title: `${untested.length} controls untested`, detail: "Operating effectiveness is not validated.", tab: "controlTests", tone: "amber", icon: ClipboardList });
  if (data.findings.some((finding) => finding.status !== "Closed")) items.push({ title: "Open findings", detail: "Track remediation owners and deadlines.", tab: "findings", tone: "red", icon: Search });
  if (!items.length) items.push({ title: "Program looks healthy", detail: "Export a report or start an audit simulation.", tab: "reports", tone: "green", icon: BadgeCheck });
  return items.slice(0, 5);
}

function sampleInterviewAnswer(question: string, data: GrcData) {
  if (question.includes("risk appetite")) return `I would describe it as the boundary for risk decisions. In this lab, ${data.appetite.length} appetite statement(s) set tolerance scores that risk owners can compare against.`;
  if (question.includes("evidence")) return `I would ask for dated exports, screenshots, tickets or logs tied to the exact control. This workspace has ${data.evidence.length} evidence item(s) linked to controls.`;
  if (question.includes("vendor")) return `I would consider data sensitivity, business dependency, substitutability and assurance history. Current critical vendors: ${data.vendors.filter((v) => v.criticality === "Critical").length}.`;
  if (question.includes("risk statement")) return "I use the pattern: threat exploits vulnerability causing business impact to a named asset or process.";
  return "A strong answer names the objective, the artifact you would inspect, the decision threshold and the remediation owner.";
}

function localCoach(prompt: string, data: GrcData) {
  const advisor = buildAdvisor(data);
  const overAppetite = data.risks.filter((risk) => {
    const appetite = data.appetite.find((item) => item.category === risk.category);
    return appetite && getRiskScore(risk) > Number(appetite.tolerance || 0);
  });
  return [
    `Prompt: ${prompt}`,
    "",
    "Priority actions:",
    ...advisor.map((item, index) => `${index + 1}. ${item.title} - ${item.detail}`),
    "",
    `Risks over appetite: ${overAppetite.length}`,
    ...overAppetite.slice(0, 3).map((risk) => `- ${risk.id}: ${risk.title} (${getRiskScore(risk)})`),
    "",
    "30-day plan:",
    "Week 1: close risk/control mapping gaps and assign owners.",
    "Week 2: collect dated evidence for high-risk controls.",
    "Week 3: test operating effectiveness and document exceptions.",
    "Week 4: resolve findings, export the executive report and portfolio packet.",
  ].join("\n");
}

function buildMarkdownReport(data: GrcData, profile: { name: string; email: string; linkedin: string; targetRole: string }) {
  const metrics = buildMetrics(data);
  return `# GRC Practice Lab Executive Report

Prepared by: ${profile.name} (${profile.targetRole})
Contact: ${profile.email}${profile.linkedin ? ` / ${profile.linkedin}` : ""}

## Program Snapshot

- Program health: ${metrics.overall}%
- Assets: ${data.assets.length}
- Risks: ${data.risks.length} (${metrics.critical} critical, ${metrics.high} high)
- Controls: ${data.controls.length}
- Evidence coverage: ${metrics.evidenceCoverage}%
- Test coverage: ${metrics.testCoverage}%
- Open findings: ${metrics.openFindings}

## Top Risks

${data.risks
  .slice()
  .sort((a, b) => getRiskScore(b) - getRiskScore(a))
  .slice(0, 5)
  .map((risk) => `- ${risk.id}: ${risk.title} - score ${getRiskScore(risk)} (${riskLevel(getRiskScore(risk))})`)
  .join("\n")}

## Control Assurance

${data.controls
  .map((control) => {
    const evidence = data.evidence.filter((item) => item.controlId === control.id).length;
    const tests = data.controlTests.filter((item) => item.controlId === control.id).length;
    return `- ${control.id}: ${control.title} | ${control.framework || "No framework"} | ${evidence} evidence | ${tests} tests`;
  })
  .join("\n")}

## Audit Readiness Notes

${buildAdvisor(data)
  .map((item) => `- ${item.title}: ${item.detail}`)
  .join("\n")}
`;
}

function toCsv(rows: GrcRecord[]) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
