// Schema Database yang disesuaikan dengan struktur asli dari aplikasi React
var databaseSchema = {
  "students": ["nis", "name", "class", "points", "status", "id"],
  "graduatedStudents": ["nis", "name", "class", "reason", "date", "id"],
  // Kolom ID dan sId diletakkan di paling akhir agar bisa disembunyikan
  "violations": ["nis", "namaSiswa", "kelasSiswa", "type", "date", "tahun", "pts", "note", "id", "sId"],
  "prestasi": ["nis", "namaSiswa", "kelasSiswa", "rank", "event", "className", "date", "tahun", "id", "sId"],
  "homeVisits": ["nis", "namaSiswa", "kelasSiswa", "wali", "result", "date", "tahun", "id", "sId"],
  "monitoringHistory": ["nis", "namaSiswa", "kelasSiswa", "date", "tahun", "note", "id", "sId"],
  "notifications": ["msg", "read", "id"],
  "Settings": ["Key", "Value"]
};

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(databaseSchema).forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    
    // Jika sheet belum ada, buat baru
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Mengisi header di baris pertama sesuai skema
    var headers = databaseSchema[sheetName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Mempercantik header (Tebal & Freeze)
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
    
    // Sembunyikan kolom sistem (id, sId) agar tabel terlihat bersih khusus untuk pengguna
    for (var i = 0; i < headers.length; i++) {
      if (headers[i] === "id" || headers[i] === "sId") {
        sheet.hideColumns(i + 1);
      }
    }
  });
  
  return "Setup Berhasil! Semua sheet dan header telah siap dengan struktur yang akurat.";
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var arrayKeys = [
      "students", "graduatedStudents", "violations", 
      "prestasi", "homeVisits", "monitoringHistory", "notifications"
    ];
    
    arrayKeys.forEach(function(key) {
      if (data[key] && Array.isArray(data[key])) {
        var sheet = ss.getSheetByName(key);
        if (!sheet) {
          sheet = ss.insertSheet(key);
        }
        
        sheet.clear();
        
        var items = data[key];
        if (items.length > 0) {
          // --- ENRICH DATA ---
          // Tambahkan Nama dan Kelas agar mudah dibaca di Sheet
          if (key !== 'students' && data['students']) {
            var studentMap = {};
            var studentIntMap = {}; // Fallback untuk ID yang sebelumnya terpotong oleh parseInt
            data['students'].forEach(function(s) {
              studentMap[s.id] = { nis: s.nis, name: s.name, className: s.class };
              studentIntMap[Math.floor(s.id)] = { nis: s.nis, name: s.name, className: s.class };
            });
            
            items = items.map(function(item) {
              var sInfo = studentMap[item.sId] || studentIntMap[Math.floor(item.sId)] || studentIntMap[item.sId];
              if (item.sId && sInfo) {
                var newItem = Object.assign({}, item);
                newItem.nis = sInfo.nis;
                newItem.namaSiswa = sInfo.name;
                newItem.kelasSiswa = sInfo.className;
                
                if (newItem.date) {
                  var d = new Date(newItem.date);
                  if (!isNaN(d.getFullYear())) {
                    newItem.tahun = d.getFullYear();
                  }
                }
                return newItem;
              }
              return item;
            });
          }
          
          var headers = databaseSchema[key] || Object.keys(items[0]);
          var rows = [headers];
          
          items.forEach(function(item) {
            var row = headers.map(function(h) {
              var val = item[h] !== undefined ? item[h] : ""; 
              if (typeof val === 'object') return JSON.stringify(val);
              return "'" + val; 
            });
            rows.push(row);
          });
          
          sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
          sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
          sheet.setFrozenRows(1);
          
          // Sembunyikan kolom ID dan sId agar tampilan bersih
          for (var i = 0; i < headers.length; i++) {
            if (headers[i] === "id" || headers[i] === "sId") {
              sheet.hideColumns(i + 1);
            } else {
              sheet.showColumns(i + 1); // pastikan kolom data utama terlihat
            }
          }
        }
      }
    });
    
    // Simpan Settings (seperti logoUrl)
    var settingsSheet = ss.getSheetByName("Settings");
    if (!settingsSheet) settingsSheet = ss.insertSheet("Settings");
    settingsSheet.clear();
    
    var settingsRows = [["Key", "Value"]];
    if (data.logoUrl) settingsRows.push(["logoUrl", data.logoUrl]);
    if (data.passwordHash) settingsRows.push(["passwordHash", data.passwordHash]);
    
    settingsSheet.getRange(1, 1, settingsRows.length, 2).setValues(settingsRows);
    settingsSheet.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#f3f3f3");
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Seluruh data berhasil disinkronisasi ke Spreadsheet"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error", 
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'setup') {
    return ContentService.createTextOutput(setupDatabase());
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var response = {};
  
  var arrayKeys = [
    "students", "graduatedStudents", "violations", 
    "prestasi", "homeVisits", "monitoringHistory", "notifications"
  ];
  
  arrayKeys.forEach(function(key) {
    var sheet = ss.getSheetByName(key);
    response[key] = [];
    if (sheet) {
      var data = sheet.getDataRange().getDisplayValues();
      if (data.length > 1) {
        var headers = data[0];
        for (var i = 1; i < data.length; i++) {
          var obj = {};
          for (var j = 0; j < headers.length; j++) {
            var cellValue = data[i][j];
            if (cellValue && typeof cellValue === 'string' && cellValue.startsWith("'")) {
              cellValue = cellValue.substring(1);
            }
            
            if (!isNaN(cellValue) && cellValue !== "") {
              obj[headers[j]] = Number(cellValue);
            } else if (cellValue === "true") {
              obj[headers[j]] = true;
            } else if (cellValue === "false") {
              obj[headers[j]] = false;
            } else {
              obj[headers[j]] = cellValue;
            }
          }
          response[key].push(obj);
        }
      }
    }
  });
  
  var settingsSheet = ss.getSheetByName("Settings");
  if (settingsSheet) {
    var sData = settingsSheet.getDataRange().getValues();
    for (var i = 1; i < sData.length; i++) {
      if (sData[i][0] === "logoUrl") {
        response.logoUrl = sData[i][1];
      } else if (sData[i][0] === "passwordHash") {
        response.passwordHash = sData[i][1];
      }
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
