<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$file = 'pengaduan.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true);
    } else {
        $data = $_POST;
        if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $ext = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
            $filename = time() . '_' . rand(100, 999) . '.' . $ext;
            $targetPath = $uploadDir . $filename;
            if (move_uploaded_file($_FILES['foto']['tmp_name'], $targetPath)) {
                $data['foto'] = $targetPath;
            }
        }
    }
    
    if ($data) {
        $current = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
        if (!is_array($current)) $current = [];
        $data['id'] = time() . rand(100, 999);
        $data['timestamp'] = date('Y-m-d H:i:s');
        $current[] = $data;
        file_put_contents($file, json_encode($current));
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No data']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['get_ip'])) {
    // Return local IP address to build a public-facing QR code URL
    $ip = getHostByName(getHostName());
    // Fallback if IP is 127.0.0.1
    if ($ip === '127.0.0.1' || $ip === '::1') {
        $ip = $_SERVER['SERVER_ADDR'];
    }
    echo json_encode(['ip' => $ip]);
    exit;
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $current = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
    echo json_encode($current);
    
    // Clear data if requested
    if (isset($_GET['clear']) && $_GET['clear'] == '1' && !empty($current)) {
        file_put_contents($file, json_encode([]));
    }
}
?>
