use std::process::Command;

#[tauri::command]
pub fn run_mediapipe(input: String) -> Result<String, String> {
    // eyeDetection実行ファイルのパスを取得
    let resource_path = "resources/eyeDetection/eyeDetection"; // 実行ファイルのパス
    println!("input: {:?}", input); 
    let output = Command::new(resource_path)
        .arg(input)
        .output()
        .map_err(|e| format!("Failed to execute eyeDetection: {}", e))?;

    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        return Err(String::from_utf8_lossy(&output.stderr).to_string())
    }

    Ok(String::from_utf8(output.stdout).unwrap())
}
