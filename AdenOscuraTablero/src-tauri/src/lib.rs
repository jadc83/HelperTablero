use std::fs;
use tauri::Manager;

#[tauri::command]
fn save_map_file(app: tauri::AppHandle, file_name: String, data: Vec<u8>) -> Result<String, String> {
  let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
  let maps_dir = app_data_dir.join("maps");

  if !maps_dir.exists() {
    fs::create_dir_all(&maps_dir).map_err(|e| e.to_string())?;
  }

  let safe_name: String = file_name
    .chars()
    .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
    .collect();

  let timestamp = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|d| d.as_millis())
    .unwrap_or(0);

  let final_name = format!("{}_{}", timestamp, safe_name);
  let file_path = maps_dir.join(&final_name);

  fs::write(&file_path, data).map_err(|e| e.to_string())?;

  Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn list_map_files(app: tauri::AppHandle) -> Result<Vec<String>, String> {
  let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
  let maps_dir = app_data_dir.join("maps");

  if !maps_dir.exists() {
    return Ok( Vec::new() );
  }

  let mut files = Vec::new();
  let entries = fs::read_dir(maps_dir).map_err(|e| e.to_string())?;
  for entry in entries.flatten() {
    let path = entry.path();
    if path.is_file() {
      files.push(path.to_string_lossy().to_string());
    }
  }
  Ok(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![save_map_file, list_map_files])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}