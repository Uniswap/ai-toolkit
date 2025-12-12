# Security Policy

## Reporting a Vulnerability

We take the security of AI Toolkit seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security vulnerabilities by emailing:

**<security@uniswap.org>**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of vulnerability (e.g., code injection, arbitrary code execution, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| next    | :white_check_mark: |

## Security Considerations

### AI-Generated Content

This toolkit generates AI-powered content and code. Users should:

- Review all AI-generated content before using it in production
- Be aware that AI-generated code may contain errors or vulnerabilities
- Follow security best practices when implementing AI-generated solutions

### Dependencies

We regularly update our dependencies to address known vulnerabilities. If you discover a vulnerability in one of our dependencies, please check if it has already been reported upstream before contacting us.

### GitHub Actions Workflows

Our GitHub Actions workflows follow security best practices:

- Use pinned action versions with SHA hashes
- Limit permissions to the minimum required
- Use secrets for sensitive information
- Avoid direct interpolation of untrusted inputs in shell scripts

## Acknowledgments

We appreciate the security research community's efforts in helping keep AI Toolkit and our users safe. We will acknowledge security researchers who responsibly disclose vulnerabilities to us (with their permission) in our release notes.
