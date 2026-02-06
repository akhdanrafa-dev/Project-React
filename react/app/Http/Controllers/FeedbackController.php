<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Feedback;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'type' => 'required|string|in:bug,feedback,keluhan',
        ]);

        $data = [
            'message' => $request->message,
            'type' => $request->type,
            'ticket_number' => $request->type === 'bug' ? 'TKT-' . rand(1000, 9999) : null,
        ];

        if (auth()->check()) {
            $data['user_id'] = auth()->id();
        }

        $feedback = Feedback::create($data);

        return response()->json(['success' => true, 'data' => $feedback]);
    }
}
