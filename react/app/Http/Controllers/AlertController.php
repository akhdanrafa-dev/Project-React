<?php

namespace App\Http\Controllers;

use App\Models\ProductAlert;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'alert_type' => 'required|in:stock,name,description',
            'new_value' => 'nullable|string',
            'description' => 'required|string',
        ]);

        $alert = ProductAlert::create([
            'product_id' => $validated['product_id'],
            'developer_id' => auth()->id(),
            'alert_type' => $validated['alert_type'],
            'new_value' => $validated['new_value'],
            'description' => $validated['description'],
        ]);

        return response()->json([
            'message' => 'Alert sent to staff successfully',
            'alert' => $alert,
        ]);
    }

    public function getStaffAlerts()
    {
        $alerts = ProductAlert::with(['product', 'developer'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($alert) {
                return [
                    'id' => $alert->id,
                    'product_id' => $alert->product_id,
                    'developer_id' => $alert->developer_id,
                    'alert_type' => $alert->alert_type,
                    'new_value' => $alert->new_value,
                    'description' => $alert->description,
                    'status' => $alert->status,
                    'created_at' => $alert->created_at,
                    'product' => $alert->product ? [
                        'id' => $alert->product->id,
                        'name' => $alert->product->name,
                        'sku' => $alert->product->sku,
                        'stock' => $alert->product->stock,
                        'price' => $alert->product->price,
                        'description' => $alert->product->description,
                    ] : null,
                    'developer' => $alert->developer ? [
                        'id' => $alert->developer->id,
                        'name' => $alert->developer->name,
                    ] : null,
                ];
            });

        return response()->json([
            'alerts' => $alerts,
        ]);
    }

    public function getStaffAlertsHistory()
    {
        $alerts = ProductAlert::with(['product', 'developer'])
            ->whereIn('status', ['completed', 'cancelled'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($alert) {
                return [
                    'id' => $alert->id,
                    'product_id' => $alert->product_id,
                    'developer_id' => $alert->developer_id,
                    'alert_type' => $alert->alert_type,
                    'new_value' => $alert->new_value,
                    'description' => $alert->description,
                    'status' => $alert->status,
                    'created_at' => $alert->created_at,
                    'updated_at' => $alert->updated_at,
                    'completed_at' => $alert->completed_at,
                    'completed_by' => $alert->completed_by,
                    'product' => $alert->product ? [
                        'id' => $alert->product->id,
                        'name' => $alert->product->name,
                        'sku' => $alert->product->sku,
                        'stock' => $alert->product->stock,
                        'price' => $alert->product->price,
                        'description' => $alert->product->description,
                    ] : null,
                    'developer' => $alert->developer ? [
                        'id' => $alert->developer->id,
                        'name' => $alert->developer->name,
                    ] : null,
                ];
            });

        return response()->json([
            'alerts' => $alerts,
        ]);
    }

    public function complete(ProductAlert $alert, Request $request)
    {
        $validated = $request->validate([
            'action' => 'required|in:confirm,cancel',
        ]);

        if ($validated['action'] === 'confirm') {
            $alert->update([
                'status' => 'completed',
                'completed_by' => auth()->id(),
                'completed_at' => now(),
            ]);
        } else {
            $alert->update([
                'status' => 'cancelled',
            ]);
        }

        return response()->json([
            'message' => 'Alert updated successfully',
            'alert' => $alert,
        ]);
    }
}
