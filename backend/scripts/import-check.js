// quick import check for controller/module syntax errors
(async () => {
  try {
    const mod = await import('../controllers/userController.js');
    console.log('Imported userController, exported keys:', Object.keys(mod));
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
})();
