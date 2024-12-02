import { FC, useEffect } from 'react';
import clsx from 'clsx';
import { useGlobalShortcut, useMouseMove, useMousePosition } from '../hooks';
import styles from './styles.module.less';
import { GRID_KEYS, MINI_GRID_KEYS } from '../constant';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import LogoImage from '/src-tauri/icons/128x128@2x.png';

export const Grid: FC = () => {
    const { keyPos, numPos, inited, enterGridMode } = useGlobalShortcut();
    const [activeRowKey, activeColKey] = keyPos || [];
    useMousePosition(activeRowKey, activeColKey, numPos);
    useMouseMove(enterGridMode);

    useEffect(() => {
        if (enterGridMode && inited) {
            setTimeout(() => {
                getCurrentWebview().show();
            }, 0);
        } else {
            setTimeout(
                () => {
                    getCurrentWebview().hide();
                },
                inited ? 0 : 2000
            );
        }
    }, [enterGridMode, inited]);

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
                            [styles.activeTarget]:
                                rowKey === activeRowKey &&
                                colKey === activeColKey,
                        })}
                    >
                        {`${rowKey}${colKey}`}
                        {rowKey === activeRowKey && colKey === activeColKey && (
                            <div className={styles.miniGrid}>
                                {MINI_GRID_KEYS.map((miniKey) => (
                                    <div
                                        className={clsx(styles.miniGridItem, {
                                            [styles.active]: miniKey === numPos,
                                        })}
                                        key={miniKey}
                                    >
                                        {miniKey}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};
