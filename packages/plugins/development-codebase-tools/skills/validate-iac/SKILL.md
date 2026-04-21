---
description: Validate and lint Infrastructure as Code (IaC) configurations. Use when user says "check my Terraform for issues", "lint my IaC configs", "validate my infrastructure code", "scan my Terraform for security misconfigurations", "run checkov on my infrastructure", "are there any problems with my Helm charts", "validate my CDK stack", or "check my CloudFormation templates".
allowed-tools: Read, Glob, Grep, Bash(terraform:*), Bash(tflint:*), Bash(checkov:*), Bash(trivy:*), Bash(helm:*), Bash(which:*)
model: sonnet
---

# IaC Validator

Detect, validate, and security-scan Infrastructure as Code configurations across Terraform, CDK, Helm, CloudFormation, Pulumi, and Bicep.

## When to Activate

- User asks to validate, lint, or check IaC files
- User mentions Terraform, CDK, Helm, CloudFormation, Pulumi, or Bicep
- User wants to find security misconfigurations before deploying
- Pre-deploy review of infrastructure changes
- CI/CD integration check for IaC quality gates

## Step 1: Detect IaC Types

Scan the repository to identify which IaC frameworks are in use:

```
IaC Type         | Indicator Files
-----------------|----------------------------------
Terraform        | **/*.tf, **/*.tfvars
AWS CDK          | cdk.json, cdk.out/
CloudFormation   | **/*template*.yaml, **/*cloudformation*.yaml, **/*.cfn.yaml
Helm             | Chart.yaml, **/templates/*.yaml
Pulumi           | Pulumi.yaml, Pulumi.*.yaml
Bicep            | **/*.bicep
Kubernetes       | **/*deployment*.yaml, **/*service*.yaml (with apiVersion)
Dockerfile       | Dockerfile, **/Dockerfile.*
```

Use `Glob` and `Grep` to find indicator files. Report what IaC types were detected before proceeding.

For Terraform, collect the unique set of directories containing `.tf` files — you will need these in Step 3.

## Step 2: Check Available Validators

Run `which <tool>` to confirm which validators are installed:

| Tool        | Covers                                          | Install                  |
| ----------- | ----------------------------------------------- | ------------------------ |
| `terraform` | Terraform syntax + provider validation          | `brew install terraform` |
| `tflint`    | Terraform best practices + cloud provider rules | `brew install tflint`    |
| `checkov`   | Terraform, CFN, CDK, K8s, Helm, Dockerfile, GHA | `pip install checkov`    |
| `trivy`     | Terraform, CFN, K8s, Helm, Dockerfile           | `brew install trivy`     |
| `helm`      | Helm chart structure + template rendering       | `brew install helm`      |

Only run validators that are available. Report which validators will run before executing them.

## Step 3: Run Validators

Execute each available validator against the detected IaC files. Use output flags to get machine-readable results where possible.

### Terraform

```bash
# Syntax validation — run per Terraform directory (requires init first if .terraform/ absent).
# Use terraform -chdir to validate each directory identified in Step 1:
terraform -chdir="<tf_dir>" validate -json

# Format check (from repo root — works recursively across all .tf files)
terraform fmt -check -recursive -diff

# tflint — run from each directory containing .tf files
tflint --chdir="<tf_dir>" --format=json
```

**Note:** If `.terraform/` is absent in a given directory and `terraform init` hasn't been run, skip `terraform validate` for that directory and note it in the report. Run `terraform fmt` and `tflint` without init.

### Checkov (universal — covers most IaC types)

```bash
# Run from repo root; checkov auto-detects IaC type
checkov -d . --output json --quiet
```

Checkov is the highest-signal validator — prioritize its output. If checkov is unavailable, fall back to trivy.

### Trivy Config

```bash
trivy config . --format json --exit-code 0
```

### Helm

```bash
# For each Chart.yaml directory found
helm lint <chart-dir> --strict
```

## Step 4: Parse and Categorize Findings

Aggregate all findings across validators. Deduplicate findings that reference the same file/line across tools. Map to severity:

| Severity     | Criteria                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------- |
| **CRITICAL** | Remote code execution, exposed credentials, world-accessible storage, no encryption at rest |
| **HIGH**     | Missing auth, overly permissive IAM, unencrypted data in transit, no logging                |
| **MEDIUM**   | Missing resource tags, deprecated resources, weak encryption, open egress                   |
| **LOW**      | Style violations, naming conventions, missing descriptions                                  |
| **INFO**     | Format issues, best practice suggestions                                                    |

## Step 5: Report Findings

Output a structured report:

### Summary

```
IaC Validator Report
====================
Detected: [list of IaC types]
Validators run: [list of tools]
Total findings: N (X critical, Y high, Z medium, W low)
```

### Findings (grouped by severity, then file)

For each finding:

```
[SEVERITY] CHECK_ID
File: path/to/file.tf:line
Resource: resource_type.resource_name
Issue: Short description of the problem
Fix: Concrete remediation step
```

### What Passed

List checks that passed to confirm coverage was complete (not just failures).

## Step 6: Remediation Guidance

For the top 3 highest-severity findings, provide:

1. **Root cause**: Why this is a security/compliance risk
2. **Concrete fix**: Exact code change to make (show before/after diff)
3. **Verification**: How to confirm the fix resolves the finding

If all findings are LOW or INFO, note that the infrastructure configuration is in good shape and list remaining polish items.

## Success Criteria

- All detected IaC types were analyzed
- At least one validator ran successfully
- All CRITICAL and HIGH findings are surfaced with remediation steps
- Report is actionable: each finding tells the user exactly what to change

## Common Issues

**`terraform validate` fails with "Backend not configured"**: Run `terraform init -backend=false` in the Terraform directory to initialize without connecting to the actual backend, then re-run validate. Checkov/tflint still run without init.

**`checkov` returns exit code 1 on findings**: This is expected — it doesn't indicate a tool error. Parse the JSON output regardless of exit code.

**No IaC files found**: Report this clearly and suggest checking if the user is in the right directory.

**All validators missing**: Report which tools to install and provide install commands for the user's detected OS (macOS: `brew install`, Linux: package manager or binary).
