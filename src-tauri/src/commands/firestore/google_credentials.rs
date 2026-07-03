use std::fs;
use std::path::PathBuf;

pub fn google_application_credentials_path() -> PathBuf {
  PathBuf::from("/Users/asdfghjkl/program/rust/taskflow/mymodular-256390a262.json")
}

pub fn google_application_credentials_json() -> Result<String, String> {
  let path: PathBuf = google_application_credentials_path();
  std::env::set_var("GOOGLE_APPLICATION_CREDENTIALS", &path);
  println!("GOOGLE_APPLICATION_CREDENTIALS={}", path.display());
  fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path.display(), e))
}
