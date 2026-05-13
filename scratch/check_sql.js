const fs = require('fs');

function checkFile(filePath) {
    console.log(`Checking ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for db.prepare followed by .run
    // This is a simplified check
    const prepares = content.split('db.prepare(');
    prepares.shift(); // Remove first part before first prepare
    
    prepares.forEach((prep, idx) => {
        const queryMatch = prep.match(/`([^`]*)`|'([^']*)'|"([^"]*)"/);
        if (!queryMatch) return;
        
        const query = queryMatch[1] || queryMatch[2] || queryMatch[3];
        const placeholderCount = (query.match(/\?/g) || []).length;
        
        // Find the corresponding .run() call
        // This is tricky because it might be several lines later
        const runPart = prep.split('.run(')[1];
        if (!runPart) return;
        
        // Get the arguments to .run()
        // This is also simplified (doesn't handle nested parens well)
        let argsStr = '';
        let parenCount = 1;
        for (let i = 0; i < runPart.length; i++) {
            if (runPart[i] === '(') parenCount++;
            if (runPart[i] === ')') parenCount--;
            if (parenCount === 0) {
                argsStr = runPart.substring(0, i);
                break;
            }
        }
        
        if (!argsStr) return;
        
        // Count arguments
        // If it uses spread ..., we can't easily count statically without more context
        if (argsStr.includes('...')) {
            console.log(`[${idx}] Query has ${placeholderCount} placeholders. Run uses spread: .run(${argsStr.trim()})`);
            return;
        }
        
        const argCount = argsStr.split(',').length;
        if (placeholderCount !== argCount && placeholderCount > 0) {
            console.log(`[${idx}] Mismatch found!`);
            console.log(`Query: ${query.substring(0, 100).replace(/\s+/g, ' ')}...`);
            console.log(`Placeholders: ${placeholderCount}`);
            console.log(`Args: ${argCount} (${argsStr.trim()})`);
            console.log('---');
        }
    });
}

checkFile('src/main/db/ipcHandlers.ts');
checkFile('src/main/db/ipcHandlers.js');
