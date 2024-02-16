# Software Requirements

- NodeJS v20.10.0
- Ubuntu 22.04 Jammy
- Redis
- MongoDB

# Installation Steps

- Run `npm install` to install modules
- Create .env file and setup environment variables (Use .env.example as reference)

# Commands

- Start dev environment: `npm run dev`
- Generate docs: `npm run docs`

# Server Deployment Steps

- Clone Repo
- Install NVM
  - `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash`
- Install NodeJS: `nvm install 20`
- Do Installation Steps
- Install Nginx
  - `sudo apt update`
  - `sudo apt install nginx`
- Install PM2: `npm install pm2 -g`
- Navigate to project folder and run the following: `pm2 start "npm run dev" --name axion`
- Nginx Configurations:

  - `sudo nano /etc/nginx/sites-available/axion.conf`
  - Copy the following configuration: (Change port numbers with your configured port numbers in .env)

        server {

                listen 80;
                server_name 51.20.69.210;

                location /api/auth/ {
                        proxy_pass  http://127.0.0.1:5111;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }
                location /api/student/ {
                        proxy_pass  http://127.0.0.1:5112;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }
                location /api/classroom/ {
                        proxy_pass  http://127.0.0.1:5113;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }
                location /api/school/ {
                        proxy_pass  http://127.0.0.1:5114;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }
                location /api/docs/ {
                        proxy_pass  http://127.0.0.1:5115;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }
                location /api/docs/assets {
                        proxy_pass  http://127.0.0.1:5115/api/assets;
                        proxy_set_header Host $host;
                        proxy_set_header X-Real-IP $remote_addr;
                        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }

        }

  - `sudo ln -s /etc/nginx/sites-available/axion.conf /etc/nginx/sites-enabled/`
  - `sudo systemctl restart nginx`
