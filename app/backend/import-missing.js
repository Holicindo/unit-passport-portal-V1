const { DataSource } = require('typeorm');
const axios = require('axios');
const { parse } = require('csv-parse/sync');

const myDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await myDataSource.initialize();
    
    // Load clients
    const clientMap = new Map();
    const clients = await myDataSource.query('SELECT id, bp_code FROM clients');
    for (const c of clients) {
        if (c.bp_code) clientMap.set(c.bp_code.trim(), c.id);
    }
    
    // Load existing units
    const dbUnits = await myDataSource.query("SELECT serial_number FROM units;");
    const dbSerials = new Set(dbUnits.map(u => u.serial_number.trim()));

    const serialUrl = 'https://docs.google.com/spreadsheets/d/17sx4lU44TBxV5URgj0wJzywmuT8OvdkK5uxuAeXUb38/export?format=csv&gid=0';
    const serialRes = await axios.get(serialUrl);
    const serialRecords = parse(serialRes.data, { columns: false, skip_empty_lines: true });

    let importedCount = 0;

    // Scan the ENTIRE sheet
    for (let i = 1; i < serialRecords.length; i++) {
        const record = serialRecords[i];
        const serialNumber = record[0]?.trim();
        const modelName = record[1]?.trim();
        const itemCode = record[2]?.trim();
        const customerCode = record[4]?.trim();
        const startDateStr = record[9]?.trim();
        const outletBranch = record[16]?.trim();
        const deliveryAddress = record[17]?.trim() || '';

        // Import if we have at least a Serial Number and Model Name!
        if (serialNumber && modelName && serialNumber !== 'Serial Number') {
            
            // Skip if already imported
            if (dbSerials.has(serialNumber)) continue;

            // Resolve client if exists
            let clientId = null;
            if (customerCode) {
                clientId = clientMap.get(customerCode) || null;
            }

            let city = null;
            if (deliveryAddress.toLowerCase().includes('jakarta')) city = 'Jakarta';
            else if (deliveryAddress.toLowerCase().includes('surabaya')) city = 'Surabaya';
            else if (deliveryAddress.toLowerCase().includes('bandung')) city = 'Bandung';
            else if (deliveryAddress.toLowerCase().includes('semarang')) city = 'Semarang';
            else if (deliveryAddress.toLowerCase().includes('tangerang')) city = 'Tangerang';
            else if (deliveryAddress.toLowerCase().includes('bekasi')) city = 'Bekasi';
            else if (deliveryAddress.toLowerCase().includes('depok')) city = 'Depok';

            let productionDate = null;
            if (startDateStr) {
                const parsedDate = new Date(startDateStr);
                if (!isNaN(parsedDate.getTime())) productionDate = parsedDate;
            }

            const qr_token = `holi-cp-${serialNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
            
            // Create spec json
            const specsStr = JSON.stringify({ item_code: itemCode });

            // Insert into DB directly via query
            const insertQuery = `
                INSERT INTO units (
                    id, serial_number, model_name, specs, qr_token, 
                    "currentClientId", outlet_branch, city, production_date, status, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', NOW(), NOW()
                )
            `;

            const unitId = `UNT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

            try {
                await myDataSource.query(insertQuery, [
                    unitId, serialNumber, modelName, specsStr, qr_token,
                    clientId, outletBranch || null, city || null, productionDate
                ]);
                
                importedCount++;
                dbSerials.add(serialNumber); // prevent duplicates in same loop
            } catch (err) {
                console.error(`Failed to insert ${serialNumber}:`, err.message);
            }
        }
    }

    console.log(`Successfully imported ${importedCount} missing units from the spreadsheet!`);
    process.exit(0);
}

run().catch(err => {
    console.error(err.message);
    process.exit(1);
});
