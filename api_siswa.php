<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$file = 'db_siswa.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (isset($data['sync']) && $data['sync'] === true) {
        // Sync from Guru BK
        file_put_contents($file, json_encode([
            'students' => $data['students'],
            'violations' => $data['violations']
        ]));
        echo json_encode(['status' => 'success']);
        exit;
    }

    if (isset($data['action']) && $data['action'] === 'login') {
        $nis = $data['nis'] ?? '';
        $pin = $data['pin'] ?? '';
        
        if (file_exists($file)) {
            $db = json_decode(file_get_contents($file), true);
            $students = $db['students'] ?? [];
            $violations = $db['violations'] ?? [];
            
            // File for custom pins
            $pinsFile = 'db_pins.json';
            $customPins = file_exists($pinsFile) ? json_decode(file_get_contents($pinsFile), true) : [];
            
            if (isset($data['newPin']) && $data['newPin']) {
                // Change PIN
                $oldPin = $data['pin'] ?? '';
                $newPin = $data['newPin'] ?? '';
                foreach ($students as $s) {
                    if ($s['nis'] === $nis) {
                        $currentPin = isset($customPins[$nis]) ? $customPins[$nis] : $nis;
                        if ($currentPin === $oldPin) {
                            $customPins[$nis] = $newPin;
                            file_put_contents($pinsFile, json_encode($customPins));
                            echo json_encode(['status' => 'success', 'message' => 'PIN berhasil diubah!']);
                            exit;
                        }
                    }
                }
                echo json_encode(['status' => 'error', 'message' => 'PIN Lama salah!']);
                exit;
            }

            foreach ($students as $s) {
                $expectedPin = isset($customPins[$nis]) ? $customPins[$nis] : $nis;
                if ($s['nis'] === $nis && $pin === $expectedPin) {
                    $studentViolations = array_values(array_filter($violations, function($v) use ($s) {
                        return (string)$v['sId'] === (string)$s['id'];
                    }));
                    
                    echo json_encode([
                        'status' => 'success',
                        'student' => [
                            'nis' => $s['nis'],
                            'name' => $s['name'],
                            'class' => $s['class'],
                            'points' => $s['points'],
                            'status' => $s['status']
                        ],
                        'violations' => $studentViolations
                    ]);
                    exit;
                }
            }
        }
        echo json_encode(['status' => 'error', 'message' => 'NIS atau PIN salah! (Default PIN adalah NIS)']);
        exit;
    }
}
?>
