"use client";

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-gray-700/40 backdrop-blur-[2px] animate-fade-in" />

            {/* Modal Panel */}
            <div
                className="relative bg-white rounded-2xl shadow-lg w-full max-w-[480px] mx-4 animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-light">
                    <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-gray-50 transition-colors duration-200"
                        aria-label="Close settings"
                    >
                        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                            <path d="M6.02051 5.31348L8.9668 2.36719L9.67383 3.07422L6.72754 6.02051L9.65332 8.94629L8.94629 9.65332L6.02051 6.72754L3.07422 9.67383L2.36719 8.9668L5.31348 6.02051L2.34668 3.05371L3.05371 2.34668L6.02051 5.31348Z" fill="currentColor" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M8.40039 0C10.3883 0.000211285 11.9998 1.61169 12 3.59961V8.40039C11.9998 10.3883 10.3883 11.9998 8.40039 12H3.59961C1.61169 11.9998 0.000211285 10.3883 0 8.40039V3.59961C0.000211156 1.61169 1.61169 0.000211157 3.59961 0H8.40039ZM3.59961 1C2.16398 1.00021 1.00021 2.16398 1 3.59961V8.40039C1.00021 9.83602 2.16398 10.9998 3.59961 11H8.40039C9.83602 10.9998 10.9998 9.83602 11 8.40039V3.59961C10.9998 2.16398 9.83602 1.00021 8.40039 1H3.59961Z" fill="currentColor" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            TwelveLabs API Key
                        </label>
                        <input
                            type="password"
                            placeholder="Enter your API key"
                            className="w-full px-4 py-2.5 rounded-lg border border-border-light bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-default transition-colors"
                        />
                        <p className="text-xs text-text-tertiary mt-1.5">
                            Your API key is stored locally and never shared.
                        </p>
                    </div>

                    {/* Index Name */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Index Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. my-video-index"
                            className="w-full px-4 py-2.5 rounded-lg border border-border-light bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border-default transition-colors"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-light">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-full border border-border-default text-sm font-medium text-text-primary hover:border-gray-700 transition-all duration-200 hover:rounded-2xl"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-full bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-all duration-200 hover:rounded-2xl"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
