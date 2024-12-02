import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { useMount } from "./useMount";
import { GRID_KEYS, MINI_GRID_KEYS } from './constant';
import { useEffect, useState } from 'react';
import { mouseClick, moveWindowToCursorMonitor } from './utils';
import { currentMonitor, cursorPosition, Monitor } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';


export const useGlobalShortcut = () => {
  const [enterGridMode, setEnterGridMode] = useState(false);
  const [inited, setInited] = useState(false);
  const [keyPos, setKeyPos] = useState(['', '']);
  const [numPos, setNumPos] = useState('');

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
      register('Space', async (e) => {
        if (e.state === "Pressed") {
          setEnterGridMode(false)
          await mouseClick();
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
      setNumPos('')
    }

    return () => {
      unregister('Escape');
      unregister('Enter');
      unregister('Space');
      GRID_KEYS.forEach((key) => {
        unregister(key);
      });
    };
  }, [enterGridMode])

  useEffect(() => {
    const centerMode = keyPos[0] && keyPos[1];

    if (!centerMode) return;

    MINI_GRID_KEYS.forEach((key) => {
      register(key, (e) => {
        if (e.state === "Pressed") {
          setNumPos(key)
        }
      });
    });

    return () => {
      MINI_GRID_KEYS.forEach((key) => {
        unregister(key);
      });
    }
  }, [keyPos])

  return {
    inited,
    keyPos,
    numPos,
    enterGridMode
  }
}

export const useMousePosition = (rowKey = '', colKey = '', numPos = '') => {
  const rowIndex = GRID_KEYS.indexOf(rowKey);
  const colIndex = GRID_KEYS.indexOf(colKey);
  const numIndex = MINI_GRID_KEYS.indexOf(numPos);

  useEffect(() => {
    currentMonitor().then(async (monitor) => {
      if (!monitor) {
        console.error('No monitor found')
        return;
      }

      const position = await cursorPosition();
      const widthSpan = (monitor.size.width / GRID_KEYS.length);
      const heightSpan = (monitor.size.height / GRID_KEYS.length);

      let x = monitor.position.x + widthSpan * colIndex + widthSpan / 2;
      let y = monitor.position.y + heightSpan * rowIndex + heightSpan / 2;

      if (numIndex >= 0) {
        const offsetX = numIndex % 4 * widthSpan / 4 + widthSpan / 8 - widthSpan / 2;
        const offsetY = Math.floor(numIndex / 4) * heightSpan / 3 + heightSpan / 6 - heightSpan / 2;

        x += offsetX;
        y += offsetY;
      }

      const finalX = (colIndex >= 0 ? x : position.x) / monitor.scaleFactor
      const finalY = (rowIndex >= 0 ? y : position.y) / monitor.scaleFactor

      invoke('move_mouse', { x: finalX, y: finalY })
    });
  }, [rowKey, colKey, numIndex])
}

export const useMouseMove = (enable = false) => {
  const [monitor, setMonitor] = useState<Monitor>();
  const widthSpan = monitor ? (monitor.size.width / GRID_KEYS.length) : 10;
  const heightSpan = monitor ? (monitor.size.height / GRID_KEYS.length) : 10;

  const directionList = [
    { key: 'ArrowLeft', x: -widthSpan / 4, y: 0 },
    { key: 'ArrowRight', x: widthSpan / 4, y: 0 },
    { key: 'ArrowUp', x: 0, y: -heightSpan / 4 },
    { key: 'ArrowDown', x: 0, y: heightSpan / 4 },
    // shift slow
    { key: 'Shift+ArrowLeft', x: -widthSpan / 8, y: 0 },
    { key: 'Shift+ArrowRight', x: widthSpan / 8, y: 0 },
    { key: 'Shift+ArrowUp', x: 0, y: -heightSpan / 8 },
    { key: 'Shift+ArrowDown', x: 0, y: heightSpan / 8 },
  ]

  useEffect(() => {
    if (enable) {
      currentMonitor().then(async (monitor) => {
        if (!monitor) {
          console.error('No monitor found')
          return;
        }

        setMonitor(monitor);
      });
    } else {
      setMonitor(undefined);
    }
  }, [enable])

  useEffect(() => {
    if (enable && monitor) {
      directionList.forEach(({ key, x: offsetX, y: offsetY }) => {
        register(key, async (e) => {
          if (e.state === "Pressed") {
            const position = await cursorPosition();
            let { x, y } = position || {};
            x = (x + offsetX) / monitor.scaleFactor;
            y = (y + offsetY) / monitor.scaleFactor;
            invoke('move_mouse', { x, y })
          }
        });
      })
    } else {
      directionList.forEach(({ key }) => {
        unregister(key);
      });
    }
  }, [enable, monitor])

}