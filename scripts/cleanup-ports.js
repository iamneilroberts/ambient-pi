import { execSync } from 'child_process';

function killProcesses() {
    try {
        // Kill any react-scripts processes
        try {
            execSync('pkill -f "react-scripts start"');
            console.log('Killed react-scripts processes');
        } catch (error) {
            // No react-scripts processes found
        }

        // Kill processes on specific ports
        [3001, 3002].forEach(port => {
            try {
                // Find process using the port
                const findCommand = `lsof -i :${port} -t`;
                const pids = execSync(findCommand, { encoding: 'utf-8' })
                    .trim()
                    .split('\n')
                    .filter(Boolean); // Remove empty lines
                
                if (pids.length > 0) {
                    // Kill each process found
                    pids.forEach(pid => {
                        try {
                            console.log(`Killing process ${pid} on port ${port}`);
                            execSync(`kill -9 ${pid}`);
                        } catch (error) {
                            console.error(`Failed to kill process ${pid}:`, error.message);
                        }
                    });
                }
            } catch (error) {
                // If no process is found, lsof will exit with code 1
                console.log(`No process found using port ${port}`);
            }
        });

        // Additional cleanup for node processes that might be hanging
        try {
            const findNodeCommand = "ps aux | grep '[n]ode.*ambient-pi' | awk '{print $2}'";
            const nodePids = execSync(findNodeCommand, { encoding: 'utf-8' })
                .trim()
                .split('\n')
                .filter(Boolean);
            
            if (nodePids.length > 0) {
                nodePids.forEach(pid => {
                    try {
                        console.log(`Killing node process ${pid}`);
                        execSync(`kill -9 ${pid}`);
                    } catch (error) {
                        console.error(`Failed to kill node process ${pid}:`, error.message);
                    }
                });
            }
        } catch (error) {
            // No matching node processes found
        }
    } catch (error) {
        console.error('Error during cleanup:', error.message);
    }
}

// Run the cleanup
killProcesses();
console.log('Cleanup completed');
