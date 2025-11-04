
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[macro_use]
use lindera_core::{mode::Mode, LinderaResult};
use lindera_dictionary::{DictionaryConfig, DictionaryKind};
use lindera_tokenizer::tokenizer::{Tokenizer, TokenizerConfig};
use std::fs;
use std::io::{self, Write};
mod commands;

#[derive(Debug)]
pub enum LinderaError {
    Custom(String),
}

impl std::fmt::Display for LinderaError {
  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
    match self {
      LinderaError::Custom(s) => write!(f, "Custom error: {}", s),
    }
  }
}

// Todo どこかで消す
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))
}

fn main() -> Result<(), Box<dyn std::error::Error>> {

    let dictionary = DictionaryConfig {
        kind: Some(DictionaryKind::IPADIC),
        path: None,
    };

    let config = TokenizerConfig {
        dictionary,
        user_dictionary: None,
        mode: Mode::Normal,
    };

    // create tokenizer
    let tokenizer = Tokenizer::from_config(config)?;

    // tokenize the text
    let tokens = tokenizer.tokenize("関西国際空港限定トートバッグ")?;

    // output the tokens
    for token in tokens {
        println!("{}", token.text);
    }

    tauri::Builder::default()
      .invoke_handler(tauri::generate_handler![
          commands::file_operations::list_files,
          commands::file_operations::reading_file,
          commands::file_operations::writing_file,
          commands::file_operations::add_file,
          commands::file_operations::deleteing_file,
          commands::file_operations::export_pdf,
          commands::file_operations::export_to_csv,
          commands::do_python::run_mediapipe,
          read_file,
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
