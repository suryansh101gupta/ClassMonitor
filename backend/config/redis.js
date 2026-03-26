import { createClient } from "redis";

const client = createClient({
  url: "redis://127.0.0.1:6379"
});

client.on("error", (err) => {
  console.error("Redis Error:", err);
});

async function connectRedis() {
  try {
    await client.connect();
    console.log("✅ Redis Connected");
    console.log("[REDIS] connected:", client.isOpen, "ping:", await client.ping());
  } catch (err) {
    console.error("❌ Redis Connection Failed:", err);
  }
}

// Modern export syntax
export { client, connectRedis };