export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        constructor: resolve(__dirname, 'constructor.html'),
        lk: resolve(__dirname, 'lk.html'),
      },
    },
  },
})