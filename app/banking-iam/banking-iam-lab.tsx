"use client";

import { AlertTriangle, CheckCircle2, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type RiskTier = "Low" | "Medium" | "High" | "Critical";
type AccountStatus = "Pending Activation" | "Active" | "Suspended" | "Deactivated";
type RequestStatus = "Submitted" | "Approved" | "Rejected" | "Provisioned";
type RequestType = "Onboarding" | "Role Change" | "Transfer" | "Emergency" | "Termination";
type RoleId =
  | "READ_ONLY"
  | "CUSTOMER_SERVICE"
  | "BRANCH_TELLER"
  | "RELATIONSHIP_MANAGER"
  | "CREDIT_ANALYST"
  | "CREDIT_APPROVER"
  | "PAYMENTS_MAKER"
  | "PAYMENTS_CHECKER"
  | "TREASURY_OPERATIONS"
  | "COMPLIANCE_OFFICER"
  | "AML_ANALYST"
  | "RISK_OFFICER"
  | "INTERNAL_AUDITOR"
  | "IT_HELPDESK"
  | "IAM_REQUESTER"
  | "IAM_APPROVER"
  | "IAM_PROVISIONER"
  | "SECURITY_ADMIN"
  | "CORE_BANKING_ADMIN";

type RoleDef = {
  id: RoleId;
  label: string;
  domain: string;
  risk: RiskTier;
  scope: string;
};

type UserAccount = {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  branch: string;
  manager: string;
  jobTitle: string;
  status: AccountStatus;
  roles: RoleId[];
  lastReview: string;
};

type AccessRequest = {
  id: string;
  targetUserId: string;
  requester: string;
  type: RequestType;
  roles: RoleId[];
  justification: string;
  status: RequestStatus;
  approver: string;
  provisioner: string;
  createdAt: string;
  dueDate: string;
};

type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  details: string;
};

type IamState = {
  users: UserAccount[];
  requests: AccessRequest[];
  audit: AuditEvent[];
};

type UserForm = {
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  branch: string;
  manager: string;
  jobTitle: string;
};

type RequestForm = {
  targetUserId: string;
  requester: string;
  type: RequestType;
  dueDate: string;
  justification: string;
};

const STORAGE_KEY = "grc-practice-lab:banking-iam:v1";
const riskOrder: Record<RiskTier, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

const roles: RoleDef[] = [
  { id: "READ_ONLY", label: "Read-only reviewer", domain: "General", risk: "Low", scope: "View reports and non-sensitive evidence." },
  { id: "CUSTOMER_SERVICE", label: "Customer service officer", domain: "Contact Center", risk: "Medium", scope: "View and maintain customer service information." },
  { id: "BRANCH_TELLER", label: "Branch teller", domain: "Branch", risk: "High", scope: "Post branch transactions without approval authority." },
  { id: "RELATIONSHIP_MANAGER", label: "Relationship manager", domain: "Business", risk: "High", scope: "Manage customer relationships and submit credit packages." },
  { id: "CREDIT_ANALYST", label: "Credit analyst", domain: "Credit", risk: "High", scope: "Analyze credit files without approval authority." },
  { id: "CREDIT_APPROVER", label: "Credit approver", domain: "Credit", risk: "Critical", scope: "Approve loans within delegated authority." },
  { id: "PAYMENTS_MAKER", label: "Payments maker", domain: "Payments", risk: "High", scope: "Create payments and upload payment batches." },
  { id: "PAYMENTS_CHECKER", label: "Payments checker", domain: "Payments", risk: "Critical", scope: "Authorize or reject payments created by makers." },
  { id: "TREASURY_OPERATIONS", label: "Treasury operations", domain: "Treasury", risk: "Critical", scope: "Process treasury settlement and reconciliation." },
  { id: "COMPLIANCE_OFFICER", label: "Compliance officer", domain: "Compliance", risk: "High", scope: "Manage compliance cases and evidence." },
  { id: "AML_ANALYST", label: "AML analyst", domain: "Financial Crime", risk: "High", scope: "Review AML alerts and suspicious activity." },
  { id: "RISK_OFFICER", label: "Risk officer", domain: "Risk", risk: "High", scope: "View risk reports, KRI and control gaps." },
  { id: "INTERNAL_AUDITOR", label: "Internal auditor", domain: "Audit", risk: "High", scope: "Independent access review and audit evidence export." },
  { id: "IT_HELPDESK", label: "IT helpdesk", domain: "Technology", risk: "Medium", scope: "Unlock users and reset credentials after verification." },
  { id: "IAM_REQUESTER", label: "IAM requester", domain: "IAM", risk: "Medium", scope: "Create account shells and submit access requests." },
  { id: "IAM_APPROVER", label: "IAM approver", domain: "IAM", risk: "High", scope: "Approve or reject requests after business and SoD review." },
  { id: "IAM_PROVISIONER", label: "IAM provisioner", domain: "IAM", risk: "Critical", scope: "Provision approved roles and deactivate accounts." },
  { id: "SECURITY_ADMIN", label: "Security administrator", domain: "Security", risk: "Critical", scope: "Manage security policy and emergency disablement." },
  { id: "CORE_BANKING_ADMIN", label: "Core banking administrator", domain: "Core Banking", risk: "Critical", scope: "Administer sensitive core banking configuration." },
];

