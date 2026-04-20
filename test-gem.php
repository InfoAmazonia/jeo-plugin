<?php
$key = ''; // I will just test using curl without key to see if the URL is valid (400 vs 404).
$ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=invalid');
curl_setopt($ch, CURLOPT_POSTFIELDS, '{"model": "models/text-embedding-004", "content": {"parts": [{"text": "Hello"}]}}');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
echo curl_exec($ch);
