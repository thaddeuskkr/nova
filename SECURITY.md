# Security Policy

## Supported Versions

Since Nova is currently in alpha, there is no fixed versioning system.
Therefore, any code in the `main` branch is supported, and a vulnerability can be reported if it is found.

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

For severe vulnerabilities that affect all instances of Nova, please do not disclose them here. 
Instead, contact me through the contact form [here](https://www.tkkr.dev/contact) with details about the vulnerability, and I will get back to you by email within 24 hours after you submit the form. 
If you would not like to be contacted by email, please state antoher way to contact you in the `Message` field.
  
For vulnerabilities that are less severe and can be publicly disclosed, please [create an issue](https://github.com/thaddeuskkr/nova/issues/new/choose) instead.

## What counts as a severe vulnerability?
* Retrieval of any user information (of other users) such as passwords and emails
* Database infiltration
* Bypassing password-protected short URLs
* Manipulation of short URLs without authentication / manipulation of short URLs not owned by the authenticated user
* Retrieval of *all* or *many* short URLs at once
