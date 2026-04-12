import App from '@/app';
import authRoute from '@routes/auth.route';
import indexRoute from '@routes/index.route';
import usersRoute from '@routes/users.route';

const app = new App([indexRoute, usersRoute, authRoute]);

app.start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
