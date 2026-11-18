# Host the portfolio on AIC Cloud VPS

This portfolio is a static website, so it can be served efficiently by Nginx. The AIC Cloud VPS screenshot shows Ubuntu 24.04 at `148.113.9.217` with SSH port `20062`. The Three.js, GSAP, ScrollTrigger, and Lenis browser files are vendored locally; keep the `vendor` and `assets` folders beside the HTML files when uploading.

## 1. Upload the site and Nginx configuration

Run these commands in PowerShell from this project folder. SSH will prompt for the VPS root password; enter it in the terminal prompt, not in this file or chat.

```powershell
ssh -p 20062 root@148.113.9.217 "apt-get update && apt-get install -y nginx && mkdir -p /var/www/vishal-portfolio"
scp -P 20062 .\index.html .\styles.css .\portfolio.js .\portfolio-world.js .\project-scenes.js .\sw.js .\manifest.json .\icon.svg .\icon-192.png .\icon-512.png root@148.113.9.217:/var/www/vishal-portfolio/
scp -r -P 20062 .\vendor .\assets root@148.113.9.217:/var/www/vishal-portfolio/
scp -P 20062 .\nginx-portfolio.conf root@148.113.9.217:/etc/nginx/sites-available/vishal-portfolio
```

## 2. Enable the website

```powershell
ssh -p 20062 root@148.113.9.217 "ln -sfn /etc/nginx/sites-available/vishal-portfolio /etc/nginx/sites-enabled/vishal-portfolio && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl enable --now nginx && systemctl reload nginx"
```

The command checks the Nginx configuration before reloading the service. If the configuration check fails, Nginx is not reloaded.

## 3. Open the public HTTPS address

In AIC Cloud, open **Cloud VPS → vishal-server** and copy the free public URL shown on the VPS overview. AIC Cloud provisions HTTPS for this URL when the VPS serves the site on port 80. Use that URL instead of opening the VPS IP directly over HTTPS.

To use a personal domain, add it under the VPS **Domains / custom domain** area, then point the requested DNS record at the target AIC Cloud shows. AIC Cloud documents automatic TLS certificate provisioning for attached domains.

## Updating the website later

After making changes, upload the new files with:

```powershell
scp -P 20062 .\index.html .\styles.css .\portfolio.js .\portfolio-world.js .\project-scenes.js .\manifest.json .\sw.js .\icon.svg .\icon-192.png .\icon-512.png root@148.113.9.217:/var/www/vishal-portfolio/
scp -r -P 20062 .\vendor .\assets root@148.113.9.217:/var/www/vishal-portfolio/
scp -P 20062 .\nginx-portfolio.conf root@148.113.9.217:/etc/nginx/sites-available/vishal-portfolio
ssh -p 20062 root@148.113.9.217 "nginx -t && systemctl reload nginx"
```

This site is static HTML/CSS/JavaScript; it does not need Node.js or a database on the server.
