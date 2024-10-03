export function getUrlParams() {
    const params = new URLSearchParams(window.location.search); // Extrahiert die URL-Parameter

    return Object.fromEntries(
        Array.from(params.entries()).map(([key, value]) => [
            key,
            value.toLowerCase() === 'true' ? true : value.toLowerCase() === 'false' ? false : value
        ])
    );
}