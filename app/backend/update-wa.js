const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`UPDATE partner SET contact_wa = '6281287120358' WHERE contact_wa = '6287808780006'`, function(err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`Row(s) updated in partner: ${this.changes}`);
    }
  });
});

db.close();
