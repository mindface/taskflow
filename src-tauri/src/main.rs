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

fn main() -> Result<(), Box<dyn std::error::Error>> {
  init_db().unwrap();
  init_schedule_db().unwrap();
  run_migrations().unwrap();

  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .manage(Mutex::new(PreviewState::default()))
    .manage(Mutex::new(ScheduleState::default()))
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
      // commands::sql_memo::list_concepts,
      // commands::sql_memo::get_note_detail,
      // commands::sql_memo::search_concepts,
      commands::preview::open_preview_window,
      commands::preview::sync_content_to_preview,
      commands::preview::sync_note_data_to_preview,
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
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

  Ok(())
}

// #[tauri::command]
// fn tokening(name: &str) -> String {
//     let text = "関西国際空港限定トートバッグ";

//     let mut user_dict = UserDictionary::default();
//     let mut tokenizer = Tokenizer::new(Mode::Normal, "", &mut user_dict).unwrap();
//     let tokens = tokenizer.tokenize(text).unwrap();

//     for token in tokens {
//         println!("{:?}", token.text);
//     }

//     format!("Hello, {}! use Lindera!", name)
// }
