# Banking account and access management lab

This feature adds a browser-based practice module for managing workforce accounts and role provisioning in a banking environment.

## Control objectives

- Create account shells without assigning business roles directly.
- Submit access requests with business justification, due date and requested roles.
- Enforce maker-checker and four-eyes controls across request, approval and provisioning.
- Block common segregation-of-duties conflicts before approval or provisioning.
- Maintain a role catalogue with banking-specific access scopes and risk tiers.
- Keep an audit trail for account creation, approval, provisioning, revocation and recertification.

## Banking role catalogue

The lab includes roles for branch, credit, payments, treasury, compliance, AML, risk, internal audit, IT helpdesk, IAM and privileged technology administration.

Examples:

- `BRANCH_TELLER`: branch transaction posting without approval authority.
- `CREDIT_ANALYST`: credit file review without loan approval authority.
- `CREDIT_APPROVER`: loan approval authority with critical risk tier.
- `PAYMENTS_MAKER`: payment initiation.
- `PAYMENTS_CHECKER`: independent payment authorization.
- `IAM_REQUESTER`: access request creation.
- `IAM_APPROVER`: access approval after business and SoD review.
- `IAM_PROVISIONER`: role provisioning after approval.
- `INTERNAL_AUDITOR`: independent audit and access review.
- `CORE_BANKING_ADMIN`: privileged core banking administration.

## Segregation-of-duties rules

The module blocks these role combinations:

- Payments maker + payments checker.
- Credit analyst + credit approver.
- Relationship manager + credit approver.
- IAM approver + IAM provisioner.
- Security administrator + core banking administrator.
- Internal auditor with sensitive operating or provisioning roles.

## Workflow

```text
Account shell created
  -> Access request submitted
  -> IAM approver approves or rejects
  -> IAM provisioner provisions approved roles
  -> Access reviewer periodically recertifies active users
```

Requests that are rejected or provisioned remain visible as audit evidence.

## Running the module

Run the application and open `/banking-iam`.

```bash
npm install
npm run dev
```

The lab uses localStorage, so it is safe for practice and does not require a backend database. Use **Reset demo** to restore sample users, requests and audit events.

## Production hardening notes

For a real bank, this browser lab should be replaced or integrated with:

- Central IAM/IdP such as Entra ID, Okta, Keycloak or an internal IAM platform.
- Ticketing and approval evidence retention.
- Immutable audit logging and SIEM integration.
- MFA, PAM and just-in-time privileged access.
- Policy-as-code checks for SoD, location, system criticality and data classification.
- Automated joiner-mover-leaver feeds from HR.
- Periodic recertification by role risk tier and business owner.
- Emergency access with expiry and post-use review.
