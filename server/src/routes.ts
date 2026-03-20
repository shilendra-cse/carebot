import { routes as apiRoutes } from './lib/ApiRouter';
import chatRoutes from './resources/chat/routes';

// Mount the chat routes on the API router
// The router already handles /chat, so we mount at root
apiRoutes.use('/', chatRoutes);

console.log('✅ Chat routes mounted at /api/chat');