import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import chalk from "chalk";
import config from "../config.js";

let sessionVerified = false;
let webServerStarted = false;
let qrCodeToSend = null;

export function startWebServer() {
    if (webServerStarted) return { sessionVerified, setQR: () => { }, close: () => { } };
    webServerStarted = true;
    const app = express();
    const server = http.createServer(app);
    const io = new SocketIOServer(server);

    app.use(express.static("public"));
    app.use(express.json());

    app.get("/", (req, res) => {
        res.send(`
      <html>
        <head>
          <title>Aeonify QR Auth</title>
          <meta name='viewport' content='width=device-width, initial-scale=1.0'>
          <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/5968/5968841.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
              color: #e5e7ef; 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
              min-height: 100vh; 
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              position: relative;
              overflow-x: hidden;
            }

            body::before {
              content: '';
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: 
                radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
              pointer-events: none;
              z-index: -1;
            }
            
            .container { 
              background: rgba(35, 38, 58, 0.95);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 24px; 
              box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05);
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              padding: 3rem 2rem 2rem 2rem; 
              max-width: 420px; 
              width: 90vw;
              margin: 2rem auto;
              position: relative;
              transition: all 0.3s ease;
            }

            .container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 1px;
              background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.5), transparent);
            }

            .brand {
              font-weight: 700;
              color: #fff;
              font-size: 1.5rem;
              letter-spacing: 2px;
              margin-bottom: 0.5rem;
              background: linear-gradient(135deg, #60a5fa, #a855f7);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              text-transform: uppercase;
            }
            
            h2 { 
              color: #94a3b8;
              margin-bottom: 2rem;
              font-weight: 500;
              font-size: 1.1rem;
              text-align: center;
            }

            #sessionForm {
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 1rem;
            }
            
            input, button { 
              padding: 1rem 1.5rem;
              border-radius: 12px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              font-size: 1rem;
              font-family: inherit;
              background: rgba(255, 255, 255, 0.05);
              color: #e5e7ef;
              transition: all 0.3s ease;
              width: 100%;
            }

            input {
              backdrop-filter: blur(10px);
            }
            
            input:focus { 
              outline: none;
              border-color: #60a5fa;
              box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
              background: rgba(255, 255, 255, 0.08);
            }

            input::placeholder {
              color: #64748b;
            }
            
            button { 
              background: linear-gradient(135deg, #60a5fa, #3b82f6);
              color: #fff;
              border: none;
              cursor: pointer;
              font-weight: 600;
              position: relative;
              overflow: hidden;
            }

            button::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
              transition: left 0.5s;
            }

            button:hover::before {
              left: 100%;
            }
            
            button:hover { 
              background: linear-gradient(135deg, #3b82f6, #2563eb);
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(96, 165, 250, 0.3);
            }

            button:active {
              transform: translateY(0);
            }
            
            #msg { 
              margin: 1.5rem 0;
              min-height: 1.5rem;
              font-weight: 500;
              text-align: center;
              color: #94a3b8;
              line-height: 1.5;
            }

            .success-msg {
              color: #10b981 !important;
            }

            .error-msg {
              color: #ef4444 !important;
            }

            .loading-msg {
              color: #f59e0b !important;
            }
            
            #qr { 
              display: flex;
              justify-content: center;
              align-items: center;
              margin-top: 1.5rem;
            }

            #qr img { 
              border-radius: 16px;
              box-shadow: 
                0 8px 25px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.1);
              max-width: 100%;
              height: auto;
              transition: transform 0.3s ease;
            }

            #qr img:hover {
              transform: scale(1.02);
            }
            
            .footer { 
              position: fixed;
              bottom: 2rem;
              left: 50%;
              transform: translateX(-50%);
              color: #64748b;
              font-size: 0.875rem;
              text-align: center;
              line-height: 1.6;
              max-width: 90vw;
            }
            
            .footer a { 
              color: #60a5fa;
              text-decoration: none;
              margin: 0 0.25rem;
              transition: color 0.3s ease;
            }
            
            .footer a:hover { 
              color: #93c5fd;
              text-decoration: underline;
            }

            /* Loading animation */
            .loading-dots::after {
              content: '';
              animation: loading-dots 1.5s infinite;
            }

            @keyframes loading-dots {
              0%, 20% { content: ''; }
              40% { content: '.'; }
              60% { content: '..'; }
              80%, 100% { content: '...'; }
            }

            /* Responsive design */
            @media (max-width: 768px) {
              .container { 
                max-width: 95vw;
                padding: 2rem 1.5rem;
                margin: 1rem auto;
              }
              
              .brand {
                font-size: 1.3rem;
                letter-spacing: 1.5px;
              }
              
              h2 { 
                font-size: 1rem;
                margin-bottom: 1.5rem;
              }

              input, button {
                padding: 0.875rem 1.25rem;
                font-size: 0.95rem;
              }

              .footer {
                bottom: 1rem;
                font-size: 0.8rem;
                padding: 0 1rem;
              }
            }

            @media (max-width: 480px) {
              .container {
                padding: 1.5rem 1rem;
              }

              .brand {
                font-size: 1.2rem;
              }

              input, button {
                padding: 0.75rem 1rem;
              }
            }

            /* Focus trap for accessibility */
            .container:focus-within {
              box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.3),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                0 0 0 3px rgba(96, 165, 250, 0.1);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="brand">Aeonify</div>
            <h2>Bot QR Authentication</h2>
            <div id="main"></div>
          </div>
          <div class="footer">
            Developed by <b>Aeon</b> &bull;
            <a href="https://github.com/Aeon-San/Aeonify" target="_blank">Give a ⭐ on GitHub</a> &bull;
            <a href="https://github.com/Aeon-San" target="_blank">Follow Aeon</a>
          </div>
          <script src="/socket.io/socket.io.js"></script>
          <script>
            let sessionVerified = ${sessionVerified ? 'true' : 'false'};
            let qrReceived = false;
            function showForm() {
              document.getElementById('main').innerHTML =
                '<form id="sessionForm">' +
                  '<input type="text" id="sessionId" name="sessionId" placeholder="Enter Session ID" required autocomplete="off" />' +
                  '<button type="submit">Verify Session</button>' +
                '</form>' +
                '<div id="msg"></div>';
              document.getElementById('sessionForm').onsubmit = async function(e) {
                e.preventDefault();
                const msgEl = document.getElementById('msg');
                msgEl.className = 'loading-msg loading-dots';
                msgEl.innerText = 'Verifying';
                const sessionId = document.getElementById('sessionId').value;
                try {
                  const res = await fetch('/verify-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId })
                  });
                  const data = await res.json();
                  if (data.success) {
                    msgEl.className = 'success-msg';
                    msgEl.innerText = 'Session ID verified! Waiting for QR...';
                    sessionVerified = true;
                    showWaiting();
                    setTimeout(() => location.reload(), 1000);
                  } else {
                    msgEl.className = 'error-msg';
                    msgEl.innerText = 'Invalid session ID. Please try again.';
                  }
                } catch (error) {
                  msgEl.className = 'error-msg';
                  msgEl.innerText = 'Connection error. Please try again.';
                }
              }
            }
            function showWaiting() {
              document.getElementById('main').innerHTML =
                '<div id="msg" class="success-msg">Session ID verified! Waiting for QR code...</div>' +
                '<div id="qr"></div>';
            }
            function showQR(qr) {
              document.getElementById('main').innerHTML =
                "<div id='msg'>Scan this QR code in WhatsApp:</div>" +
                "<div id='qr'><img src='https://api.qrserver.com/v1/create-qr-code/?data=" +
                encodeURIComponent(qr) +
                "&size=280x280' alt='WhatsApp QR Code' /></div>";
            }
            if (!sessionVerified) {
              showForm();
            } else {
              showWaiting();
              const socket = io();
              socket.on('qr', qr => {
                if (!qrReceived) {
                  showQR(qr);
                  qrReceived = true;
                }
              });
            }
          </script>
        </body>
      </html>
    `);
    });

    app.post("/verify-session", (req, res) => {
        const { sessionId } = req.body;
        if (sessionId === config.sessionId) {
            sessionVerified = true;
            res.json({ success: true, message: "Session ID verified! Reloading..." });
        } else {
            res.json({ success: false, message: "Invalid session ID." });
        }
    });

    const PORT = config.PORT;
    server.listen(PORT, () => {
        console.log(chalk.green(`Express server running at http://localhost:${PORT}`));
    });

    return {
        setQR: (qr) => {
            qrCodeToSend = qr;
            io.emit('qr', qr);
        },
        close: () => {
            server.close(() => {
                console.log(chalk.yellow("Web server closed after successful login."));
            });
            io.close();
        },
        get sessionVerified() { return sessionVerified; },
        set sessionVerified(val) { sessionVerified = val; },
    };
}