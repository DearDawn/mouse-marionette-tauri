import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { useMount } from "./useMount";
import { GRID_KEYS } from './constant';
import { useEffect, useState } from 'react';
import { mouseClick, moveWindowToCursorMonitor } from './utils';
import { currentMonitor, cursorPosition } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';


export const useGlobalShortcut = () => {
  const [enterGridMode, setEnterGridMode] = useState(false);
  const [inited, setInited] = useState(false);
  const [keyPos, setKeyPos] = useState(['', '']);

  useMount(async () => {
    await register('Control+F', async (e) => {
      if (e.state === "Pressed") {
        await moveWindowToCursorMonitor();
        setEnterGridMode(!enterGridMode);
        if (!enterGridMode && !inited) {
          setInited(true)
        }
      }
    });
  })

  useEffect(() => {
    if (enterGridMode) {
      register('Escape', (e) => {
        if (e.state === "Pressed") {
          setEnterGridMode(false)
        }
      });
      register('Enter', async (e) => {
        if (e.state === "Pressed") {
          setEnterGridMode(false)
          mouseClick();
        }
      });
      GRID_KEYS.forEach((key) => {
        register(key, (e) => {
          if (e.state === "Pressed") {
            setKeyPos(pos => {
              const isEmpty = (pos[0] && pos[1]) || !pos[0];
              return isEmpty ? [key, ''] : [pos[0], key]
            });
          }
        });
      });
    } else {
      setKeyPos(['', ''])
    }

    return () => {
      unregister('Escape');
      unregister('Enter');
      GRID_KEYS.forEach((key) => {
        unregister(key);
      });
    };
  }, [enterGridMode])

  return {
    inited,
    keyPos,
    enterGridMode
  }
}

export const useMousePosition = (rowKey = '', colKey = '') => {
  const rowIndex = GRID_KEYS.indexOf(rowKey);
  const colIndex = GRID_KEYS.indexOf(colKey);

  useEffect(() => {
    currentMonitor().then(async (monitor) => {
      if (!monitor) {
        console.error('No monitor found')
        return;
      }

      const position = await cursorPosition();
      const widthSpan = (monitor.size.width / GRID_KEYS.length);
      const heightSpan = (monitor.size.height / GRID_KEYS.length);

      const x = monitor.position.x + widthSpan * colIndex + widthSpan / 2;
      const y = monitor.position.y + heightSpan * rowIndex + heightSpan / 2;

      const finalX = (colIndex >= 0 ? x : position.x) / monitor.scaleFactor
      const finalY = (rowIndex >= 0 ? y : position.y) / monitor.scaleFactor

      invoke('move_mouse', { x: finalX, y: finalY })
    });
  }, [rowKey, colKey])
}