import { TrayIcon } from '@tauri-apps/api/tray';

import './App.css';
import { useMount } from './useMount';
import { Menu } from '@tauri-apps/api/menu';
import { exit, relaunch } from '@tauri-apps/plugin-process';
import { Grid } from './Grid';

function App() {
    async function createMenu() {
        return await Menu.new({
            // items 的显示顺序是倒过来的
            items: [
                {
                    id: 'reload',
                    text: '重启',
                    action: () => {
                        relaunch();
                    },
                },
                {
                    id: 'quit',
                    text: '退出',
                    action: () => {
                        exit();
                    },
                },
                {
                    id: 'settings',
                    text: '设置',
                    action: () => {
                        console.log('[dodo] ', 'setting');
                    },
                },
            ],
        });
    }

    useMount(async () => {
        const tray = await TrayIcon.getById('marionette');
        tray?.setMenu(await createMenu());
    });

    return (
        <main className='container'>
            <Grid />
        </main>
    );
}

export default App;
