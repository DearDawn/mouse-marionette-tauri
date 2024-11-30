// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use cocoa::appkit::NSApplication;
use cocoa::appkit::NSApplicationActivationPolicy;
use cocoa::appkit::NSWindow;
use cocoa::appkit::NSWindowCollectionBehavior;
use cocoa::base::{id, nil};
use core_graphics::display::CGPoint;
use core_graphics::event::{CGEvent, CGEventTapLocation, CGEventType, CGMouseButton};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
use objc::runtime::YES;
use tauri::command;
use tauri::Manager;

#[command]
fn get_mouse_position() -> Result<(f64, f64), String> {
    let event_source = CGEventSource::new(CGEventSourceStateID::HIDSystemState)
        .map_err(|e| format!("Failed to create event source: {:?}", e))?;
    let event =
        CGEvent::new(event_source).map_err(|e| format!("Failed to create event: {:?}", e))?;

    let location = event.location();
    Ok((location.x as f64, location.y as f64))
}

#[command]
fn move_mouse(x: f64, y: f64) {
    let event_source = CGEventSource::new(CGEventSourceStateID::HIDSystemState).unwrap();
    let event = CGEvent::new_mouse_event(
        event_source,
        CGEventType::MouseMoved,
        CGPoint::new(x, y),
        CGMouseButton::Left,
    )
    .unwrap();

    event.post(CGEventTapLocation::HID);
}

#[command]
fn click_mouse(x: f64, y: f64) {
    let event_source = CGEventSource::new(CGEventSourceStateID::HIDSystemState).unwrap();
    let event_down = CGEvent::new_mouse_event(
        event_source.clone(),
        CGEventType::LeftMouseDown,
        CGPoint::new(x, y),
        CGMouseButton::Left,
    )
    .unwrap();

    let event_up = CGEvent::new_mouse_event(
        event_source.clone(),
        CGEventType::LeftMouseUp,
        CGPoint::new(x, y),
        CGMouseButton::Left,
    )
    .unwrap();

    event_down.post(CGEventTapLocation::HID);
    event_up.post(CGEventTapLocation::HID);
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn hide_dock_icon() {
    unsafe {
        let app = NSApplication::sharedApplication(nil);
        app.setActivationPolicy_(
            NSApplicationActivationPolicy::NSApplicationActivationPolicyAccessory,
        );
    }
}

fn enable_click_through(window: id) {
    unsafe {
        let ns_window = window as id;
        ns_window.setIgnoresMouseEvents_(YES);
    }
}

fn hide_in_mission_control(window: id) {
    unsafe {
        let ns_window = window as id;
        ns_window.setCollectionBehavior_(
            NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary,
        );
    }
}

#[tauri::command]
fn set_window_to_screen_size(window: tauri::WebviewWindow) {
    // 获取当前聚焦的显示器
    let monitor = window.current_monitor().unwrap().unwrap();

    // 获取显示器的宽度和高度
    let width = monitor.size().width as f64;
    let height = monitor.size().height as f64;

    // 获取显示器的缩放比例
    let scale_factor = monitor.scale_factor();

    // 调整宽度和高度以适应缩放比例
    let adjusted_width = width / scale_factor;
    let adjusted_height = height / scale_factor;

    // 设置窗口的宽度和高度
    window
        .set_size(tauri::Size::Logical(tauri::LogicalSize {
            width: adjusted_width,
            height: adjusted_height,
        }))
        .unwrap();

    // 获取显示器的左上角位置
    let position = monitor.position();

    // 移动窗口到显示器的左上角
    window
        .set_position(tauri::Position::Logical(tauri::LogicalPosition {
            x: position.x as f64,
            y: position.y as f64,
        }))
        .unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            hide_dock_icon();

            let window: tauri::WebviewWindow = app.get_webview_window("main").unwrap();
            let ns_window: *mut objc::runtime::Object = window.ns_window().unwrap() as *mut _;
            enable_click_through(ns_window);
            hide_in_mission_control(ns_window);

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            set_window_to_screen_size,
            move_mouse,
            click_mouse,
            get_mouse_position
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
