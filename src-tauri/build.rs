fn main() {
  println!("cargo:rerun-if-env-changed=LIBTORCH");

  if let Ok(libtorch_path) = std::env::var("LIBTORCH") {
      println!("LIBTORCH_PATH: {}", libtorch_path);
      // 必要に応じて libtorch のパスを指定
      println!("cargo:rustc-link-lib=dylib=torch_cpu");
      println!("cargo:rustc-link-search=native={}/lib", libtorch_path);
  } else {
      eprintln!("LIBTORCH environment variable not set");
  }
  tauri_build::build()
}