const sodRules: Array<{ a: RoleId; b: RoleId; reason: string }> = [
  { a: "PAYMENTS_MAKER", b: "PAYMENTS_CHECKER", reason: "maker-checker for payments" },
  { a: "CREDIT_ANALYST", b: "CREDIT_APPROVER", reason: "credit analysis and approval must be separated" },
  { a: "RELATIONSHIP_MANAGER", b: "CREDIT_APPROVER", reason: "relationship owner should not approve own portfolio" },
  { a: "IAM_APPROVER", b: "IAM_PROVISIONER", reason: "approval and provisioning must be independent" },
  { a: "SECURITY_ADMIN", b: "CORE_BANKING_ADMIN", reason: "security admin and core admin are separated" },
  { a: "INTERNAL_AUDITOR", b: "BRANCH_TELLER", reason: "auditor cannot operate branch transactions" },
  { a: "INTERNAL_AUDITOR", b: "PAYMENTS_MAKER", reason: "auditor cannot create payments" },
  { a: "INTERNAL_AUDITOR", b: "PAYMENTS_CHECKER", reason: "auditor cannot authorize payments" },
  { a: "INTERNAL_AUDITOR", b: "IAM_PROVISIONER", reason: "auditor cannot provision access" },
  { a: "INTERNAL_AUDITOR", b: "CORE_BANKING_ADMIN", reason: "auditor cannot administer audited systems" },
];

const roleMap = new Map<RoleId, RoleDef>(roles.map((role) => [role.id, role]));
const departments = ["Branch Operations", "Credit", "Payments", "Treasury", "Compliance", "Risk", "Internal Audit", "Technology", "IAM"];
const requestTypes: RequestType[] = ["Onboarding", "Role Change", "Transfer", "Emergency", "Termination"];

const sampleState: IamState = {
  users: [
    {
      id: "USR-001",
      employeeId: "BNK-1001",
      fullName: "Nguyen Minh Anh",
      email: "minh.anh@examplebank.local",
      department: "Branch Operations",
      branch: "HN001",
      manager: "Tran Branch Manager",
      jobTitle: "Branch Teller",
      status: "Active",
      roles: ["BRANCH_TELLER"],
      lastReview: "2026-06-15",
    },
    {
      id: "USR-002",
      employeeId: "BNK-2042",
      fullName: "Le Quoc Bao",
      email: "quoc.bao@examplebank.local",
      department: "Payments",
      branch: "HO",
      manager: "Payments Lead",
      jobTitle: "Payments Operator",
      status: "Active",
      roles: ["PAYMENTS_CHECKER"],
      lastReview: "2026-06-20",
    },
    {
      id: "USR-003",
      employeeId: "BNK-3108",
      fullName: "Pham Thu Ha",
      email: "thu.ha@examplebank.local",
      department: "IAM",
      branch: "HO",
      manager: "IAM Manager",
      jobTitle: "IAM Provisioner",
      status: "Active",
      roles: ["IAM_PROVISIONER"],
      lastReview: "2026-06-10",
    },
  ],
  requests: [
    {
      id: "REQ-001",
      targetUserId: "USR-003",
      requester: "IAM Manager",
      type: "Role Change",
      roles: ["SECURITY_ADMIN"],
      justification: "Temporary security incident support for privileged disablement.",
      status: "Submitted",
      approver: "",
      provisioner: "",
      createdAt: "2026-06-27",
      dueDate: "2026-07-02",
    },
  ],
  audit: [
    { id: "AUD-001", at: "2026-06-27 09:30", actor: "IAM Manager", action: "Submitted access request", details: "REQ-001 submitted for BNK-3108." },
  ],
};

