import { FC, useEffect } from 'react';
import clsx from 'clsx';
import { useGlobalShortcut, useMousePosition } from '../hooks';
import styles from './styles.module.less';
import { GRID_KEYS } from '../constant';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import LogoImage from '/src-tauri/icons/128x128@2x.png';

export const Grid: FC = () => {
    const { keyPos, inited, enterGridMode } = useGlobalShortcut();
    const [activeRowKey, activeColKey] = keyPos || [];
    useMousePosition(activeRowKey, activeColKey);

    useEffect(() => {
        if (enterGridMode) {
            getCurrentWebview().show();
        } else {
            setTimeout(
                () => {
                    getCurrentWebview().hide();
                },
                inited ? 0 : 2000
            );
        }
    }, [enterGridMode]);

    if (!enterGridMode && !inited)
        return (
            <div className={styles.welcome}>
                <img src={LogoImage} alt='logo' />
            </div>
        );

    return (
        <div className={styles.grid}>
            {GRID_KEYS.map((rowKey) =>
                GRID_KEYS.map((colKey) => (
                    <div
                        key={`${rowKey}-${colKey}`}
                        className={clsx(styles.gridItem, {
                            [styles.active]:
                                rowKey === activeRowKey ||
                                colKey === activeColKey,
                        })}
                    >
                        {`${rowKey}${colKey}`}
                    </div>
                ))
            )}
        </div>
    );
};
