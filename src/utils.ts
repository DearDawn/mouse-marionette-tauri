import { invoke } from "@tauri-apps/api/core";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { cursorPosition, availableMonitors, getCurrentWindow, currentMonitor } from "@tauri-apps/api/window";

/** 调用函数将窗口移动到光标所在的显示器 */
export const moveWindowToCursorMonitor = async () => {
  // 获取光标当前的位置
  const position = await cursorPosition();
  const cursorX = position.x;
  const cursorY = position.y;

  // 获取所有显示器的信息
  const monitors = await availableMonitors();

  // 查找光标所在的显示器
  let targetMonitor = null;
  for (const monitor of monitors) {
    const { position: { x, y }, size: { width, height } } = monitor;
    if (cursorX >= x && cursorX <= x + width && cursorY >= y && cursorY <= y + height) {
      targetMonitor = monitor;
      break;
    }
  }

  if (!targetMonitor) {
    console.error('Cursor is not on any monitor');
    return;
  }

  // 计算窗口的新位置
  const { position: { x, y }, scaleFactor, size: { width, height } } = targetMonitor;
  // 移动窗口到新的位置
  await getCurrentWindow().setPosition(new LogicalPosition({ x: x / scaleFactor, y: y / scaleFactor }));
  await getCurrentWindow().setSize(new LogicalSize({ width: width / scaleFactor, height: height / scaleFactor }));
}

export const mouseClick = async () => {
  const pos = await cursorPosition();
  const monitor = await currentMonitor();
  if (monitor) {
    await invoke('click_mouse', { x: pos.x / monitor.scaleFactor, y: pos.y / monitor.scaleFactor })
  }
}