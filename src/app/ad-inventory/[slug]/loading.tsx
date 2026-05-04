export default function AdInventoryCategoryLoading() {
    return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center px-8 py-16 bg-white border-b border-border-light">
            <div
                className="h-9 w-9 rounded-full border-2 border-mb-green-dark border-t-transparent animate-spin"
                aria-hidden
            />
            <p className="mt-4 text-sm font-semibold text-text-primary">Opening ad category</p>
            <p className="mt-1 text-xs text-text-tertiary text-center max-w-sm">
                Loading inventory and rules for this vertical.
            </p>
        </div>
    );
}
