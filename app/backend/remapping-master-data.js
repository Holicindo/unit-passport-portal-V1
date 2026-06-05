const { DataSource } = require('typeorm');
const axios = require('axios');
const ExcelJS = require('exceljs');

const myDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

function getVal(cell) {
    if (!cell || cell.value === null || cell.value === undefined) return '';
    if (typeof cell.value === 'object' && cell.value.richText) {
        return cell.value.richText.map(t => t.text).join('').trim();
    }
    if (cell.text) return String(cell.text).trim();
    return String(cell.value).trim();
}

async function run() {
    await myDataSource.initialize();
    console.log('Database connected.');

    // Load clients
    const clientMap = new Map();
    const clients = await myDataSource.query('SELECT id, bp_code FROM clients');
    for (const c of clients) {
        if (c.bp_code) clientMap.set(c.bp_code.trim(), c.id);
    }

    const url = 'https://docs.google.com/spreadsheets/d/17sx4lU44TBxV5URgj0wJzywmuT8OvdkK5uxuAeXUb38/export?format=xlsx';
    console.log('Downloading Excel file...');
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.data);
    const sheet = workbook.worksheets[0];

    console.log(`Loaded spreadsheet. Total rows: ${sheet.rowCount}`);

    let processedCount = 0;
    let skippedRedCount = 0;
    let insertedCount = 0;
    let updatedCount = 0;

    for (let i = 2; i <= sheet.rowCount; i++) {
        try {
            const row = sheet.getRow(i);
            
            const serialCell = row.getCell(1);
            const serialNumber = getVal(serialCell);
            if (!serialNumber || serialNumber === 'Serial Number') continue;

            // CHECK FONT COLOR (Skip red text 'FFFF0000')
            if (serialCell.font && serialCell.font.color && serialCell.font.color.argb === 'FFFF0000') {
                skippedRedCount++;
                continue;
            }

            const modelName = getVal(row.getCell(2));
            const itemCode = getVal(row.getCell(3));
            const customerCode = getVal(row.getCell(5));
            const itrNumber = getVal(row.getCell(6));
            const itrDate = getVal(row.getCell(7));
            const proNumber = getVal(row.getCell(8));
            const manufactureSn = getVal(row.getCell(9));
            const unitNumber = getVal(row.getCell(10));
            const startDateStr = getVal(row.getCell(11));
            const qmNumber = getVal(row.getCell(12));
            const finishDateStr = getVal(row.getCell(13));
            const soNumber = getVal(row.getCell(14));
            const doNumber = getVal(row.getCell(15));
            const deliveryDate = getVal(row.getCell(16));
            const outletBranch = getVal(row.getCell(17));
            const deliveryAddress = getVal(row.getCell(18));

            const clientId = customerCode ? (clientMap.get(customerCode) || null) : null;

            let city = null;
            if (deliveryAddress) {
                const addrLower = deliveryAddress.toLowerCase();
                if (addrLower.includes('jakarta')) city = 'Jakarta';
                else if (addrLower.includes('surabaya')) city = 'Surabaya';
                else if (addrLower.includes('bandung')) city = 'Bandung';
                else if (addrLower.includes('semarang')) city = 'Semarang';
                else if (addrLower.includes('tangerang')) city = 'Tangerang';
                else if (addrLower.includes('bekasi')) city = 'Bekasi';
                else if (addrLower.includes('depok')) city = 'Depok';
                else if (addrLower.includes('bogor')) city = 'Bogor';
            }

            let productionDate = null;
            if (startDateStr) {
                const parsedDate = new Date(startDateStr);
                if (!isNaN(parsedDate.getTime())) productionDate = parsedDate;
            }

            const specsObj = {
                item_code: itemCode,
                itr_number: itrNumber,
                itr_date: itrDate,
                pro_number: proNumber,
                manufacture_sn: manufactureSn,
                unit_number: unitNumber,
                qm_number: qmNumber,
                finish_date: finishDateStr,
                so_number: soNumber,
                do_number: doNumber,
                delivery_date: deliveryDate,
                delivery_address: deliveryAddress
            };

            Object.keys(specsObj).forEach(k => {
                if (!specsObj[k]) delete specsObj[k];
            });
            const specsStr = JSON.stringify(specsObj);

            const existing = await myDataSource.query('SELECT id, specs FROM units WHERE serial_number = $1', [serialNumber]);

            if (existing && existing.length > 0) {
                let currentSpecs = existing[0].specs || {};
                const newSpecs = { ...currentSpecs, ...specsObj };
                
                await myDataSource.query(
                    `UPDATE units 
                     SET "currentClientId" = COALESCE($1, "currentClientId"),
                         outlet_branch = COALESCE($2, outlet_branch),
                         city = COALESCE($3, city),
                         production_date = COALESCE($4, production_date),
                         specs = $5,
                         model_name = COALESCE($6, model_name)
                     WHERE serial_number = $7`,
                     [clientId, outletBranch || null, city || null, productionDate, JSON.stringify(newSpecs), modelName, serialNumber]
                );
                updatedCount++;
            } else {
                const unitId = `UNT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
                const qr_token = `holi-cp-${serialNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
                
                await myDataSource.query(
                    `INSERT INTO units (
                        id, serial_number, model_name, specs, qr_token, 
                        "currentClientId", outlet_branch, city, production_date, status, created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'ACTIVE', NOW(), NOW()
                    )`,
                    [unitId, serialNumber, modelName || 'Unknown', specsStr, qr_token, clientId, outletBranch || null, city || null, productionDate]
                );
                insertedCount++;
            }
            processedCount++;
        } catch (e) {
            console.error(`Error processing row ${i}:`, e.message);
        }
    }

    console.log(`\n--- REMAPPING RESULTS ---`);
    console.log(`Total processed (black) rows: ${processedCount}`);
    console.log(`Skipped (red) rows: ${skippedRedCount}`);
    console.log(`Inserted new units: ${insertedCount}`);
    console.log(`Updated existing units: ${updatedCount}`);
    
    process.exit(0);
}

run().catch(err => {
    console.error(err.message);
    process.exit(1);
});
