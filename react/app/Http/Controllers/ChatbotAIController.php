<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ChatbotAIController extends Controller
{
    public function reply(Request $request)
    {
        $validated = $request->validate([
            'issue_type' => 'required|string|max:120',
            'description' => 'required|string|max:3000',
            'steps' => 'nullable|string|max:3000',
        ]);

        $apiKey = (string) config('services.openai.api_key');
        $model = (string) config('services.openai.model', 'gpt-4.1-mini');
        $endpoint = (string) config('services.openai.endpoint', 'https://api.openai.com/v1/responses');

        if ($apiKey === '') {
            return response()->json([
                'reply' => null,
                'source' => 'disabled',
                'message' => 'OPENAI_API_KEY is not configured.',
            ]);
        }

        $issueType = trim((string) $validated['issue_type']);
        $description = trim((string) $validated['description']);
        $steps = trim((string) ($validated['steps'] ?? ''));

        $systemPrompt = <<<'PROMPT'
Anda adalah asisten support aplikasi web berbahasa Indonesia.
Tujuan:
- Berikan jawaban yang langsung membantu pengguna menyelesaikan pertanyaan.
- Jika pertanyaan tentang navigasi, jawab dengan lokasi menu atau URL yang relevan.
- Jangan langsung mengarahkan membuat laporan kecuali ada indikasi bug/error teknis yang perlu investigasi tim.
- Gunakan gaya bahasa singkat, jelas, dan profesional.
Format:
- Maksimal 3 kalimat.
- Jangan gunakan markdown.
Konteks aplikasi:
- Riwayat Pembelian: /history-pembelian (menu "Riwayat Pembelian" di sidebar).
- Laporan Bug & Support: /laporan-bug.
- Layanan Kami Lainnya: /layanan-kami-lainnya (menu "Layanan Kami Lainnya" di sidebar).
PROMPT;

        $userPrompt = "Jenis masalah: {$issueType}\n"
            . "Deskripsi pengguna: {$description}\n"
            . "Langkah tambahan: " . ($steps !== '' ? $steps : '-');

        try {
            $response = Http::timeout(20)
                ->retry(1, 200)
                ->withToken($apiKey)
                ->acceptJson()
                ->post($endpoint, [
                    'model' => $model,
                    'temperature' => 0.2,
                    'max_output_tokens' => 220,
                    'input' => [
                        [
                            'role' => 'system',
                            'content' => [
                                ['type' => 'input_text', 'text' => $systemPrompt],
                            ],
                        ],
                        [
                            'role' => 'user',
                            'content' => [
                                ['type' => 'input_text', 'text' => $userPrompt],
                            ],
                        ],
                    ],
                ]);

            if (!$response->successful()) {
                Log::warning('Chatbot AI request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return response()->json([
                    'reply' => null,
                    'source' => 'error',
                    'message' => 'AI request failed.',
                ], 502);
            }

            $payload = $response->json();
            $reply = $this->extractReplyText($payload);

            if ($reply === null || $reply === '') {
                return response()->json([
                    'reply' => null,
                    'source' => 'empty',
                    'message' => 'AI returned empty output.',
                ]);
            }

            $cleanReply = Str::limit((string) Str::of($reply)->squish(), 420, '...');

            return response()->json([
                'reply' => $cleanReply,
                'source' => 'ai',
            ]);
        } catch (\Throwable $exception) {
            Log::error('Chatbot AI exception', [
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'reply' => null,
                'source' => 'error',
                'message' => 'AI service unavailable.',
            ], 500);
        }
    }

    private function extractReplyText(array $payload): ?string
    {
        $directOutputText = data_get($payload, 'output_text');
        if (is_string($directOutputText) && trim($directOutputText) !== '') {
            return trim($directOutputText);
        }

        $output = $payload['output'] ?? null;
        if (!is_array($output)) {
            return null;
        }

        foreach ($output as $item) {
            $content = $item['content'] ?? null;
            if (!is_array($content)) {
                continue;
            }

            foreach ($content as $part) {
                $text = $part['text'] ?? null;
                if (is_string($text) && trim($text) !== '') {
                    return trim($text);
                }
            }
        }

        return null;
    }
}

