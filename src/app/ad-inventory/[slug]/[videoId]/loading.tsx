export default function AdInventoryVideoDetailLoading() {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-8 py-16 bg-white">
            <div
                className="h-10 w-10 rounded-full border-2 border-mb-green-dark border-t-transparent animate-spin"
                aria-hidden
            />
            <p className="mt-5 text-sm font-semibold text-text-primary">Opening video</p>
            <p className="mt-1.5 text-xs text-text-tertiary text-center max-w-md leading-relaxed">
                Loading the ad creative. Analysis with Pegasus and semantic IAB starts next and can take several minutes; you will see a clear progress message on the page.
            </p>
        </div>
    );
}
