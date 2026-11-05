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

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct CampaignFileInfo {
  pub file_name: String,
  pub file_path: String,
  pub modified_timestamp: u64,
  pub content: String,
}

#[tauri::command]
fn save_campaign_file(app: tauri::AppHandle, file_name: String, content: String) -> Result<String, String> {
  let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
  let campaigns_dir = app_data_dir.join("campaigns");

  if !campaigns_dir.exists() {
    fs::create_dir_all(&campaigns_dir).map_err(|e| e.to_string())?;
  }

  let safe_name: String = file_name
    .chars()
    .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
    .collect();

  let file_path = campaigns_dir.join(&safe_name);
  fs::write(&file_path, content).map_err(|e| e.to_string())?;

  Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn list_campaign_files(app: tauri::AppHandle) -> Result<Vec<CampaignFileInfo>, String> {
  let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
  let campaigns_dir = app_data_dir.join("campaigns");

  if !campaigns_dir.exists() {
    return Ok(Vec::new());
  }

  let mut files = Vec::new();
  let entries = fs::read_dir(campaigns_dir).map_err(|e| e.to_string())?;
  for entry in entries.flatten() {
    let path = entry.path();
    if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("json") {
      let metadata = entry.metadata().map_err(|e| e.to_string())?;
      let modified_timestamp = metadata
        .modified()
        .ok()
        .and_then(|m| m.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

      let file_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
      let file_path = path.to_string_lossy().to_string();
      let content = fs::read_to_string(&path).unwrap_or_default();

      files.push(CampaignFileInfo {
        file_name,
        file_path,
        modified_timestamp,
        content,
      });
    }
  }

  // Ordenar de más reciente a más antiguo
  files.sort_by(|a, b| b.modified_timestamp.cmp(&a.modified_timestamp));
  Ok(files)
}

#[tauri::command]
fn read_campaign_file(file_path: String) -> Result<String, String> {
  fs::read_to_string(&file_path).map_err(|e| e.to_string())
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
    .invoke_handler(tauri::generate_handler![
      save_map_file,
      list_map_files,
      save_campaign_file,
      list_campaign_files,
      read_campaign_file
    ])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}