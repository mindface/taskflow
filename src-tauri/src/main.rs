#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod migrations;
mod models;
mod window_capture;

use db::init_db::{init_db, init_schedule_db};
use migrations::run_migrations::run_migrations;

use crate::models::state::PreviewState;
use crate::models::state::ScheduleState;
use std::sync::Mutex;
use std::time::Duration;
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[cfg(target_os = "macos")]
const CLIPBOARD_SHORTCUT: &str = "Cmd+Shift+P";

#[cfg(not(target_os = "macos"))]
const CLIPBOARD_SHORTCUT: &str = "Ctrl+Shift+P";

/// Watches clipboard changes outside the shortcut callback, so native Cmd/Ctrl+C
/// continues to work without blocking the OS keyboard event handler.
fn start_clipboard_history_monitor(app: tauri::AppHandle) {
  std::thread::spawn(move || {
    // Do not save clipboard content that existed before Taskflow started.
    let mut last_content = app.clipboard().read_text().ok();

    loop {
      std::thread::sleep(Duration::from_millis(250));

      let Ok(content) = app.clipboard().read_text() else {
        continue;
      };

      if last_content.as_ref() == Some(&content) {
        continue;
      }

      last_content = Some(content.clone());
      if let Err(error) = db::clipboard_history::save_clipboard_content(&content) {
        log::error!("Failed to save clipboard history: {error}");
      }
    }
  });
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
  crate::commands::user::init_firebase_credentials_from_user_config();

  if let Ok(current_dir) = std::env::current_dir() {
    let dotenv_path = current_dir.join("../.env");
    let _ = dotenvy::from_path(dotenv_path);
  }

  if let Ok(path) = std::env::var("GOOGLE_APPLICATION_CREDENTIALS") {
    println!("認証ファイルを読み込みました: {}", path);
  } else {
    println!("警告: GOOGLE_APPLICATION_CREDENTIALS が設定されていません");
  }

  init_db().unwrap();
  init_schedule_db().unwrap();
  run_migrations().unwrap();

  // if let Ok(firebase_uid) = std::env::var("FIREBASE_UID") {
  //   let _ = crate::commands::user::ensure_user_credential_config(&firebase_uid);
  //   if let Ok(Some(path)) = crate::commands::user::load_saved_user_firebase_credential(&firebase_uid) {
  //     let _ = crate::commands::firestore::google_credentials::apply_saved_google_credentials(&path);
  //   }
  // }

  tauri::Builder::default()
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(
      tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, _shortcut, event| {
          if event.state() != ShortcutState::Pressed {
            return;
          }

          match app.clipboard().read_text() {
            Ok(content) => {
              if let Err(error) = db::clipboard_history::save_clipboard_content(&content) {
                log::error!("Failed to save clipboard history: {error}");
              }
            }
            Err(error) => log::error!("Failed to read clipboard text: {error}"),
          }
        })
        .build(),
    )
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .manage(Mutex::new(PreviewState::default()))
    .manage(Mutex::new(ScheduleState::default()))
    .setup(|app| {
      start_clipboard_history_monitor(app.handle().clone());
      app
        .global_shortcut()
        .register(CLIPBOARD_SHORTCUT)
        .map_err(|error| format!("Failed to register {CLIPBOARD_SHORTCUT}: {error}"))?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::file_operations::add_file,
      commands::file_operations::list_files,
      commands::file_operations::list_image_files,
      commands::file_operations::reading_file,
      commands::file_operations::read_binary_file,
      commands::file_operations::writing_file,
      commands::file_operations::write_binary_file,
      commands::file_operations::ensure_image_dir,
      commands::file_operations::get_desktop_path,
      commands::file_operations::deleting_file,
      commands::file_operations::export_pdf,
      commands::file_operations::export_notes,
      commands::file_operations::import_notes,
      // SQL Memo commands
      commands::sql_memo::add_note,
      commands::sql_memo::list_notes,
      commands::sql_memo::get_note,
      commands::sql_memo::update_note,
      commands::sql_memo::delete_note,
      commands::sql_memo::get_note_detail,
      commands::search_memo::add_search_memo::add_llm_memo,
      commands::search_memo::list_search_memo::list_llm_memo,
      commands::search_memo::get_search_memo::get_llm_memo,
      commands::search_memo::update_search_memo::update_llm_memo,
      commands::search_memo::delete_search_memo::delete_llm_memo,
      commands::search::common_items::search_common_items,
      // commands::sql_memo::list_concepts,
      // commands::sql_memo::get_note_detail,
      // commands::sql_memo::search_concepts,
      commands::preview::open_preview_window,
      commands::preview::sync_content_to_preview,
      commands::preview::open_submemo_window,
      commands::preview::sync_note_data_to_preview,
      commands::turso_notes::turso_create_table,
      commands::turso_notes::turso_create_share_note,
      commands::turso_notes::turso_insert_share_note,
      commands::turso_notes::turso_list_share_notes,
      commands::turso_notes::turso_get_share_note,
      commands::turso_notes::turso_update_share_note,
      commands::turso_notes::turso_delete_share_note,
      commands::view_schedule_window::sync_schedule_to_preview,
      commands::view_schedule_window::open_schedule_window,
      commands::view_schedule_window::get_target_schedule_content,
      commands::preview::get_current_preview_content,
      commands::window_manager::get_all_windows,
      commands::window_manager::get_all_windows_with_thumbnails,
      commands::window_manager::capture_window,
      commands::window_manager::focus_window,
      commands::window_manager::test_enum_windows,
      commands::concept::add_concept::add_concept,
      commands::concept::add_concept_process_factor::add_concept_process_factor,
      commands::concept::add_concept_relation::add_concept_relation,
      commands::concept::add_concept_to_note::add_concept_to_note,
      commands::concept::add_note_concept::add_note_concept,
      commands::concept::list_concepts::list_concepts,
      commands::search::note_concepts::search_note_concepts,
      commands::schedule::add_schedule_task::add_schedule_task,
      commands::schedule::update_schedule_task::update_schedule_task,
      commands::schedule::update_schedule_task::update_start_task,
      commands::schedule::update_schedule_task::update_end_task,
      commands::schedule::add_schedule::add_schedule,
      commands::schedule::update_schedule::update_schedule,
      commands::schedule::delete_schedule::delete_schedule,
      commands::schedule::get_schedule::get_schedule_detail,
      commands::schedule::get_schedule::get_schedule_detail_list,
      commands::schedule::list_schedule_task::list_schedule_task,
      commands::schedule::update_list_schedule_task::update_list_schedule_task,
      commands::firestore::andoroid_list_note::andoroid_list_note,
      commands::firestore::andoroid_update_note::andoroid_update_note,
      commands::firestore::andoroid_list_symbol::andoroid_list_symbol,
      commands::firestore::andoroid_update_symbol::andoroid_update_symbol,
      commands::firestore::andoroid_create_symbol::andoroid_create_symbol,
      commands::user::add_user,
      commands::user::list_users,
      commands::user::save_user_firebase_credential,
      commands::user::get_user_firebase_credential,
      commands::user::update_user,
      db::db_stats::get_db_stats,
      db::clipboard_history::list_clipboard_history,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

  Ok(())
}
