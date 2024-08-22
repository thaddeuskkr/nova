# Security Policy

## Supported Versions

Since Nova is currently in alpha, there is no fixed versioning system.
Therefore, any code in the `main` branch is supported, and a vulnerability can be reported if it is found.

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not publicly disclose vulnerabilities.**

Instead, report a vulnerability privately [here](https://github.com/thaddeuskkr/nova/security/advisories/new).  
If the vulnerability you've discovered is *severe*, do also contact me using [this form](https://www.tkkr.dev/contact), and I will get back to you within 24 hours.

## What counts as a severe vulnerability?
* Retrieval of any user information (of other users) such as passwords and emails
* Database infiltration
* Bypassing password-protected short URLs
* Manipulation of short URLs without authentication / manipulation of short URLs not owned by the authenticated user
* Retrieval of *all* or *many* short URLs at once
