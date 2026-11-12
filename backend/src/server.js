import app from "./app.js";

const PORT = process.env.PORT || 5000;

// 📱 Listen on 0.0.0.0 to accept connections from network (mobile devices)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`💻 Local: http://localhost:${PORT}`);
});