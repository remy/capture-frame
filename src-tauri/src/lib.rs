// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::menu::{AboutMetadata, MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            let config = MenuItemBuilder::new("Configuration")
                .id("config")
                .accelerator("CmdOrCtrl+1")
                .build(app)?;
            let frame = MenuItemBuilder::new("Frame")
                .id("frame")
                .accelerator("CmdOrCtrl+2")
                .build(app)?;
            let close_window = MenuItemBuilder::new("Close Window")
                .id("close_window")
                .accelerator("CmdOrCtrl+w")
                .build(app)?;

            let window_menu = SubmenuBuilder::new(app, "Window")
                .item(&config)
                .item(&frame)
                .build()?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&close_window)
                .build()?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .build()?;

            // my custom app submenu
            let app_submenu = SubmenuBuilder::new(app, "App")
                .about(Some(AboutMetadata {
                    ..Default::default()
                }))
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .quit()
                .build()?;

            let menu = MenuBuilder::new(app)
                .items(&[&app_submenu, &file_menu, &edit_menu, &window_menu])
                .build()?;

            app.on_menu_event(move |app, event| {
                if event.id() == config.id() {
                    // emit a window event to the frontend
                    let _event = app.emit("menu-event", "/config");
                }

                if event.id() == close_window.id() {
                    // emit a window event to the frontend
                    let _event = app.emit("menu-event", "/close");
                }

                if event.id() == frame.id() {
                    // emit a window event to the frontend
                    let _event = app.emit("menu-event", "/frame");
                }
            });
            app.set_menu(menu)?;
            Ok(())
        })
        // .invoke_handler(tauri::generate_handler![floating])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