const emptyUserForm: UserForm = {
  employeeId: "",
  fullName: "",
  email: "",
  department: "Branch Operations",
  branch: "HN001",
  manager: "",
  jobTitle: "",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function nextId(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}

function label(role: RoleId): string {
  return roleMap.get(role)?.label ?? role;
}

function risk(role: RoleId): RiskTier {
  return roleMap.get(role)?.risk ?? "Medium";
}

function unique(nextRoles: RoleId[]): RoleId[] {
  return Array.from(new Set(nextRoles));
}

function highestRisk(nextRoles: RoleId[]): RiskTier {
  return nextRoles.map(risk).sort((left, right) => riskOrder[right] - riskOrder[left])[0] ?? "Low";
}

function conflicts(existing: RoleId[], requested: RoleId[]): string[] {
  const all = new Set([...existing, ...requested]);
  return sodRules
    .filter((rule) => all.has(rule.a) && all.has(rule.b))
    .map((rule) => `${label(rule.a)} + ${label(rule.b)} violates ${rule.reason}.`);
}

function Badge({ value }: { value: string }) {
  const tone = value.includes("Critical") || value.includes("Rejected") || value.includes("Deactivated")
    ? "border-red-200 bg-red-50 text-red-700"
    : value.includes("High") || value.includes("Submitted") || value.includes("Pending")
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : value.includes("Active") || value.includes("Approved") || value.includes("Provisioned")
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-slate-200 bg-slate-50 text-slate-700";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${tone}`}>{value}</span>;
}

function Metric({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

export default function BankingIamLab() {
  const [state, setState] = useState<IamState>(sampleState);
  const [loaded, setLoaded] = useState(false);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [requestForm, setRequestForm] = useState<RequestForm>({
    targetUserId: sampleState.users[0].id,
    requester: "IAM Requester",
    type: "Role Change",
    dueDate: daysFromNow(5),
    justification: "",
  });
  const [selectedRoles, setSelectedRoles] = useState<RoleId[]>(["READ_ONLY"]);
  const [message, setMessage] = useState("Ready: banking IAM maker-checker and SoD controls are enabled.");
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as IamState;
        if (Array.isArray(parsed.users) && Array.isArray(parsed.requests) && Array.isArray(parsed.audit)) {
          setState(parsed);
          setRequestForm((current) => ({ ...current, targetUserId: parsed.users[0]?.id ?? "" }));
        }
      }
    } catch {
      setMessage("Could not load local IAM workspace; sample data is being used.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [loaded, state]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return state.users;
    return state.users.filter((user) => [user.employeeId, user.fullName, user.email, user.department, user.branch].join(" ").toLowerCase().includes(keyword));
  }, [search, state.users]);

  const pendingRequests = state.requests.filter((request) => request.status === "Submitted" || request.status === "Approved");
  const criticalUsers = state.users.filter((user) => highestRisk(user.roles) === "Critical");
  const sodAlerts = state.users.flatMap((user) => conflicts([], user.roles).map((text) => `${user.employeeId}: ${text}`));
  const targetUser = state.users.find((user) => user.id === requestForm.targetUserId);
  const requestConflicts = targetUser ? conflicts(targetUser.roles, selectedRoles) : [];

  function audit(actor: string, action: string, details: string): AuditEvent {
    return { id: nextId("AUD", state.audit.length), at: timestamp(), actor, action, details };
  }

  function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const employeeId = userForm.employeeId.trim().toUpperCase();
    if (!employeeId || !userForm.fullName.trim() || !userForm.email.trim()) {
      setMessage("Employee ID, full name and email are required.");
      return;
    }
    if (state.users.some((user) => user.employeeId === employeeId)) {
      setMessage(`Employee ID ${employeeId} already exists.`);
      return;
    }
    const user: UserAccount = {
      id: nextId("USR", state.users.length),
      employeeId,
      fullName: userForm.fullName.trim(),
      email: userForm.email.trim().toLowerCase(),
      department: userForm.department,
      branch: userForm.branch.trim() || "HO",
      manager: userForm.manager.trim() || "Unassigned",
      jobTitle: userForm.jobTitle.trim() || "Bank employee",
      status: "Pending Activation",
      roles: [],
      lastReview: "",
    };
    const entry = audit("IAM Requester", "Created account shell", `Created ${employeeId} without direct role assignment.`);
    setState((current) => ({ ...current, users: [user, ...current.users], audit: [entry, ...current.audit] }));
    setUserForm(emptyUserForm);
    setRequestForm((current) => ({ ...current, targetUserId: user.id }));
    setMessage(`Created pending account for ${user.fullName}. Submit an approved request to assign roles.`);
  }

  function toggleRole(roleId: RoleId) {
    setSelectedRoles((current) => (current.includes(roleId) ? current.filter((role) => role !== roleId) : [...current, roleId]));
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const user = state.users.find((item) => item.id === requestForm.targetUserId);
    if (!user || selectedRoles.length === 0 || !requestForm.justification.trim()) {
      setMessage("Select target user, at least one role and a business justification.");
      return;
    }
    const blocked = conflicts(user.roles, selectedRoles);
    if (blocked.length > 0) {
      setMessage(`SoD blocked: ${blocked[0]}`);
      return;
    }
    const request: AccessRequest = {
      id: nextId("REQ", state.requests.length),
      targetUserId: user.id,
      requester: requestForm.requester.trim() || "IAM Requester",
      type: requestForm.type,
      roles: unique(selectedRoles),
      justification: requestForm.justification.trim(),
      status: "Submitted",
      approver: "",
      provisioner: "",
      createdAt: today(),
      dueDate: requestForm.dueDate || daysFromNow(5),
    };
    const entry = audit(request.requester, "Submitted access request", `${request.id} for ${user.employeeId}.`);
    setState((current) => ({ ...current, requests: [request, ...current.requests], audit: [entry, ...current.audit] }));
    setSelectedRoles(["READ_ONLY"]);
    setRequestForm((current) => ({ ...current, justification: "", dueDate: daysFromNow(5) }));
    setMessage(`${request.id} submitted. Approval and provisioning must be performed independently.`);
  }

  function approve(requestId: string) {
    const request = state.requests.find((item) => item.id === requestId);
    const user = request ? state.users.find((item) => item.id === request.targetUserId) : undefined;
    if (!request || !user || request.status !== "Submitted") return;
    const blocked = conflicts(user.roles, request.roles);
    if (blocked.length > 0) {
      setMessage(`Approval blocked by SoD: ${blocked[0]}`);
      return;
    }
    const entry = audit("IAM Approver", "Approved access request", `${requestId} approved after business and SoD review.`);
    setState((current) => ({
      ...current,
      requests: current.requests.map((item) => (item.id === requestId ? { ...item, status: "Approved", approver: "IAM Approver" } : item)),
      audit: [entry, ...current.audit],
    }));
    setMessage(`${requestId} approved. Provisioning is still required.`);
  }

  function reject(requestId: string) {
    const entry = audit("IAM Approver", "Rejected access request", `${requestId} rejected during access review.`);
    setState((current) => ({
      ...current,
      requests: current.requests.map((item) => (item.id === requestId && item.status !== "Provisioned" ? { ...item, status: "Rejected", approver: "IAM Approver" } : item)),
      audit: [entry, ...current.audit],
    }));
    setMessage(`${requestId} rejected and kept in audit evidence.`);
  }

  function provision(requestId: string) {
    const request = state.requests.find((item) => item.id === requestId);
    const user = request ? state.users.find((item) => item.id === request.targetUserId) : undefined;
    if (!request || !user || request.status !== "Approved") return;
    const blocked = conflicts(user.roles, request.roles);
    if (blocked.length > 0) {
      setMessage(`Provisioning blocked by SoD: ${blocked[0]}`);
      return;
    }
    const nextRoles = unique([...user.roles, ...request.roles]);
    const entry = audit("IAM Provisioner", "Provisioned approved access", `${requestId} roles assigned to ${user.employeeId}.`);
    setState((current) => ({
      ...current,
      users: current.users.map((item) => (item.id === user.id ? { ...item, roles: nextRoles, status: "Active" } : item)),
      requests: current.requests.map((item) => (item.id === requestId ? { ...item, status: "Provisioned", provisioner: "IAM Provisioner" } : item)),
      audit: [entry, ...current.audit],
    }));
    setMessage(`${requestId} provisioned for ${user.employeeId}.`);
  }

  function revoke(userId: string, roleId: RoleId) {
    const user = state.users.find((item) => item.id === userId);
    if (!user) return;
    const entry = audit("IAM Provisioner", "Revoked role", `${label(roleId)} removed from ${user.employeeId}.`);
    setState((current) => ({
      ...current,
      users: current.users.map((item) => (item.id === userId ? { ...item, roles: item.roles.filter((role) => role !== roleId) } : item)),
      audit: [entry, ...current.audit],
    }));
    setMessage(`${label(roleId)} revoked from ${user.employeeId}.`);
  }

  function recertify(userId: string) {
    const user = state.users.find((item) => item.id === userId);
    if (!user) return;
    const entry = audit("Access Reviewer", "Completed access recertification", `${user.employeeId} reviewed on ${today()}.`);
    setState((current) => ({
      ...current,
      users: current.users.map((item) => (item.id === userId ? { ...item, lastReview: today() } : item)),
      audit: [entry, ...current.audit],
    }));
    setMessage(`${user.employeeId} marked as reviewed.`);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <a className="text-sm font-bold text-blue-700" href="/">Back to GRC dashboard</a>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700"><ShieldCheck size={16} /> Banking IAM Lab</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">Quản lý và cấp tài khoản ngân hàng</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Tạo account shell, gửi yêu cầu cấp quyền, phê duyệt độc lập, provision role, kiểm soát SoD và lưu audit trail bằng localStorage.</p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50" type="button" onClick={() => { setState(sampleState); setMessage("Demo data restored."); }}>
              <RefreshCw size={18} /> Reset demo
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Tài khoản" value={state.users.length} helper="Workforce accounts" />
          <Metric label="Yêu cầu chờ xử lý" value={pendingRequests.length} helper="Submitted or approved" />
          <Metric label="User quyền Critical" value={criticalUsers.length} helper="Holding critical roles" />
          <Metric label="SoD alerts" value={sodAlerts.length} helper="Detected on active accounts" />
        </section>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-900">{message}</div>
        {sodAlerts.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            <div className="flex gap-2"><AlertTriangle size={18} /> {sodAlerts[0]}</div>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={createUser}>
            <h2 className="text-xl font-black">Tạo hồ sơ tài khoản</h2>
            <p className="mt-1 text-sm text-slate-500">Không cấp role trực tiếp ở bước này.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={userForm.employeeId} onChange={(event) => setUserForm((current) => ({ ...current, employeeId: event.target.value }))} placeholder="Employee ID" />
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={userForm.fullName} onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))} placeholder="Full name" />
              <input className="rounded-xl border border-slate-300 px-3 py-2 md:col-span-2" type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} placeholder="user@examplebank.local" />
              <select className="rounded-xl border border-slate-300 px-3 py-2" value={userForm.department} onChange={(event) => setUserForm((current) => ({ ...current, department: event.target.value }))}>{departments.map((department) => <option key={department}>{department}</option>)}</select>
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={userForm.branch} onChange={(event) => setUserForm((current) => ({ ...current, branch: event.target.value }))} placeholder="Branch / unit" />
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={userForm.jobTitle} onChange={(event) => setUserForm((current) => ({ ...current, jobTitle: event.target.value }))} placeholder="Job title" />
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={userForm.manager} onChange={(event) => setUserForm((current) => ({ ...current, manager: event.target.value }))} placeholder="Manager" />
            </div>
            <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800" type="submit"><Plus size={18} /> Create account shell</button>
          </form>

          <form className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={submitRequest}>
            <h2 className="text-xl font-black">Yêu cầu cấp quyền</h2>
            <p className="mt-1 text-sm text-slate-500">SoD được kiểm tra trước khi gửi, duyệt và provision.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <select className="rounded-xl border border-slate-300 px-3 py-2" value={requestForm.targetUserId} onChange={(event) => setRequestForm((current) => ({ ...current, targetUserId: event.target.value }))}>{state.users.map((user) => <option key={user.id} value={user.id}>{user.employeeId} - {user.fullName}</option>)}</select>
              <select className="rounded-xl border border-slate-300 px-3 py-2" value={requestForm.type} onChange={(event) => setRequestForm((current) => ({ ...current, type: event.target.value as RequestType }))}>{requestTypes.map((type) => <option key={type}>{type}</option>)}</select>
              <input className="rounded-xl border border-slate-300 px-3 py-2" value={requestForm.requester} onChange={(event) => setRequestForm((current) => ({ ...current, requester: event.target.value }))} placeholder="Requester" />
              <input className="rounded-xl border border-slate-300 px-3 py-2" type="date" value={requestForm.dueDate} onChange={(event) => setRequestForm((current) => ({ ...current, dueDate: event.target.value }))} />
            </div>
            <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
              {roles.map((role) => (
                <label className="flex gap-2 rounded-xl bg-white p-3 text-sm" key={role.id}>
                  <input checked={selectedRoles.includes(role.id)} type="checkbox" onChange={() => toggleRole(role.id)} />
                  <span><strong>{role.label}</strong><span className="block text-xs text-slate-500">{role.domain} · {role.risk}</span></span>
                </label>
              ))}
            </div>
            {requestConflicts.length > 0 && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">Blocked: {requestConflicts[0]}</p>}
            <textarea className="mt-4 min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2" value={requestForm.justification} onChange={(event) => setRequestForm((current) => ({ ...current, justification: event.target.value }))} placeholder="Business justification, scope, system and duration..." />
            <button className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800" type="submit"><CheckCircle2 size={18} /> Submit request</button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Access request queue</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Request</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">Roles</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th></tr></thead>
              <tbody>
                {state.requests.map((request) => {
                  const user = state.users.find((item) => item.id === request.targetUserId);
                  return (
                    <tr className="bg-slate-50 align-top" key={request.id}>
                      <td className="rounded-l-2xl px-3 py-3"><strong>{request.id}</strong><p className="text-xs text-slate-500">{request.type} · due {request.dueDate}</p></td>
                      <td className="px-3 py-3"><strong>{user?.employeeId}</strong><p className="text-xs text-slate-500">{user?.fullName}</p></td>
                      <td className="px-3 py-3"><div className="flex max-w-lg flex-wrap gap-1">{request.roles.map((role) => <Badge key={role} value={label(role)} />)}</div></td>
                      <td className="px-3 py-3"><Badge value={request.status} /></td>
                      <td className="rounded-r-2xl px-3 py-3"><div className="flex flex-wrap gap-2">
                        <button className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-black text-green-700 disabled:opacity-40" disabled={request.status !== "Submitted"} type="button" onClick={() => approve(request.id)}>Approve</button>
                        <button className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 disabled:opacity-40" disabled={request.status !== "Approved"} type="button" onClick={() => provision(request.id)}>Provision</button>
                        <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-40" disabled={request.status === "Provisioned" || request.status === "Rejected"} type="button" onClick={() => reject(request.id)}>Reject</button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><h2 className="text-xl font-black">User access inventory</h2><input className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" /></div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {filteredUsers.map((user) => (
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5" key={user.id}>
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wide text-slate-500">{user.employeeId}</p><h3 className="text-lg font-black text-slate-950">{user.fullName}</h3><p className="text-sm text-slate-500">{user.jobTitle} · {user.department} · {user.branch}</p></div><Badge value={user.status} /></div>
                  <div className="mt-3 flex flex-wrap gap-2"><Badge value={highestRisk(user.roles)} /><Badge value={`Review: ${user.lastReview || "Not reviewed"}`} /></div>
                  <div className="mt-4 space-y-2">{user.roles.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm font-semibold text-slate-500">No active roles.</p> : user.roles.map((role) => <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 text-sm" key={role}><div><strong>{label(role)}</strong><p className="text-xs text-slate-500">{roleMap.get(role)?.scope}</p></div><button className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-bold text-red-700" type="button" onClick={() => revoke(user.id, role)}><Trash2 size={14} /> Revoke</button></div>)}</div>
                  <button className="mt-4 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700" type="button" onClick={() => recertify(user.id)}>Mark reviewed</button>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black">Role catalogue and audit trail</h2>
            <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
              {roles.map((role) => <div className="rounded-2xl border border-slate-200 p-4" key={role.id}><div className="flex items-start justify-between gap-3"><div><strong>{role.label}</strong><p className="text-xs text-slate-500">{role.domain}</p></div><Badge value={role.risk} /></div><p className="mt-2 text-sm text-slate-600">{role.scope}</p></div>)}
            </div>
            <h3 className="mt-6 font-black">Recent audit events</h3>
            <div className="mt-3 space-y-3">{state.audit.slice(0, 8).map((entry) => <div className="rounded-2xl bg-slate-50 p-4 text-sm" key={entry.id}><div className="flex justify-between gap-3"><strong>{entry.action}</strong><span className="text-xs text-slate-500">{entry.at}</span></div><p className="mt-1 text-slate-600">{entry.details}</p><p className="mt-1 text-xs font-bold text-slate-500">Actor: {entry.actor}</p></div>)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
