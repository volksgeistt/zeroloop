document.addEventListener('DOMContentLoaded', function() {
    const terminalOutput = document.querySelector('.terminal-output');
    const terminalInput = document.querySelector('.terminal-input');
    const terminalContent = document.querySelector('.terminal-content');

    let commandHistory = [];
    let historyIndex = -1;

    addOutputLine(`Welcome to ZeroLoop!
Type 'help' to see available commands.`, 'info-block');

    const commands = {
        'scanip': {
            description: 'Get detailed information about IP address. Usage: scanip <ip_address>',
            execute: async (args) => {
                if (!args) {
                    addOutputLine('Error: IP address is required. Usage: scanip <ip_address>', 'error-text');
                    return;
                }

                const ipAddress = args.trim();
                if (!isValidIP(ipAddress)) {
                    addOutputLine('Error: Invalid IP address format', 'error-text');
                    return;
                }

                try {
                    addOutputLine(`Scanning IP: ${ipAddress}...`, 'info-block');
                    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
                    const data = await response.json();

                    if (data.error) {
                        addOutputLine(`Error: ${data.reason || 'Invalid IP address'}`, 'error-text');
                        return;
                    }
                    
                    const output = createIPInfoOutput(data);
                    addOutputLine(output, 'ip-info-block');
                } catch (error) {
                    addOutputLine('Error fetching IP information. Please try again.', 'error-text');
                }
            }
        },
        'ping': {
            description: 'Ping a host or IP address. Usage: ping <host/ip>',
            execute: async (args) => {
                if (!args) {
                    addOutputLine('Error: Host/IP is required. Usage: ping <host/ip>', 'error-text');
                    return;
                }

                const host = args.trim();
                addOutputLine(`Pinging ${host}...`, 'info-block');

                try {
                    const dnsResolution = await simulateDNSLookup(host);
                    const times = [];
                    
                    addOutputLine(`Pinging ${host} [${dnsResolution}] with 32 bytes of data:`, 'ping-output');
                    
                    for (let i = 0; i < 4; i++) {
                        const time = Math.floor(Math.random() * (80 - 30) + 30); 
                        times.push(time);
                        await new Promise(resolve => setTimeout(resolve, time)); 
                        addOutputLine(`Reply from ${dnsResolution}: time=${time}ms`, 'ping-reply');
                    }

                    const min = Math.min(...times);
                    const max = Math.max(...times);
                    const avg = Math.floor(times.reduce((a, b) => a + b, 0) / times.length);

                    addOutputLine(`\nPing statistics for ${dnsResolution}:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = ${min}ms, Maximum = ${max}ms, Average = ${avg}ms`, 'ping-stats');

                } catch (error) {
                    addOutputLine(`Error: Could not ping ${host}`, 'error-text');
                }
            }
        },
        'help': {
            description: 'Show available commands',
            execute: () => {
                const helpText = `Available Commands:
  scanip <ip>   - Get detailed information about an IP
  ping <host>   - Ping a host or IP address
  clear         - Clear the terminal
  help          - Show this help message
  history       - Show command history`;
                addOutputLine(helpText, 'help-block');
            }
        },
        'clear': {
            description: 'Clear the terminal',
            execute: () => {
                terminalOutput.innerHTML = '';
            }
        },
        'history': {
            description: 'Show command history',
            execute: () => {
                if (commandHistory.length === 0) {
                    addOutputLine('No command history available.', 'info-block');
                } else {
                    const historyText = commandHistory
                        .map((cmd, index) => `${index + 1}. ${cmd}`)
                        .join('\n');
                    addOutputLine(`Command History:\n${historyText}`, 'history-block');
                }
            }
        }
    };

    function isValidIP(ip) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) return false;
        return ip.split('.').every(num => parseInt(num) >= 0 && parseInt(num) <= 255);
    }

    function createIPInfoOutput(data) {
        return `IP Information:
IP Address: ${data.ip}
Location: ${data.city}, ${data.region}, ${data.country_name}
Coordinates: ${data.latitude}, ${data.longitude}
ISP: ${data.org}
Timezone: ${data.timezone}
Currency: ${data.currency_name} (${data.currency})`;
    }

    async function simulateDNSLookup(host) {
        const segments = Array.from({length: 8}, () => 
            Math.floor(Math.random() * 65536)
            .toString(16)
            .padStart(4, '0')
        );
        return segments.join(':');
    }

    async function processCommand(input) {
        const [command, ...args] = input.toLowerCase().trim().split(' ');
        
        if (!command) return;

        commandHistory.unshift(input.trim());
        historyIndex = -1;

        addOutputLine(input.trim(), 'command-line');

        const cmd = commands[command];
        if (cmd) {
            await cmd.execute(args.join(' '));
        } else {
            addOutputLine(`Command not found: ${command}. Type 'help' for available commands.`, 'error-text');
        }

        terminalInput.value = '';
    }

    function addOutputLine(text, className = '') {
        const line = document.createElement('div');
        line.className = `output-line ${className}`;
        line.textContent = text;
        terminalOutput.appendChild(line);
        terminalContent.scrollTop = terminalContent.scrollHeight;
    }

    terminalInput.addEventListener('keydown', async function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const command = this.value.trim();
            await processCommand(command);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                this.value = commandHistory[historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                this.value = commandHistory[historyIndex];
            } else if (historyIndex === 0) {
                historyIndex = -1;
                this.value = '';
            }
        }
    });

    document.querySelector('.terminal-content').addEventListener('click', () => {
        terminalInput.focus();
    });

    terminalInput.focus();
});
