<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcessSessionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mode' => 'required|in:PROFILE,ACTION',
            'quality' => 'required|in:FAST,BALANCED,BEST',
            'count' => 'required|integer|in:1,3,5,10',
            'sample_rate' => 'required|integer|in:15,30,45',
        ];
    }
}
