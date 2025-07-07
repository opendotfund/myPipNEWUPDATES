import path from 'path';
import { defineConfig } from 'vite';
import { CLAUDE_API_KEY } from './constants';

export default defineConfig(() => {
    return {
        define: {
            'process.env.CLAUDE_API_KEY': JSON.stringify(CLAUDE_API_KEY),
            'process.env.API_KEY': JSON.stringify(CLAUDE_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});
