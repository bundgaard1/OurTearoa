# Cloud Infrastructure Setup

## 1. AWS Provisioning
- **Instance Type:** `t3.micro`
- **OS:** Ubuntu 24.04 LTS
- **Security Rules:** Ports 22, 80, 443

![EC2 Instance](images/01-ec2-running.png)
![Security Groups](images/02-security-group.png)

## 2. Dependencies & Runtime
- Node.js, npm, PM2, Nginx

![Version Verification](images/03-versions.png)

## 3. Process Management
- Managed with PM2 configured for systemd startup.

![PM2 Status](images/04-pm2-status.png)

## 4. Reverse Proxy & Verification
- Nginx proxying port 80 -> 127.0.0.1:3000.

![Nginx Config Test](images/05-nginx-test.png)
![Browser Live Response](images/06-browser-live.png)