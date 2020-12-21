import Postgres from '@/database/postgres';
import ExpressApp from '@/express.app';
import MongoDB from './database/mongo.db';

// MongoDB Run
new MongoDB().run();
// Postgres Run
new Postgres().run();
// Express Run
new ExpressApp().run();
