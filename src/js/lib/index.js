export const promisifiedLoad = (loader, file) => new Promise((resolve, reject) => loader.load(file, resolve, null, reject))
