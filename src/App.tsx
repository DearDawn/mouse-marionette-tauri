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
        TrayIcon.new({
            icon: 'icons/32x32.png',
            title: '鼠标傀儡',
            tooltip: '键盘控制鼠标',
            menuOnLeftClick: true,
            menu: await createMenu(),
        });
    });

    return (
        <main className='container'>
            <Grid />
        </main>
    );
}

export default App;
