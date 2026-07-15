import { DataSource } from 'typeorm';

const emailsToDelete = [
  'pameran@gmail.com',
  'Pameranfhi@holicindo.com',
  'ahmad@teknisihandal.com',
  'budi@starbucks.co.id',
  'technical@holicindo.com',
  'rieckamtramutiara@gmail.com',
  'rieckamutiara0@gmail.com',
  'client@ipc.com',
  'tech@holicindo.com'
];

async function run() {
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'aws-1-ap-northeast-1.pooler.supabase.com',
    port: 5432,
    username: 'postgres.hsqpzvdejgzgpisjsvbe',
    password: 'Sysholicindo26',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await AppDataSource.initialize();
    console.log('Database connected.');

    // Get user IDs
    const users = await AppDataSource.query(`SELECT id, email FROM users WHERE email = ANY($1)`, [emailsToDelete]);
    const ids = users.map(u => u.id);

    if (ids.length === 0) {
      console.log('No users found to delete.');
      return;
    }

    console.log(`Found ${ids.length} users to delete:`, users.map(u => u.email));

    // Handle foreign keys similar to auth.service.ts deleteBulk
    await AppDataSource.query(`UPDATE service_reports SET created_by_id = NULL WHERE created_by_id = ANY($1)`, [ids]);
    console.log('1. Cleared service_reports created_by_id');

    await AppDataSource.query(`DELETE FROM notifications WHERE user_id = ANY($1)`, [ids]);
    console.log('2. Deleted notifications');

    await AppDataSource.query(`DELETE FROM chat_messages WHERE sender_id = ANY($1)`, [ids]);
    console.log('3. Deleted chat_messages');

    await AppDataSource.query(`DELETE FROM conversations WHERE participant_1_id = ANY($1) OR participant_2_id = ANY($1)`, [ids]);
    console.log('4. Deleted conversations');

    // Finally delete the users
    const result = await AppDataSource.query(`DELETE FROM users WHERE id = ANY($1)`, [ids]);
    console.log('5. Successfully deleted users from users table.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

run();
