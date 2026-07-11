import * as dotenv from 'dotenv';
import app from './app';
import { initDatabase } from './config/db';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // Database initialization (DDL schema migration & default data seed)
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` Thor WMS Backend API running on port ${PORT}`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Time: ${new Date().toLocaleString()}`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Critical database initialization failure:', error);
    process.exit(1);
  }
}

bootstrap();
